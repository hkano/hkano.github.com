const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const marked = require('marked');
const nunjucks = require('nunjucks');

nunjucks.configure('templates', { autoescape: true });

const ARTICLES_DIR = 'articles';
const OUTPUT_DIR = 'docs';
const ARTICLES_PER_PAGE = 10;

function generateSlugAndDate(fileName) {
  const name = path.parse(fileName).name;
  const [year, month, day, ...slugParts] = name.split('-');
  const date = `${year}-${month}-${day}`;
  const slug = slugParts.join('-');
  return { date, slug };
}

function loadArticles() {
  const files = fs.readdirSync(ARTICLES_DIR);
  const articles = files
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const filePath = path.join(ARTICLES_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const { data, content: body } = matter(content);
      const { date, slug } = generateSlugAndDate(file);
      return {
        ...data,
        date,
        slug,
        body: marked.parse(body)
      };
    });

  articles.sort((a, b) => new Date(b.date) - new Date(a.date));
  return articles;
}

function generatePostPages(articles) {
  for (const article of articles) {
    const filePath = path.join(
      OUTPUT_DIR,
      'posts',
      article.date.slice(0, 4),
      article.date.slice(5, 7),
      `${article.slug}.html`
    );
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const html = nunjucks.render('post.njk', { article });
    fs.writeFileSync(filePath, html);
  }
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
      totalPages
    });
    const filePath =
      page === 1
        ? path.join(OUTPUT_DIR, 'index.html')
        : path.join(OUTPUT_DIR, 'page', String(page), 'index.html');
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, html);
  }
}

function copyStaticAssets() {
  const assetDirs = ['css', 'images', 'js'];
  for (const dir of assetDirs) {
    const srcDir = path.join(process.cwd(), dir);
    const destDir = path.join(OUTPUT_DIR, dir);
    if (fs.existsSync(srcDir)) {
      fs.mkdirSync(destDir, { recursive: true });
      fs.cpSync(srcDir, destDir, { recursive: true });
    }
  }
}

function main() {
  const articles = loadArticles();
  generatePostPages(articles);
  generateIndexPages(articles);
  copyStaticAssets();
}

main();
