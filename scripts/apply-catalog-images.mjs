import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const productsDataPath = path.resolve(rootDir, 'src/productsData.js');
const catalogDir = path.resolve(rootDir, 'public/catalog');
const transparentDir = path.resolve(rootDir, 'public/transparent');

const catalogFiles = fs.readdirSync(catalogDir);
const transparentFiles = fs.readdirSync(transparentDir);

const fileContent = fs.readFileSync(productsDataPath, 'utf8');

// Parse RAW_PRODUCTS_DATA from the file
// Find RAW_PRODUCTS_DATA = [ ... ];
const rawStart = fileContent.indexOf('const RAW_PRODUCTS_DATA = [');
if (rawStart === -1) {
  console.error("Could not find RAW_PRODUCTS_DATA in productsData.js");
  process.exit(1);
}

const rawEnd = fileContent.indexOf('\n];\n\nexport const PRODUCTS_DATA', rawStart);
if (rawEnd === -1) {
  console.error("Could not find end of RAW_PRODUCTS_DATA");
  process.exit(1);
}

const rawArrayStr = fileContent.slice(rawStart + 'const RAW_PRODUCTS_DATA = '.length, rawEnd + 2);
let rawProducts;
try {
  rawProducts = JSON.parse(rawArrayStr);
} catch (e) {
  console.error("Failed to parse RAW_PRODUCTS_DATA as JSON:", e);
  process.exit(1);
}

console.log(`Parsed ${rawProducts.length} raw products.`);

// Helper to determine the best transparent front image for any SKU
function getBestImageForSku(sku, currentImage) {
  const safeSku = sku.toLowerCase().replace(/[^a-z0-9_-]/g, "_");

  // Priority 1: Exact dedicated transparent PNG in public/catalog
  if (sku === "HBR-980-AUTO-ORBITA-GOLD") return "/catalog/hbr-980-auto-orbita-g-front.png";
  if (sku === "HBR-980-AUTO-ORBITA-G") return "/catalog/hbr-980-auto-orbita-g-front.png";
  if (sku === "HBR-980-AUTO-ORBITA-S") return "/catalog/hbr-980-auto-orbita-s-front.png";
  if (sku === "HBR-995-1-AUTO-GOLD") return "/catalog/hbr-995-1-auto-g-front.png";
  if (sku === "HBR-995-1-AUTO-G") return "/catalog/hbr-995-1-auto-g-front.png";
  if (sku === "HBR-995-1-AUTO-S") return "/catalog/hbr-995-1-auto-s-front.png";
  if (sku === "HBR-995-1-AUTO-RED") return "/catalog/hbr-995-1-auto-red-front.png";
  if (sku === "HBR-ZODIAC-1027-2-BLACK") return "/catalog/hbr-zodiac-1027-2-black-front.png";
  if (sku === "HBR-ZODIAC-1027-2-BLUE") return "/catalog/hbr-zodiac-1027-2-blue-front.png";

  const directPng = catalogFiles.find(f => f.toLowerCase() === `${safeSku}-front.png`);
  if (directPng) return `/catalog/${directPng}`;

  // Priority 2: Dedicated transparent WebP in public/transparent
  if (sku === "HBR-900-3-AUTO-BLACK") return "/transparent/hbr-900-3-auto-black.webp";
  if (sku === "HBR-989-3-BLACK-AUTO") return "/transparent/hbr-989-3-black-auto.webp";
  if (sku === "HBR-989-3-RED-AUTO") return "/transparent/clover-king-crimson.webp";
  if (sku === "HBR-989-3-GREEN-AUTO") return "/transparent/hbr-989-3-green-auto.webp";
  if (sku === "HBR-989-3-ORANGE-AUTO") return "/transparent/hbr-989-3-orange-auto.webp";
  if (sku === "HBR-989-3-WHITE-AUTO") return "/transparent/hbr-989-3-white-auto.webp";
  if (sku === "HBR-989-3-BLUE-AUTO") return "/transparent/hbr-989-3-blue-auto.webp";

  const directWebp = transparentFiles.find(f => f.toLowerCase() === `${safeSku}.webp`);
  if (directWebp) return `/transparent/${directWebp}`;

  const prefixWebp = transparentFiles.find(f => f.toLowerCase().startsWith(safeSku));
  if (prefixWebp) return `/transparent/${prefixWebp}`;

  // Fallback check in transparentFiles
  return currentImage;
}

let updatedCount = 0;
for (const p of rawProducts) {
  const oldImg = p.image;
  const bestImg = getBestImageForSku(p.sku, oldImg);

  p.image = bestImg;
  p.transparentImage = bestImg;

  // Update altImages: make sure bestImg is first, and filter out corrupted duplicate webps
  const otherAlts = (p.altImages || [])
    .filter(img => {
      const u = typeof img === 'string' ? img : img?.url;
      if (!u) return false;
      if (u === bestImg) return false;
      // Filter out legacy corrupted files
      if (u === "/transparent/forged-carbon-tonneau-tourbillon.webp" && p.sku !== "HBR-900-3-AUTO-BLACK") return false;
      if (u === "/transparent/astroworld-celestial.webp" && !p.sku.includes("980")) return false;
      if (u === "/transparent/hbr-995-1-auto-gold.webp" && !p.sku.includes("995")) return false;
      return true;
    });
  p.altImages = [bestImg, ...otherAlts];

  // Update gallery: make sure first item is bestImg
  if (Array.isArray(p.gallery) && p.gallery.length > 0) {
    p.gallery[0].url = bestImg;
  }

  if (oldImg !== bestImg) {
    console.log(`[${p.sku}] Updated: ${oldImg} -> ${bestImg}`);
    updatedCount++;
  }
}

console.log(`Total products updated with new transparent images: ${updatedCount}`);

// Re-serialize RAW_PRODUCTS_DATA with clean formatting
const newRawArrayStr = JSON.stringify(rawProducts, null, 2);
const updatedFileContent = fileContent.slice(0, rawStart + 'const RAW_PRODUCTS_DATA = '.length) +
  newRawArrayStr +
  fileContent.slice(rawEnd + 2);

fs.writeFileSync(productsDataPath, updatedFileContent, 'utf8');
console.log("Successfully wrote updated productsData.js!");
