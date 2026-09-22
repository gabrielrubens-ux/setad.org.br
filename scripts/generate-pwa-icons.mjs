/**
 * Gera ícones PWA e app a partir da logo SETAD (somente emblema + nome SETAD, fundo transparente).
 * Uso: node scripts/generate-pwa-icons.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sourceLogo = path.join(root, "assets", "images", "logo-setad-transparent.png");
const sourceFaviconCircle = path.join(root, "assets", "images", "favicon-setad-source.jpg");
const faviconCircleOut = path.join(root, "assets", "images", "favicon-setad-circle.png");
const appLogoOut = path.join(root, "assets", "images", "app-icon-setad.png");
const iconsDir = path.join(root, "assets", "icons");

const SIZES = [16, 32, 72, 96, 128, 144, 152, 180, 192, 384, 512];

/** Padding lateral padrão (ícones PWA / app instalado). */
const PADDING_DEFAULT_SMALL = 0.04;
const PADDING_DEFAULT_LARGE = 0.05;
const PADDING_MASKABLE = 0.14;

/** Favicon (aba do Chrome): logo ~20% maior que o padding padrão pequeno. */
const FAVICON_LOGO_SCALE = 1.44;

function getPaddingRatio(size, purpose) {
  if (purpose === "maskable") return PADDING_MASKABLE;
  if (purpose === "any") return 0;
  return size >= 192 ? PADDING_DEFAULT_LARGE : PADDING_DEFAULT_SMALL;
}

/** Tamanho da arte no favicon legado (sem bola branca). */
function getFaviconDrawSize(size) {
  const baseInner = size * (1 - 2 * PADDING_DEFAULT_SMALL);
  return Math.round(baseInner * FAVICON_LOGO_SCALE);
}

/** Recorta emblema + SETAD, removendo o subtítulo institucional. */
async function extrairLogoSomenteSetad(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  const rowInk = new Array(height).fill(0);

  for (let y = 0; y < height; y++) {
    let ink = 0;
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * channels + 3];
      if (alpha > 24) {
        ink += alpha;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    rowInk[y] = ink;
  }

  if (maxX <= minX || maxY <= minY) {
    return buffer;
  }

  const gapMinRows = 10;
  const segments = [];
  let segStart = null;

  for (let y = minY; y <= maxY; y++) {
    const hasInk = rowInk[y] > 0;
    if (hasInk && segStart === null) {
      segStart = y;
    }
    if (!hasInk && segStart !== null) {
      let gap = 0;
      for (let g = y; g <= maxY && rowInk[g] === 0; g++) gap++;
      if (gap >= gapMinRows) {
        segments.push({ top: segStart, bottom: y - 1 });
        segStart = null;
        y += gap - 1;
      }
    }
  }

  if (segStart !== null) {
    segments.push({ top: segStart, bottom: maxY });
  }

  let cropTop = minY;
  let cropBottom = maxY;

  if (segments.length >= 2) {
    const last = segments[segments.length - 1];
    const penultimate = segments[segments.length - 2];
    const lastHeight = last.bottom - last.top;
    const prevHeight = penultimate.bottom - penultimate.top;

    if (lastHeight < prevHeight * 0.55) {
      cropTop = segments[0].top;
      cropBottom = penultimate.bottom;
    } else {
      cropTop = segments[0].top;
      cropBottom = last.bottom;
      for (let i = 0; i < segments.length - 1; i++) {
        if (segments[i].bottom - segments[i].top > lastHeight) {
          cropBottom = segments[i].bottom;
          break;
        }
      }
    }
  } else if (segments.length === 1) {
    cropTop = segments[0].top;
    cropBottom = segments[0].bottom;
  }

  const pad = Math.round((maxX - minX) * 0.02);
  const extract = {
    left: Math.max(0, minX - pad),
    top: Math.max(0, cropTop - pad),
    width: Math.min(width, maxX - minX + 1 + pad * 2),
    height: Math.min(height - cropTop, cropBottom - cropTop + 1 + pad * 2)
  };

  return sharp(buffer).extract(extract).png().toBuffer();
}

async function obterLogoApp() {
  const raw = await fs.promises.readFile(sourceLogo);
  const cropped = await extrairLogoSomenteSetad(raw);
  await sharp(cropped).png().toFile(appLogoOut);
  return cropped;
}

function distCor(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

/**
 * Mantém só o disco branco com a logo; o quadrado azul externo fica transparente.
 */
async function extrairBolaBrancaFavicon(buffer) {
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const cx = width / 2;
  const cy = height / 2;

  const cornerSamples = [
    [2, 2],
    [width - 3, 2],
    [2, height - 3],
    [width - 3, height - 3]
  ];
  let bgR = 0;
  let bgG = 0;
  let bgB = 0;
  for (const [x, y] of cornerSamples) {
    const i = (y * width + x) * channels;
    bgR += data[i];
    bgG += data[i + 1];
    bgB += data[i + 2];
  }
  bgR = Math.round(bgR / cornerSamples.length);
  bgG = Math.round(bgG / cornerSamples.length);
  bgB = Math.round(bgB / cornerSamples.length);

  function luminance(r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }

  function isOuterBg(r, g, b) {
    return distCor(r, g, b, bgR, bgG, bgB) < 48 && luminance(r, g, b) < 150;
  }

  const maxR = Math.floor(Math.min(cx, cy)) - 2;
  let radius = maxR;
  const angles = 36;
  for (let a = 0; a < angles; a++) {
    const rad = (a / angles) * Math.PI * 2;
    let rayRadius = 0;
    let sawBright = false;
    for (let r = 0; r < maxR; r++) {
      const x = Math.min(width - 1, Math.max(0, Math.round(cx + Math.cos(rad) * r)));
      const y = Math.min(height - 1, Math.max(0, Math.round(cy + Math.sin(rad) * r)));
      const i = (y * width + x) * channels;
      const pr = data[i];
      const pg = data[i + 1];
      const pb = data[i + 2];
      const lum = luminance(pr, pg, pb);
      if (lum >= 175) {
        sawBright = true;
        rayRadius = r;
      } else if (sawBright && isOuterBg(pr, pg, pb)) {
        break;
      } else if (!sawBright) {
        rayRadius = r;
      }
    }
    radius = Math.min(radius, rayRadius);
  }

  if (radius < 8) {
    radius = Math.floor(Math.min(width, height) * 0.44);
  }

  const out = Buffer.from(data);
  const r2 = radius * radius;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - cx + 0.5;
      const dy = y - cy + 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const d2 = dist * dist;
      const i = (y * width + x) * channels;
      const pr = data[i];
      const pg = data[i + 1];
      const pb = data[i + 2];

      if (d2 > r2) {
        out[i + 3] = 0;
        continue;
      }

      if (isOuterBg(pr, pg, pb) && dist > radius * 0.78) {
        out[i + 3] = 0;
        continue;
      }

      const edge = radius - dist;
      if (edge < 1.25) {
        out[i + 3] = Math.round(Math.min(255, Math.max(0, edge / 1.25) * 255));
      }
    }
  }

  return sharp(out, { raw: { width, height, channels } }).png().toBuffer();
}

async function obterFaviconBolaBranca() {
  if (!fs.existsSync(sourceFaviconCircle)) {
    console.warn("Favicon circular não encontrado, usando logo do app:", sourceFaviconCircle);
    return null;
  }
  const raw = await fs.promises.readFile(sourceFaviconCircle);
  const meta = await sharp(raw).metadata();
  const dim = Math.max(meta.width || 512, meta.height || 512, 1024);
  const square = await sharp(raw)
    .resize(dim, dim, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();
  const circle = await extrairBolaBrancaFavicon(square);
  await sharp(circle).png().toFile(faviconCircleOut);
  return circle;
}

async function createIcon(logoBuffer, size, filename, purpose, options) {
  const opts = options || {};
  const paddingRatio = getPaddingRatio(size, purpose);
  const padding = Math.round(size * paddingRatio);
  const inner = Math.max(1, size - padding * 2);
  const isFaviconTab = (size === 16 || size === 32) && purpose === "any";
  const drawSize =
    isFaviconTab && !opts.faviconCircle ? getFaviconDrawSize(size) : inner;

  let pipeline = sharp(logoBuffer).resize(drawSize, drawSize, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  });

  if (drawSize > size && !opts.faviconCircle) {
    const left = Math.floor((drawSize - size) / 2);
    const top = Math.floor((drawSize - size) / 2);
    pipeline = pipeline.extract({ left, top, width: size, height: size });
  }

  const logo = await pipeline.png().toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toFile(path.join(iconsDir, filename));
}

async function main() {
  if (!fs.existsSync(sourceLogo)) {
    console.error("Logo não encontrada:", sourceLogo);
    process.exit(1);
  }

  fs.mkdirSync(iconsDir, { recursive: true });

  const logoApp = await obterLogoApp();
  console.log("Logo do app (emblema + SETAD):", appLogoOut);

  const faviconCircle = await obterFaviconBolaBranca();
  if (faviconCircle) {
    console.log("Favicon (bola branca):", faviconCircleOut);
  }

  const useCircle = Boolean(faviconCircle);
  const iconBuffer = useCircle ? faviconCircle : logoApp;

  for (const size of SIZES) {
    const name = size === 180 ? "apple-touch-icon.png" : `icon-${size}.png`;
    await createIcon(iconBuffer, size, name, "any", { faviconCircle: useCircle });
    const extra = useCircle
      ? "bola branca (fundo vazado)"
      : size === 16 || size === 32
        ? `zoom favicon ${(getFaviconDrawSize(size) / size * 100).toFixed(0)}%`
        : `padding ${(getPaddingRatio(size, "any") * 100).toFixed(1)}%`;
    console.log("Gerado:", name, `(${extra})`);
  }

  await createIcon(iconBuffer, 512, "icon-maskable-512.png", "maskable", {
    faviconCircle: useCircle
  });
  console.log("Gerado: icon-maskable-512.png");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
