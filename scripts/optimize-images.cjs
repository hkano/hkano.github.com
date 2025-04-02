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
      const outputWebP = inputPath.replace(ext, '.webp');

      const { width } = await sharp(inputPath).metadata();
      const pipeline = sharp(inputPath);

      if (width > MAX_WIDTH) {
        pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
      }

      await pipeline.toFile(outputWebP);
    })
  );
}

optimizeImages().catch((err) => {
  console.error('Image optimization failed:', err);
  process.exit(1);
});
