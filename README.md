# hkano.com

This repository contains the source code and publishing workflow for [hkano.com](https://hkano.com), a personal website powered by a custom static site generator using Node.js and Nunjucks.

## ✨ Overview

This site is a simple static blog built from Markdown files using a custom generator script.  
It supports pagination, templating with Nunjucks, and is automatically deployed via GitHub Pages.

## ✍️ Writing Articles

- Write articles in the `articles/` directory.
- File format: `YYYY-MM-DD-slug.md`
- Example: `articles/YYYY-MM-DD-my-article.md`

Each article uses [frontmatter](https://github.com/jonschlinkert/gray-matter) for metadata:

```markdown
---
title: "My First Post"
---
This is the body text in **Markdown**.
```

## 🛠️ Generating HTML

Run the generator script to convert Markdown into HTML:

```bash
node scripts/generate.cjs
```

This will:
- Parse all Markdown in `articles/`
- Generate individual pages in `docs/posts/YYYY/MM/slug.html`
- Generate paginated `index.html` pages
- Copy all files from `static/` into `docs/`

## 🧩 Directory Structure

```
.
├── articles/            # Markdown articles
├── static/              # Static assets (css, images, favicon, etc.)
├── templates/           # Nunjucks templates
├── scripts/
│   └── generate.cjs     # Generator script
├── docs/                # GitHub Pages output (generated)
└── .github/workflows/
    └── generate-blog.yml  # Auto-generation workflow
```

## 🚀 Deployment

This site is deployed via [GitHub Pages](https://pages.github.com/).  
All content is served from the `docs/` directory.  
GitHub Actions runs `scripts/generate.cjs` on every push and commits the result.

You can also trigger the generator manually via the **Actions** tab.

## 📄 License

- Source code: [MIT License](https://opensource.org/licenses/MIT)
- Content (articles, text, and images): © hkano.com. All rights reserved.
