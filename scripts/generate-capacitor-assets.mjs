/**
 * Gera ícones e splash Android/iOS para Capacitor a partir da logo SETAD.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const sourceCircle = path.join(root, "assets", "images", "favicon-setad-circle.png");
const source = path.join(root, "assets", "images", "app-icon-setad.png");
const fallbackSource = path.join(root, "assets", "icons", "icon-512.png");
const resources = path.join(root, "resources");
const BRAND = "#23406b";

async function writePng(buffer, filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  await sharp(buffer).png().toFile(filePath);
}

async function createSplash(iconPath, size) {
  const logoSize = Math.round(size * 0.42);
  const logo = await sharp(iconPath)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BRAND
    }
  }).composite([{ input: logo, gravity: "centre" }]).png().toBuffer();
}

async function createAppIcon(iconPath, size, fullBleed) {
  const padding = fullBleed ? 0 : Math.round(size * 0.05);
  const inner = size - padding * 2;
  const logo = await sharp(iconPath)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: logo, gravity: "centre" }])
    .png()
    .toBuffer();
}

async function main() {
  const useCircle = fs.existsSync(sourceCircle);
  const iconSource = useCircle
    ? sourceCircle
    : fs.existsSync(source)
      ? source
      : fallbackSource;
  if (!fs.existsSync(iconSource)) {
    console.error("Ícone fonte não encontrado:", iconSource);
    process.exit(1);
  }

  fs.mkdirSync(resources, { recursive: true });

  const iconBuffer = useCircle || iconSource === source
    ? await createAppIcon(iconSource, 1024, useCircle)
    : await sharp(iconSource).resize(1024, 1024).png().toBuffer();

  await writePng(iconBuffer, path.join(resources, "icon.png"));
  await writePng(await createSplash(iconSource, 2732), path.join(resources, "splash.png"));
  await writePng(await createSplash(iconSource, 2732), path.join(resources, "splash-dark.png"));

  console.log("Recursos Capacitor gerados em resources/");
}

main().catch(function (error) {
  console.error(error);
  process.exit(1);
});
