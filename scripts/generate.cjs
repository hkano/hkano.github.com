const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const nunjucks = require('nunjucks');

nunjucks.configure('templates', { autoescape: true });

const ARTICLES_DIR = 'articles';
const OUTPUT_DIR = 'docs';
const STATIC_DIR = 'static';
const ARTICLES_PER_PAGE = 10;
const START_YEAR = 2009;

function main() {
  const articles = loadArticles();
  generatePostPages(articles);
  generateIndexPages(articles);
  generatePageDirectoriesRedirect();
  generatePostsDirectoriesRedirect(articles);
  copyStaticAssets();
}

function loadArticles() {
  const files = fs.readdirSync(ARTICLES_DIR);
  const articles = files
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const filePath = path.join(ARTICLES_DIR, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(raw);
      const { date, slug } = generateDateAndSlug(file);
      const [year, month] = date.split('-');
      return {
        title: data.title || 'Untitled',
        date,
        slug,
        url: `/posts/${year}/${month}/${slug}.html`,
        body: marked.parse(content),
      };
    });
  articles.sort((a, b) => new Date(b.date) - new Date(a.date));
  return articles;
}

function generatePostPages(articles) {
  articles.forEach(article => {
    const [year, month] = article.date.split('-');
    const filePath = path.join(OUTPUT_DIR, 'posts', year, month, `${article.slug}.html`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const html = nunjucks.render('post.njk', { article });
    fs.writeFileSync(filePath, html);
  });
}

function generateIndexPages(articles) {
  const totalPages = Math.ceil(articles.length / ARTICLES_PER_PAGE);
  for (let page = 1; page <= totalPages; page++) {
    const start = (page - 1) * ARTICLES_PER_PAGE;
    const end = page * ARTICLES_PER_PAGE;
    const articlesSubset = articles.slice(start, end);
    const html = nunjucks.render('index.njk', {
      articles: articlesSubset,
      currentPage: page,
      totalPages,
    });
    const filePath = page === 1
      ? path.join(OUTPUT_DIR, 'index.html')
      : path.join(OUTPUT_DIR, 'page', String(page), 'index.html');
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, html);
  }
}

function generatePageDirectoriesRedirect() {
  const dir = path.join(OUTPUT_DIR, 'page');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), generateRedirectHtml('/'));
}

function generatePostsDirectoriesRedirect(articles) {
  const postsRoot = path.join(OUTPUT_DIR, 'posts');
  fs.mkdirSync(postsRoot, { recursive: true });
  fs.writeFileSync(path.join(postsRoot, 'index.html'), generateRedirectHtml('/'));

  for (let year = START_YEAR; year <= new Date().getFullYear(); year++) {
    const yearDir = path.join(postsRoot, String(year));
    fs.mkdirSync(yearDir, { recursive: true });
    fs.writeFileSync(path.join(yearDir, 'index.html'), generateRedirectHtml('/'));
  }

  articles.forEach(article => {
    const [year, month] = article.date.split('-');
    const monthDir = path.join(postsRoot, year, month);
    const indexPath = path.join(monthDir, 'index.html');
    if (!fs.existsSync(indexPath)) {
      fs.mkdirSync(monthDir, { recursive: true });
      fs.writeFileSync(indexPath, generateRedirectHtml('/'));
    }
  });
}

function copyStaticAssets() {
  const staticDir = path.join(process.cwd(), STATIC_DIR);
  if (fs.existsSync(staticDir)) {
    fs.cpSync(staticDir, OUTPUT_DIR, { recursive: true });
  }
}

function generateDateAndSlug(fileName) {
  const name = path.parse(fileName).name;
  const [year, month, day, ...slugParts] = name.split('-');
  const date = `${year}-${month}-${day}`;
  const slug = slugParts.join('-');
  return { date, slug };
}

function generateRedirectHtml(target = '/') {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0; url=${target}" />
    <title>Redirecting...</title>
  </head>
  <body></body>
</html>`;
}

main();
