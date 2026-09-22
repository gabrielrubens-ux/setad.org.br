/**
 * Remove fundo preto das logos SETAD usando flood fill a partir das bordas.
 * Preserva elementos pretos internos (ex.: pomba) que não tocam o fundo.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, "..", "assets", "images");

const THRESHOLD = 40;

function isDarkPixel(data, idx) {
  const i = idx * 4;
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  return r <= THRESHOLD && g <= THRESHOLD && b <= THRESHOLD;
}

function removeEdgeBlackBackground(data, width, height) {
  const total = width * height;
  const visited = new Uint8Array(total);
  const remove = new Uint8Array(total);
  const queue = [];

  function enqueue(x, y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    queue.push(y * width + x);
  }

  for (let x = 0; x < width; x++) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  while (queue.length > 0) {
    const idx = queue.pop();
    if (visited[idx]) continue;
    visited[idx] = 1;

    if (!isDarkPixel(data, idx)) continue;

    remove[idx] = 1;

    const x = idx % width;
    const y = Math.floor(idx / width);
    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }

  for (let idx = 0; idx < total; idx++) {
    if (remove[idx]) {
      data[idx * 4 + 3] = 0;
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const alpha = data[idx * 4 + 3];
      if (alpha === 0) continue;

      const neighbors = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ];

      const touchesTransparent = neighbors.some(([nx, ny]) => {
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) return true;
        return data[(ny * width + nx) * 4 + 3] === 0;
      });

      if (!touchesTransparent) continue;

      const i = idx * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (r <= 80 && g <= 80 && b <= 80) {
        const factor = Math.max(r, g, b) / 80;
        data[i + 3] = Math.round(255 * factor * 0.85);
      }
    }
  }
}

async function processImage(filename) {
  const inputPath = path.join(imagesDir, filename);
  const backupPath = path.join(imagesDir, filename.replace(".png", "-original.png"));
  const outputPath = path.join(imagesDir, filename.replace(".png", "-transparent.png"));

  if (!fs.existsSync(inputPath)) {
    console.error(`Arquivo não encontrado: ${inputPath}`);
    return;
  }

  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(inputPath, backupPath);
    console.log(`Backup: ${path.basename(backupPath)}`);
  }

  const sourcePath = fs.existsSync(backupPath) ? backupPath : inputPath;

  const { data, info } = await sharp(sourcePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data);
  removeEdgeBlackBackground(pixels, info.width, info.height);

  const output = await sharp(Buffer.from(pixels), {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();

  fs.writeFileSync(outputPath, output);
  fs.copyFileSync(outputPath, inputPath);
  console.log(`Transparente: ${filename} (${output.length} bytes)`);
}

await processImage("logo-setad.png");
await processImage("marca-dagua-setad.png");
