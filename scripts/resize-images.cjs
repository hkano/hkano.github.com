#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const sharp = require('sharp');

const INPUT_DIR = path.join('static', 'images');
const OUTPUT_DIR = path.join('build', 'images');
const MAX_WIDTH = 800;

async function resizeImages() {
  const files = glob.sync(`${INPUT_DIR}/**/*.{jpg,jpeg,png,webp}`, { nocase: true });

  await Promise.all(
    files.map(async (inputPath) => {
      const relPath = path.relative(INPUT_DIR, inputPath);
      const outputPath = path.join(OUTPUT_DIR, relPath);

      if (await fs.pathExists(outputPath)) {
        const [inputStat, outputStat] = await Promise.all([
          fs.stat(inputPath),
          fs.stat(outputPath),
        ]);
        if (inputStat.mtime <= outputStat.mtime) {
          return;
        }
      }

      await fs.ensureDir(path.dirname(outputPath));
      await sharp(inputPath)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .toFile(outputPath);
    })
  );
}

resizeImages().catch((err) => {
  console.error('Image resize failed:', err);
  process.exit(1);
});
