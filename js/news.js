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
    const DEFAULT_LOADING_IMAGE = "https://placehold.co/150x100?text=Loading";
    const DEFAULT_NO_IMAGE = "https://placehold.co/150x100?text=No+Image";

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

    // Refreshes news based on the selected source
    function refreshNews() {
        const source = document.getElementById("news-source").value;
        fetchNews(source);
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
    async function getImageFromItem(item) {
        // 1. Check for `media:thumbnail`
        if (item["media:thumbnail"] && item["media:thumbnail"].url) {
            return item["media:thumbnail"].url;
        }

        // 2. Check for `media:content`
        if (item["media:content"] && item["media:content"].url) {
            return item["media:content"].url;
        }  
        
        // 3. Check for `enclosure` tag
        if (item.enclosure && item.enclosure.url) {
            return item.enclosure.url;
        }

        // 4. Check for image inside `description`
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = item.description || "";
        const imgTag = tempDiv.querySelector("img");
        if (imgTag) {
            return imgTag.getAttribute("src");
        }

        // 5. Fetch OGP image
        if (item.link) {
            return await fetchOGPImage(item.link);
        }

        // 6. Return placeholder image if no image found
        return DEFAULT_NO_IMAGE;
    }

    // Fetch OGP image from an article page
    async function fetchOGPImage(url) {
        try {
            const proxyUrl = "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, "text/html");
            const ogImageMeta = doc.querySelector('meta[property="og:image"]');

            return ogImageMeta ? ogImageMeta.getAttribute("content") : DEFAULT_NO_IMAGE;
        } catch {
            return DEFAULT_NO_IMAGE;
        }
    }

    // Display news articles in the news container
    async function displayNews(items) {
        newsContainer.innerHTML = "";

        items.forEach((item, index) => {
            const article = document.createElement("article");

            if (index < 10) {
                // Display image for the first 10 items
                const imageElement = document.createElement("img");
                imageElement.src = DEFAULT_LOADING_IMAGE;
                imageElement.alt = "News Image";
                imageElement.style = "max-width: 150px; height: auto; object-fit: cover; border-radius: 8px;";

                article.innerHTML = `
                    <h3>
                        <a href="${item.link}" target="_blank">${item.title}</a>
                    </h3>
                    <p>${item.description}</p>
                    <p><small>${new Date(item.pubDate).toLocaleDateString()}</small></p>
                `;

                article.insertBefore(imageElement, article.firstChild);
                newsContainer.appendChild(article);
            
                // Load the actual image asynchronously
                getImageFromItem(item).then((imageUrl) => {
                    imageElement.src = imageUrl;
                });

            } else {
                // Design change for items beyond the 10th item (no image, compact layout)
                article.innerHTML = `
                    <h4 style="font-size: 14px; margin-bottom: 4px;">
                       <a href="${item.link}" target="_blank">${item.title}</a>
                    </h4>
                    <p style="font-size: 12px; color: gray;">${new Date(item.pubDate).toLocaleDateString()}</p>
                `;
            }

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
