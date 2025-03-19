document.addEventListener("DOMContentLoaded", () => {
    const newsContainer = document.getElementById("news-container");
    const refreshButton = document.getElementById("refresh");
    const newsSourceSelect = document.getElementById("news-source");

    // CORS Proxy to bypass restrictions
    const CORS_PROXY = "https://api.allorigins.win/raw?url=";

    // RSS feed URLs
    const RSS_SOURCES = {
        nhk: "https://www3.nhk.or.jp/rss/news/cat0.xml",
        japanTimes: "https://www.japantimes.co.jp/feed/",
        japanToday: "https://japantoday.com/feed",
        mainichi: "https://mainichi.jp/rss/etc/mainichi-flash.rss"
    };

    // Placeholder image
    const DEFAULT_IMAGE = "https://placehold.co/150x100?text=No+Image";

    // Fetch and parse RSS feed
    async function fetchNews(source) {
        try {
            // NHK does not require a CORS proxy, others do
            const isNHK = source.includes("nhk.or.jp");
            const url = isNHK ? source : CORS_PROXY + encodeURIComponent(source);

            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

            // Get XML response directly (no JSON parsing)
            const xmlText = await response.text();

            const parser = new DOMParser();
            const xml = parser.parseFromString(xmlText, "text/xml");

            // Extract news items from the RSS feed
            const items = Array.from(xml.querySelectorAll("item")).map(item => ({
                title: item.querySelector("title")?.textContent || "No title",
                link: item.querySelector("link")?.textContent || "#",
                pubDate: item.querySelector("pubDate")?.textContent || "Unknown date",
                description: truncateDescription(item.querySelector("description")?.textContent || "No description", 150, item.querySelector("link")?.textContent),
                image: getImageFromItem(item)
            }));

            displayNews(items);
        } catch (error) {
            console.error("Failed to fetch RSS:", error);
            newsContainer.innerHTML = "<p>Failed to load news. Please try again later.</p>";
        }
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

    // Display news articles in the news container
    function displayNews(items) {
        newsContainer.innerHTML = "";
        items.forEach(item => {
            const article = document.createElement("article");

            article.innerHTML = `
                <img src="${item.image}" alt="News Image" style="max-width: 100%; height: auto;">
                <h3><a href="${item.link}" target="_blank">${item.title}</a></h3>
                <p>${item.description}</p>
                <p><small>${new Date(item.pubDate).toLocaleDateString()}</small></p>
            `;

            newsContainer.appendChild(article);
        });
    }

    // Load default news source (NHK) when the page loads
    fetchNews(RSS_SOURCES.nhk);

    // Refresh button event: Load selected news source
    refreshButton.addEventListener("click", () => {
        fetchNews(RSS_SOURCES[newsSourceSelect.value]);
    });
});
