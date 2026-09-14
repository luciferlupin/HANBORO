import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const catalogDir = path.resolve(rootDir, 'public/catalog');

// Import current data
const { PRODUCTS_DATA, CATEGORIES } = await import(path.resolve(rootDir, 'src/productsData.js'));

const catalogFiles = fs.readdirSync(catalogDir).filter(f => !f.startsWith('.'));
console.log(`Found ${catalogFiles.length} total files in public/catalog/`);

let updatedCount = 0;
let lumeCount = 0;
let videoCount = 0;

for (const p of PRODUCTS_DATA) {
  const safeSku = p.sku.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  
  // Look for front image
  const frontFile = catalogFiles.find(f => f.startsWith(`${safeSku}-front`) && !f.endsWith('.mp4'));
  if (frontFile) {
    updatedCount++;
    const frontUrl = `/catalog/${frontFile}`;
    p.image = frontUrl;
    p.transparentImage = frontUrl;

    // Alternate perspectives
    const altFiles = catalogFiles
      .filter(f => f.startsWith(`${safeSku}-view-`) && !f.endsWith('.mp4'))
      .sort((a, b) => a.localeCompare(b));

    const alts = [frontUrl, ...altFiles.map(f => `/catalog/${f}`)];
    p.altImages = alts;

    // Gallery objects
    p.gallery = [
      {
        url: frontUrl,
        title: `${p.name} — Front Dial View`,
        label: "01 Front View",
        caption: `Official boutique presentation of ${p.name} (Reference ${p.sku}).`
      },
      ...altFiles.map((f, idx) => ({
        url: `/catalog/${f}`,
        title: `${p.name} — Perspective 0${idx + 2}`,
        label: `0${idx + 2} View Angle`,
        caption: `Horological craftsmanship inspection of Reference ${p.sku}.`
      }))
    ];

    // Check for lume night image
    const lumeFile = catalogFiles.find(f => f.startsWith(`${safeSku}-lume`) && !f.endsWith('.mp4'));
    if (lumeFile) {
      lumeCount++;
      const lumeUrl = `/catalog/${lumeFile}`;
      p.hasNightMode = true;
      p.nightImage = lumeUrl;
      p.altImages.push(lumeUrl);
      p.gallery.push({
        url: lumeUrl,
        title: `${p.name} — Super-LumiNova Night Glow`,
        label: "Lume Mode",
        caption: "Super-LumiNova dial and hand illumination under low-light conditions."
      });
    }
  }

  // Check for video (for all watches with an MP4 reel)
  const vidFile = catalogFiles.find(f => f.startsWith(safeSku) && f.endsWith('.mp4'));
  if (vidFile) {
    videoCount++;
    p.videoUrl = `/catalog/${vidFile}`;
  }
}

console.log(`Updated ${updatedCount} watches with authentic Excel photography!`);
console.log(`Updated ${lumeCount} watches with Super-LumiNova night captures!`);
console.log(`Updated ${videoCount} watches with official motion/video reels!`);

// Generate code content
const fileHeader = `// ══════════════════════════════════════════════════════════════════════════════
// HANBORO OFFICIAL MASTER PRODUCTS & SKU CATALOG
// Synchronized from Official Listing Dossier (LISTING FILE AI1 .xlsx)
// Incorporating Authentic High-Resolution Photography from Excel Assets
// ══════════════════════════════════════════════════════════════════════════════

export const CATEGORIES = ${JSON.stringify(CATEGORIES, null, 2)};

export const PRODUCTS_DATA = ${JSON.stringify(PRODUCTS_DATA, null, 2)};

// Quick Helper: Find Product by ID or SKU
export function getProductByIdOrSku(identifier) {
  if (!identifier) return null;
  const clean = identifier.toLowerCase().trim();
  return (
    PRODUCTS_DATA.find((p) => p.id.toLowerCase() === clean || p.sku.toLowerCase() === clean) ||
    null
  );
}
`;

fs.writeFileSync(path.resolve(rootDir, 'src/productsData.js'), fileHeader, 'utf8');
console.log('Successfully wrote updated src/productsData.js!');
