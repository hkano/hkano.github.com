const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const nunjucks = require('nunjucks');

nunjucks.configure('templates', { autoescape: true });

const ARTICLES_DIR = 'articles';
const BUILD_DIR = 'build';
const STATIC_DIR = 'static';
const ARTICLES_PER_PAGE = 10;
const START_YEAR = 2009;
const DEFAULT_META_DESCRIPTION = 'hkano.com は旅・技術・日々の出来事について綴った個人ブログです。';

const renderer = {
  image(href, title, text) {
    const alt = text || '';
    return `<img src="${href}" alt="${alt}" width="800" height="600">`;
  }
};
marked.setOptions({ renderer });

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
    const filePath = path.join(BUILD_DIR, 'posts', year, month, `${article.slug}.html`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });  
    const metaDescription = article.description || `${article.title}｜` + article.body.replace(/<[^>]+>/g, '').slice(0, 100).replace(/\s+/g, ' ').trim();
    const body = convertImgToPicture(article.body);
    const html = nunjucks.render('post.njk', {
      article: { ...article, body },
      meta_description: metaDescription,
    });
    fs.writeFileSync(filePath, html);
  });
}

function generateIndexPages(articles) {
  const totalPages = Math.ceil(articles.length / ARTICLES_PER_PAGE);
  for (let page = 1; page <= totalPages; page++) {
    const start = (page - 1) * ARTICLES_PER_PAGE;
    const end = page * ARTICLES_PER_PAGE;
    const articlesSubset = articles.slice(start, end).map((article, i) => {
      let body = article.body;
      if (i !== 0) {
        body = body.replace(/<img([^>]*?)>/g, (match, attrs) => {
          return /loading=/.test(attrs)
            ? `<img${attrs}>`
            : `<img${attrs} loading="lazy">`;
        });
      }
      body = convertImgToPicture(body);
      return { ...article, body };
    });
    const description =
      page === 1
        ? DEFAULT_META_DESCRIPTION
        : `ページ ${page}｜${DEFAULT_META_DESCRIPTION}`;
    const html = nunjucks.render('index.njk', {
      articles: articlesSubset,
      currentPage: page,
      totalPages,
      meta_description: description,
    });
    const filePath = page === 1
      ? path.join(BUILD_DIR, 'index.html')
      : path.join(BUILD_DIR, 'page', String(page), 'index.html');
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, html);
  }
}

function generatePageDirectoriesRedirect() {
  const dir = path.join(BUILD_DIR, 'page');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), generateRedirectHtml('/'));
}

function generatePostsDirectoriesRedirect(articles) {
  const postsRoot = path.join(BUILD_DIR, 'posts');
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
    fs.cpSync(staticDir, BUILD_DIR, { recursive: true });
  }
}

function generateDateAndSlug(fileName) {
  const name = path.parse(fileName).name;
  const [year, month, day, ...slugParts] = name.split('-');
  const date = `${year}-${month}-${day}`;
  const slug = slugParts.join('-');
  return { date, slug };
}

function convertImgToPicture(html) {
  return html.replace(
    /<img([^>]*?)src="([^"]+)\.(jpg|jpeg|png)"([^>]*)>/gi,
    (match, before, base, ext, after) => {
      const originalSrc = `${base}.${ext}`;
      const webpSrc = `${base}.webp`;
      const webp400Src = `${base}-400.webp`;

      const isTarget = /^\d{4}-\d{2}-\d{2}-.+/.test(path.basename(base));
      if (!isTarget) return match;

      return `
<picture>
  <source type="image/webp" srcset="${webp400Src} 400w, ${webpSrc} 800w" sizes="(max-width: 600px) 100vw, 800px">
  <img${before}src="${originalSrc}"${after}>
</picture>`.trim();
    }
  );
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
