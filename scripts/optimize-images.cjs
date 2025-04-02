const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const sharp = require('sharp');

const INPUT_DIR = path.join('static', 'images');
const OUTPUT_DIR = path.join('build', 'images');
const MAX_WIDTH = 800;

async function optimizeImages() {
  const files = glob.sync(`${INPUT_DIR}/**/*.{jpg,jpeg,png}`, { nocase: true });

  await Promise.all(
    files.map(async (inputPath) => {
      const relPath = path.relative(INPUT_DIR, inputPath);
      const outputJpg = path.join(OUTPUT_DIR, relPath);
      const outputWebP = outputJpg.replace(path.extname(outputJpg), '.webp');

      const image = sharp(inputPath).resize({
        width: MAX_WIDTH,
        withoutEnlargement: true,
      });

      await fs.ensureDir(path.dirname(outputJpg));
      await image.toFile(outputJpg);
      await image.toFormat('webp').toFile(outputWebP);
    })
  );
}

optimizeImages().catch((err) => {
  console.error('Image optimization failed:', err);
  process.exit(1);
});
