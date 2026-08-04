// One-off generator: rasterizes public/pwa/icon-source.svg into the PNG
// sizes the PWA manifest needs. Re-run (`node scripts/generate-pwa-icons.cjs`)
// after swapping in a real brand mark at the same source path.
const sharp = require('sharp');
const path = require('path');

const srcSvg = path.resolve(__dirname, '../public/pwa/icon-source.svg');
const outDir = path.resolve(__dirname, '../public/pwa');

const targets = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'icon-512-maskable.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
];

async function run() {
  for (const { file, size } of targets) {
    await sharp(srcSvg).resize(size, size).png().toFile(path.join(outDir, file));
    console.log(`wrote ${file} (${size}x${size})`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
