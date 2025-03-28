const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const nunjucks = require('nunjucks');

const ARTICLES_DIR = 'articles';
const OUTPUT_DIR = 'docs';
const TEMPLATES_DIR = 'templates';
const STATIC_DIR = 'static';
const ARTICLES_PER_PAGE = 10;
const START_YEAR = 2009;

nunjucks.configure(TEMPLATES_DIR, { autoescape: true });

function loadArticles() {
  const files = fs.readdirSync(ARTICLES_DIR);
  const articles = [];

  for (const file of files) {
    if (!file.endsWith('.md')) continue;

    const filePath = path.join(ARTICLES_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(raw);

    const [year, month, day] = file.slice(0, 10).split('-');
    const slug = file.slice(11, -3);

    const htmlBody = marked.parse(content);
    const url = `/posts/${year}/${month}/${slug}.html`;

    articles.push({
      title: data.title,
      slug,
      date: `${year}/${month}/${day}`,
      body: htmlBody,
      url,
    });
  }

  articles.sort((a, b) => new Date(b.date) - new Date(a.date));
  return articles;
}

function paginate(articles, pageSize) {
  const pages = [];
  for (let i = 0; i < articles.length; i += pageSize) {
    pages.push(articles.slice(i, i + pageSize));
  }
  return pages;
}

function generateIndexPages(paginatedArticles) {
  paginatedArticles.forEach((articles, i) => {
    const page = i + 1;
    const html = nunjucks.render('index.njk', {
      articles,
      currentPage: page,
      totalPages: paginatedArticles.length,
    });

    const dir = page === 1 ? OUTPUT_DIR : path.join(OUTPUT_DIR, 'page', String(page));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
  });
}

function generatePostPages(articles) {
  for (const article of articles) {
    const [year, month] = article.date.split('/');

    const dir = path.join(OUTPUT_DIR, 'posts', year, month);
    fs.mkdirSync(dir, { recursive: true });

    const html = nunjucks.render('post.njk', { article });
    fs.writeFileSync(path.join(dir, `${article.slug}.html`), html);
  }
}

function copyStaticAssets() {
  const src = path.join(process.cwd(), STATIC_DIR);
  const dest = path.join(process.cwd(), OUTPUT_DIR);

  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
  }
}

function generateRedirectHtml(target = '/') {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0; url=${target}" />
    <title>Redirecting...</title>
  </head>
  <body>
    <p>Redirecting to <a href="${target}">${target}</a>.</p>
  </body>
</html>`;
}

function generatePageIndexRedirect() {
  const dir = path.join(OUTPUT_DIR, 'page');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), generateRedirectHtml('/'));
}

function generateMonthlyRedirectPages() {
  const start = new Date(START_YEAR, 0);
  const now = new Date();
  const current = new Date(now.getFullYear(), now.getMonth());

  for (let date = new Date(start); date <= current; date.setMonth(date.getMonth() + 1)) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dir = path.join(OUTPUT_DIR, 'posts', year.toString(), month);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), generateRedirectHtml('/'));
  }
}

function main() {
  const articles = loadArticles();
  const paginated = paginate(articles, ARTICLES_PER_PAGE);
  generateIndexPages(paginated);
  generatePostPages(articles);
  copyStaticAssets();
  generatePageIndexRedirect();
  generateMonthlyRedirectPages();
}

main();
