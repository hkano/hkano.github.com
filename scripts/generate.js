import fs from 'fs';
import path from 'path';
import nunjucks from 'nunjucks';
import matter from 'gray-matter';
import { marked } from 'marked';

nunjucks.configure('templates', { autoescape: false });

const articlesDir = 'articles';
const postsDir = 'public/posts';
const indexPath = 'public/index.html';

const allArticles = [];

fs.mkdirSync(postsDir, { recursive: true });

const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));

for (const file of files) {
  const filePath = path.join(articlesDir, file);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  const slug = path.basename(file, '.md');

  const html = nunjucks.render('post.html', {
    title: data.title,
    date: data.date,
    content: marked(content)
  });

  const outputPath = path.join(postsDir, `${data.date.slice(0, 4)}/${data.date.slice(5, 7)}/${slug}.html`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html);

  allArticles.push({
    title: data.title,
    date: data.date,
    content: marked(content)
  });
}

const indexHtml = nunjucks.render('index.html', { articles: allArticles });
fs.writeFileSync(indexPath, indexHtml);
