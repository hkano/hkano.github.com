const fs = require("fs-extra");
const path = require("path");
const matter = require("gray-matter");
const marked = require("marked");
const glob = require("glob");

const articleDir = "articles";
const postDir = "posts";
const layoutTemplatePath = "templates/layout.html";
const indexTemplatePath = "templates/index.html";
const headerPath = "templates/partials/header.html";
const footerPath = "templates/partials/footer.html";
const pageSize = 10;

const layoutTemplate = fs.readFileSync(layoutTemplatePath, "utf8");
const indexTemplate = fs.readFileSync(indexTemplatePath, "utf8");
const header = fs.readFileSync(headerPath, "utf8");
const footer = fs.readFileSync(footerPath, "utf8");

const files = glob.sync(`${articleDir}/*.md`).sort().reverse();
const articles = files.map(filepath => {
  const fileContent = fs.readFileSync(filepath, "utf8");
  const { data, content } = matter(fileContent);
  const fileName = path.basename(filepath, ".md");
  const [year, month, day, ...slugParts] = fileName.split("-");
  const slug = slugParts.join("-");
  return {
    title: data.title,
    date: `${year}/${month}/${day}`,
    slug,
    html: marked.parse(content),
    excerpt: content.trim().split("\n")[0].slice(0, 100),
    url: `/posts/${year}/${month}/${slug}.html`,
    year, month
  };
});

// Generate individual article pages
for (const article of articles) {
  const outDir = path.join(postDir, article.year, article.month);
  fs.ensureDirSync(outDir);
  const outPath = path.join(outDir, `${article.slug}.html`);
  const html = layoutTemplate
    .replace("{{ header }}", header)
    .replace("{{ footer }}", footer)
    .replaceAll("{{ title }}", article.title)
    .replaceAll("{{ date }}", article.date)
    .replace("{{ content }}", article.html);
  fs.writeFileSync(outPath, html);
}

// Generate top page with article cards
const listCards = articles.map(article => {
  return `
    <div class="article-card">
      <h2><a href="${article.url}">${article.title}</a></h2>
      <p>${article.excerpt}...</p>
      <small>${article.date}</small>
    </div>
  `;
});

const totalPages = Math.ceil(articles.length / pageSize);
for (let page = 0; page < totalPages; page++) {
  const start = page * pageSize;
  const end = start + pageSize;
  const pageContent = listCards.slice(start, end).join("\n");

  const finalHtml = indexTemplate
    .replace("{{ header }}", header)
    .replace("{{ footer }}", footer)
    .replace("{{ content }}", pageContent);

  if (page === 0) {
    fs.writeFileSync("index.html", finalHtml);
  } else {
    const pageDir = path.join("page", String(page + 1));
    fs.ensureDirSync(pageDir);
    fs.writeFileSync(path.join(pageDir, "index.html"), finalHtml);
  }
}
