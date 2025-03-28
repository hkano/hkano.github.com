# hkano.com

This repository contains the source code for [hkano.com](https://hkano.com), a static personal website built using Nunjucks templates and custom CSS, and deployed via GitHub Pages.

## ✨ Overview

- **Framework**: Static site generator using [Nunjucks](https://mozilla.github.io/nunjucks/)
- **Styling**: Hand-crafted CSS (no frameworks)
- **Deployment**: GitHub Pages (with custom domain: `hkano.com`)
- **Content**: Written in structured data and compiled into HTML via script

## 📁 Structure

```
.
├── css/               # Custom CSS for styling
├── js/                # Client-side scripts
├── templates/         # Nunjucks templates
├── articles/          # Article source data (.md format)
├── scripts/           # Generator scripts (Node.js)
├── .github/workflows/ # GitHub Actions workflow for auto-generation
└── index.html         # Generated top page
```

## 🛠 Development

No manual build step is required in general.  
Whenever a new article or template is pushed, a GitHub Actions workflow automatically generates the corresponding HTML files.

If needed, you can run the build locally for preview:

```bash
node scripts/generate.js
```

## 🚀 Deployment

This site is deployed via GitHub Pages, and published automatically when the HTML files are regenerated.

The generation process is handled by a GitHub Actions workflow:
- Triggered on changes to articles (`articles/**/*.md`), templates, or the generator script
- Uses Node.js to render static HTML from the data and templates
- Commits and pushes the generated HTML back to the `main` branch

The site is published at [hkano.com](https://hkano.com) using a custom domain.

## ✍️ Writing Content

Each article is written as a Markdown file under `articles/`. Example format:

```markdown
---
title: "Example Article"
slug: "example-article"
date: "YYYY-MM-DD"
---

Here is the body of the article. It can contain Markdown content.
```

Slugs are automatically assigned based on file names and meta information, and embedded in the generated HTML as `<meta name="slug" content="...">`.

## 📄 License

- **Source code**: [MIT License](https://opensource.org/licenses/MIT)
- **Content** (articles, text, and images): © hkano.com. All rights reserved. Do not reproduce without permission.
