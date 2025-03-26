import fs from 'fs';
import path from 'path';
import nunjucks from 'nunjucks';
import matter from 'gray-matter';
import { marked } from 'marked';

nunjucks.configure('templates', { autoescape: false });

const articlesDir = 'articles';
const postsDir = 'posts';
const indexPath = 'index.html';

const allArticles = [];

fs.mkdirSync(postsDir, { recursive: true });

const files = fs.readdirSync(articlesDir)
  .filter(f => f.endsWith('.md'))
  .sort()
  .reverse();

for (const file of files) {
  const filePath = path.join(articlesDir, file);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  const htmlContent = marked(content);

  const filename = path.basename(file, '.md');
  const [year, month, day, ...slugParts] = filename.split('-');
  const slug = slugParts.join('-');
  const outputPath = path.join(postsDir, `${year}/${month}/${slug}.html`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const html = nunjucks.render('post.html', {
    title: data.title,
    date: `${year}/${month}/${day}`,
    content: htmlContent
  });

  fs.writeFileSync(outputPath, html);

  allArticles.push({
    title: data.title,
    date: `${year}/${month}/${day}`,
    content: htmlContent,
    url: `/posts/${year}/${month}/${slug}.html`
  });
}

const indexHtml = nunjucks.render('index.html', { articles: allArticles });
fs.writeFileSync(indexPath, indexHtml);
