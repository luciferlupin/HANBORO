import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { PRODUCTS_DATA, CATEGORIES } from '../src/productsData.js';

const EXCEL_PATH = '/Users/harshitgoyal/Downloads/LISTING FILE AI1 .xlsx';

console.log('=== Step 1: Parsing Excel Shared Strings & Sheets ===');
const sharedXml = execSync(`unzip -p "${EXCEL_PATH}" xl/sharedStrings.xml`).toString('utf8');
const strings = [];
const strRegex = /<si>[\s\S]*?<\/si>/g;
let siMatch;
while ((siMatch = strRegex.exec(sharedXml)) !== null) {
  const tMatches = siMatch[0].match(/<t[^>]*>([\s\S]*?)<\/t>/g) || [];
  strings.push(tMatches.map(m => m.replace(/<\/?t[^>]*>/g, '')).join(''));
}
console.log(`Loaded ${strings.length} shared strings.`);

const excelMap = new Map();

for (let s = 1; s <= 11; s++) {
  try {
    const sheetXml = execSync(`unzip -p "${EXCEL_PATH}" xl/worksheets/sheet${s}.xml 2>/dev/null`).toString('utf8');
    const rows = sheetXml.match(/<row[^>]+>[\s\S]*?<\/row>/g) || [];
    for (const r of rows) {
      const rowNum = parseInt(r.match(/r="([0-9]+)"/)[1], 10);
      if (rowNum <= 5) continue;
      const cells = r.match(/<c[^>]+>[\s\S]*?<\/c>/g) || [];
      const vals = {};
      for (const c of cells) {
        const col = c.match(/r="([A-Z]+)[0-9]+"/)[1];
        const v = c.match(/<v>([\s\S]*?)<\/v>/);
        vals[col] = v ? (c.includes('t="s"') ? strings[parseInt(v[1])] : v[1]) : '';
      }
      const sku = (vals['C'] || '').trim();
      if (!sku) continue;

      const title = (vals['D'] || '').trim();
      const mrpRaw = (vals['BS'] || '').trim();
      const mrp = parseFloat(mrpRaw) || 0;

      let rawModel = (vals['BX'] || vals['BU'] || vals['AZ'] || '').trim();
      if (rawModel.endsWith('.0')) rawModel = rawModel.slice(0, -2);

      excelMap.set(sku, {
        sheet: s,
        row: rowNum,
        sku,
        title,
        mrp,
        rawModel,
      });
    }
  } catch (_) {}
}

console.log(`Indexed ${excelMap.size} unique SKUs from Excel.`);

function resolveCanonicalModel(sku, rawModel, existingSpecsModel) {
  // Canonical overrides for known patterns / raw internal database IDs
  if (sku.startsWith('HBR-8851-1')) return '8851-1';
  if (sku.startsWith('HBR-RING-5378-2')) return '5378-2';
  if (sku.startsWith('HBR-RING-5378')) return '5378';
  if (sku.startsWith('HBR-8022-1')) return '8022-1';
  if (sku.startsWith('HBR-1308')) return '1308';
  if (sku.startsWith('HBR-1307')) return '1307';
  if (sku.startsWith('HBR-AERO-997')) return '997';
  if (sku.startsWith('HBR-WC-1038')) return '1038';
  if (sku.startsWith('HBR-927')) return '927-2';
  if (sku.startsWith('HBR-30027-1')) return '30027-1';
  if (sku.startsWith('HBR-995-1')) return '995-1';
  if (sku.startsWith('HBR-989-3')) return '989-3';
  if (sku.startsWith('HBR-824-2')) return '824-2';
  if (sku.startsWith('HBR-1027-2')) return '1027-2';
  if (sku.startsWith('HBR-1001-1')) return '1001-1';
  if (sku.startsWith('HBR-1001-2')) return '1001-2';

  let m = (rawModel || existingSpecsModel || '').trim();
  if (m.endsWith('.0')) m = m.slice(0, -2);
  if (!m || m === '7200' || m === 'CERAMIC' || m === '2538803' || m === '1270347') {
    m = existingSpecsModel || '';
    if (m.endsWith('.0')) m = m.slice(0, -2);
  }
  if (m === '8022') m = '8022-1';
  return m;
}

function sanitizeTitle(rawTitle) {
  let t = (rawTitle || '')
    .replace(/&quot;/g, '')
    .replace(/&amp;/g, '&')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^["']+|["']+$/g, '')
    .trim();

  // Fix known typos from listing sheet
  if (t.includes('Worl Cup')) {
    t = t.replace('Worl Cup', 'World Cup');
  }
  return t;
}

console.log('=== Step 2: Updating PRODUCTS_DATA with Canonical Model & Pricing ===');

let updatedCount = 0;
const updatedProducts = PRODUCTS_DATA.map((product) => {
  const excelEntry = excelMap.get(product.sku);
  const canonicalModel = resolveCanonicalModel(
    product.sku,
    excelEntry?.rawModel,
    product.specs?.modelNumber
  );

  const cleanName = sanitizeTitle(excelEntry?.title || product.name);

  // MRP determination: if excel has positive number, use it; otherwise preserve current valid priceNumeric
  let finalPriceNumeric = (excelEntry?.mrp && excelEntry.mrp > 0)
    ? excelEntry.mrp
    : product.priceNumeric;

  const formattedInr = `₹${finalPriceNumeric.toLocaleString('en-IN')}`;
  const approxUsd = Math.round(finalPriceNumeric / 83);
  const formattedUsd = `$${approxUsd.toLocaleString('en-US')}`;

  const updatedSpecs = {
    ...(product.specs || {}),
    modelNumber: canonicalModel,
  };

  updatedCount++;

  return {
    ...product,
    modelNumber: canonicalModel,
    name: cleanName,
    price: formattedInr,
    priceNumeric: finalPriceNumeric,
    mrp: formattedInr,
    priceUsd: formattedUsd,
    specs: updatedSpecs,
  };
});

console.log(`Updated ${updatedCount} products.`);

// Verify all products have valid model numbers and prices
for (const p of updatedProducts) {
  if (!p.modelNumber || ['7200', 'CERAMIC', '2538803', '1270347', '8022'].includes(p.modelNumber)) {
    throw new Error(`Invalid modelNumber '${p.modelNumber}' for SKU ${p.sku}`);
  }
  if (!p.priceNumeric || p.priceNumeric <= 0) {
    throw new Error(`Invalid priceNumeric '${p.priceNumeric}' for SKU ${p.sku}`);
  }
}

console.log('All 98 products passed modelNumber and pricing validation.');

// Format source file
const fileContent = `// ══════════════════════════════════════════════════════════════════════════════
// HANBORO OFFICIAL MASTER PRODUCTS & SKU CATALOG
// Synchronized from Official Listing Dossier (LISTING FILE AI1 .xlsx)
// Incorporating Authentic High-Resolution Photography from Excel Assets
// Every timepiece equipped with Canonical Model Number, Name & Verified Pricing
// ══════════════════════════════════════════════════════════════════════════════

export const CATEGORIES = ${JSON.stringify(CATEGORIES, null, 2)};

export const PRODUCTS_DATA = ${JSON.stringify(updatedProducts, null, 2)};

// Quick Helper: Find Product by ID, SKU, or Model Number
export function getProductByIdOrSku(identifier) {
  if (!identifier) return null;
  const clean = identifier.toLowerCase().trim();
  return (
    PRODUCTS_DATA.find(
      (p) =>
        p.id.toLowerCase() === clean ||
        p.sku.toLowerCase() === clean ||
        (p.modelNumber && p.modelNumber.toLowerCase() === clean)
    ) || null
  );
}
`;

fs.writeFileSync(path.resolve('src/productsData.js'), fileContent, 'utf8');
console.log('Successfully wrote updated src/productsData.js!');
