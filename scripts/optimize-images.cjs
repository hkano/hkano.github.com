const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const sharp = require('sharp');

const INPUT_DIR = path.join('static', 'images');
const OUTPUT_DIR = path.join('build', 'images');
const MAX_WIDTH = 800;
const SMALL_WIDTH = 400;
const JPEG_QUALITY = 70;
const WEBP_QUALITY = 50;
const TARGET_PATTERN = /^\d{4}-\d{2}-\d{2}-.+/;

async function optimizeImages() {
  const files = glob.sync(`${INPUT_DIR}/**/*.{jpg,jpeg,png}`, { nocase: true });

  await Promise.all(
    files.map(async (inputPath) => {
      const filename = path.basename(inputPath);
      if (!TARGET_PATTERN.test(filename)) return;

      const relPath = path.relative(INPUT_DIR, inputPath);
      const baseName = relPath.replace(path.extname(relPath), '');
      const outputOriginal = path.join(OUTPUT_DIR, `${baseName}.jpg`);
      const outputWebP = path.join(OUTPUT_DIR, `${baseName}.webp`);
      const outputWebPSmall = path.join(OUTPUT_DIR, `${baseName}-400.webp`);

      const image = sharp(inputPath);

      await fs.ensureDir(path.dirname(outputOriginal));

      await image
        .clone()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: JPEG_QUALITY })
        .toFile(outputOriginal);

      await image
        .clone()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(outputWebP);

      await image
        .clone()
        .resize({ width: SMALL_WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(outputWebPSmall);
    })
  );
}

optimizeImages().catch((err) => {
  console.error('Image optimization failed:', err);
  process.exit(1);
});
