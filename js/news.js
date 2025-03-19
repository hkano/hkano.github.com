document.addEventListener("DOMContentLoaded", () => {
    const newsContainer = document.getElementById("news-container");
    const refreshButton = document.getElementById("refresh");
    const newsSourceSelect = document.getElementById("news-source");
    const prevPageButton = document.getElementById("prev-page");
    const nextPageButton = document.getElementById("next-page");
    const pageInfo = document.getElementById("page-info");
    const searchInput = document.getElementById("search-keyword");
    const sortOrderSelect = document.getElementById("sort-order");

    // RSS feed URLs
    const RSS_SOURCES = {
        japanTimes: "https://www.japantimes.co.jp/rss/news",
        nhk: "https://www3.nhk.or.jp/rss/news/cat0.xml",
        mainichi: "https://mainichi.jp/rss/etc/mainichi-flash.rss",
        japanToday: "https://japantoday.com/feed"
    };

    // Default placeholder image
    const DEFAULT_IMAGE = "https://placehold.co/150x100?text=No+Image";

    // Pagination & filtering variables
    const ITEMS_PER_PAGE = 10;
    let currentPage = 1;
    let totalPages = 1;
    let allNewsItems = [];
    let filteredNewsItems = [];

    // Fetch and parse RSS feed
    async function fetchNews(source) {
        try {
            const response = await fetch(source);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

            const xmlText = await response.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(xmlText, "text/xml");

            // Extract items from RSS feed
            allNewsItems = Array.from(xml.querySelectorAll("item")).map(item => ({
                title: item.querySelector("title")?.textContent || "No title",
                link: item.querySelector("link")?.textContent || "#",
                pubDate: new Date(item.querySelector("pubDate")?.textContent || Date.now()),
                description: item.querySelector("description")?.textContent || "No description",
                image: getImageFromItem(item)
            }));

            // Apply filtering and sorting
            filterAndSortNews();
        } catch (error) {
            console.error("Failed to fetch RSS:", error);
            newsContainer.innerHTML = "<p>Failed to load news. Please try again later.</p>";
        }
    }

    // Extract image from RSS item
    function getImageFromItem(item) {
        const enclosure = item.querySelector("enclosure");
        if (enclosure && enclosure.getAttribute("url")) {
            return enclosure.getAttribute("url");
        }
        const imgMatch = item.querySelector("description")?.textContent.match(/<img.*?src=["'](.*?)["']/);
        if (imgMatch && imgMatch[1]) return imgMatch[1];
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
        filteredNewsItems.sort((a, b) => sortOrder === "newest" ? b.pubDate - a.pubDate : a.pubDate - b.pubDate);

        // Reset pagination
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

            article.innerHTML = `
                <img src="${item.image}" alt="News Image" style="max-width: 100%; height: auto;">
                <h3><a href="${item.link}" target="_blank">${item.title}</a></h3>
                <p>${truncateDescription(item.description, 150, item.link) || "No description available."}</p>
                <p><small>${item.pubDate.toLocaleDateString()}</small></p>
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
