const fs = require("fs-extra");
const path = require("path");
const matter = require("gray-matter");
const marked = require("marked");
const glob = require("glob");

const articleDir = "articles";
const postDir = "posts";
const templatePath = "templates/layout.html";
const pageSize = 10;

const layoutTemplate = fs.readFileSync(templatePath, "utf8");

const files = glob.sync(`${articleDir}/*.md`).sort().reverse();
const articles = files.map(filepath => {
  const fileContent = fs.readFileSync(filepath, "utf8");
  const { data, content } = matter(fileContent);
  const fileName = path.basename(filepath, ".md");
  const [year, month, day, ...slugParts] = fileName.split("-");
  const slug = slugParts.join("-");
  return {
    title: data.title,
    date: `${year}-${month}-${day}`,
    slug,
    html: marked.parse(content),
    url: `/posts/${year}/${month}/${slug}.html`,
    year, month
  };
});

for (const article of articles) {
  const outDir = path.join(postDir, article.year, article.month);
  fs.ensureDirSync(outDir);
  const outPath = path.join(outDir, `${article.slug}.html`);
  const html = layoutTemplate
    .replaceAll("{{ title }}", article.title)
    .replaceAll("{{ date }}", article.date)
    .replaceAll("{{ content }}", article.html);
  fs.writeFileSync(outPath, html);
}

const listItems = articles.map(a =>
  `<li><a href="${a.url}">${a.title}</a> <small>${a.date}</small></li>`
);

const totalPages = Math.ceil(listItems.length / pageSize);
for (let page = 0; page < totalPages; page++) {
  const start = page * pageSize;
  const end = start + pageSize;
  const pageItems = listItems.slice(start, end).join("\n");
  const pageHtml = `<h2>Articles</h2><ul>${pageItems}</ul>`;
  const fullHtml = layoutTemplate
    .replaceAll("{{ title }}", "Blog")
    .replaceAll("{{ date }}", "")
    .replaceAll("{{ content }}", pageHtml);

  if (page === 0) {
    fs.writeFileSync("index.html", fullHtml);
  } else {
    const pageDir = path.join("page", String(page + 1));
    fs.ensureDirSync(pageDir);
    fs.writeFileSync(path.join(pageDir, "index.html"), fullHtml);
  }
}
