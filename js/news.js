document.addEventListener("DOMContentLoaded", () => {
    const newsContainer = document.getElementById("news-container");
    const refreshButton = document.getElementById("refresh");
    const newsSourceSelect = document.getElementById("news-source");
    const prevPageButton = document.getElementById("prev-page");
    const nextPageButton = document.getElementById("next-page");
    const pageInfo = document.getElementById("page-info");
    const searchInput = document.getElementById("search-keyword");
    const sortOrderSelect = document.getElementById("sort-order");

    // RSS feed URLs for different news sources
    const RSS_SOURCES = {
        japanTimes: "https://www.japantimes.co.jp/rss/news",
        nhk: "https://www3.nhk.or.jp/rss/news/cat0.xml",
        mainichi: "https://mainichi.jp/rss/etc/mainichi-flash.rss",
        japanToday: "https://japantoday.com/feed"
    };

    // Default placeholder image
    const DEFAULT_IMAGE = "https://via.placeholder.com/150?text=No+Image";

    // Pagination & filtering variables
    const ITEMS_PER_PAGE = 10;
    let currentPage = 1;
    let totalPages = 1;
    let allNewsItems = [];
    let filteredNewsItems = [];

    // Fetch and parse RSS feed
    async function fetchNews(source) {
        try {
            const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source)}`);
            const data = await response.json();
            allNewsItems = data.items;
            filterAndSortNews(); // Apply filters and sorting on initial load
        } catch (error) {
            console.error("Failed to load news", error);
            newsContainer.innerHTML = "<p>Failed to load news. Please try again later.</p>";
        }
    }

    // Extract image from RSS item
    function getImageFromItem(item) {
        if (item.enclosure && item.enclosure.link) {
            return item.enclosure.link;
        }
        const imgMatch = item.description.match(/<img.*?src=["'](.*?)["']/);
        if (imgMatch && imgMatch[1]) {
            return imgMatch[1];
        }
        return DEFAULT_IMAGE;
    }

    // Truncate long descriptions and add "Read more" link
    function truncateDescription(description, maxLength, link) {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = description;
        const text = tempDiv.textContent || tempDiv.innerText || "";
        if (text.length > maxLength) {
            return `${text.substring(0, maxLength)}... <a href="${link}" target="_blank">Read more</a>`;
        }
        return text;
    }

    // Filter and sort news based on search & sort order
    function filterAndSortNews() {
        const searchKeyword = searchInput.value.toLowerCase();
        const sortOrder = sortOrderSelect.value;

        // Filter by keyword
        filteredNewsItems = allNewsItems.filter(item =>
            item.title.toLowerCase().includes(searchKeyword) ||
            item.description.toLowerCase().includes(searchKeyword)
        );

        // Sort by date
        filteredNewsItems.sort((a, b) => {
            const dateA = new Date(a.pubDate);
            const dateB = new Date(b.pubDate);
            return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
        });

        // Update pagination
        currentPage = 1;
        totalPages = Math.ceil(filteredNewsItems.length / ITEMS_PER_PAGE);
        displayNews();
    }

    // Display paginated news articles
    function displayNews() {
        newsContainer.innerHTML = "";
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const paginatedItems = filteredNewsItems.slice(startIndex, endIndex);

        paginatedItems.forEach(item => {
            const article = document.createElement("article");
            const imageUrl = getImageFromItem(item);

            article.innerHTML = `
                <img src="${imageUrl}" alt="News Image" style="max-width: 100%; height: auto;">
                <h3><a href="${item.link}" target="_blank">${item.title}</a></h3>
                <p>${truncateDescription(item.description, 150, item.link)}</p>
                <p><small>${new Date(item.pubDate).toLocaleDateString()}</small></p>
            `;

            newsContainer.appendChild(article);
        });

        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        updatePaginationButtons();
    }

    // Update pagination button states
    function updatePaginationButtons() {
        prevPageButton.disabled = currentPage === 1;
        nextPageButton.disabled = currentPage === totalPages || totalPages === 0;
    }

    // Load default news source on page load
    fetchNews(RSS_SOURCES.japanTimes);

    // Fetch news when the refresh button is clicked
    refreshButton.addEventListener("click", () => {
        fetchNews(RSS_SOURCES[newsSourceSelect.value]);
    });

    // Search & sort event listeners
    searchInput.addEventListener("input", filterAndSortNews);
    sortOrderSelect.addEventListener("change", filterAndSortNews);

    // Pagination event listeners
    prevPageButton.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            displayNews();
        }
    });

    nextPageButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayNews();
        }
    });
});
