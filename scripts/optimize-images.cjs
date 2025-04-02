const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const sharp = require('sharp');

const INPUT_DIR = path.join('build', 'images');
const MAX_WIDTH = 800;

async function optimizeImages() {
  const files = glob.sync(`${INPUT_DIR}/**/*.{jpg,jpeg,png}`, { nocase: true });

  await Promise.all(
    files.map(async (inputPath) => {
      const ext = path.extname(inputPath);
      const webpPath = inputPath.replace(ext, '.webp');

      const image = sharp(inputPath);
      const metadata = await image.metadata();

      if (metadata.width > MAX_WIDTH) {
        await image
          .resize({ width: MAX_WIDTH, withoutEnlargement: true })
          .toFile(inputPath);
      }

      await sharp(inputPath).toFile(webpPath);
    })
  );
}

optimizeImages().catch((err) => {
  console.error('Image optimization failed:', err);
  process.exit(1);
});
