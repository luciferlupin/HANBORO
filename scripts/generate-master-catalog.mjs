import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const catalogDir = path.resolve(rootDir, 'public/catalog');
const excelFrontDir = path.resolve(catalogDir, 'excel-front');

// 1. Read hanboro_listing_ai.json
const fImgPath = '/Users/harshitgoyal/Downloads/hanboro_listing_ai.json';
const fImgData = JSON.parse(fs.readFileSync(fImgPath, 'utf8'));
const records = fImgData.sheets[0].records.slice(0, 94); // rows 2-95

// 2. Read LISTING FILE AI1 .xlsx for auxiliary text dossiers
const ai1Path = '/Users/harshitgoyal/Downloads/LISTING FILE AI1 .xlsx';
const sharedXml = execSync(`unzip -p "${ai1Path}" xl/sharedStrings.xml`).toString('utf8');
const strings = [];
const strRegex = /<si>[\s\S]*?<\/si>/g;
let siMatch;
while ((siMatch = strRegex.exec(sharedXml)) !== null) {
  const tMatches = siMatch[0].match(/<t[^>]*>([\s\S]*?)<\/t>/g) || [];
  strings.push(tMatches.map(m => m.replace(/<\/?t[^>]*>/g, '')).join(''));
}

const ai1Map = new Map();
for (let s = 1; s <= 11; s++) {
  try {
    const sheetXml = execSync(`unzip -p "${ai1Path}" xl/worksheets/sheet${s}.xml 2>/dev/null`).toString('utf8');
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

      let rawModel = (vals['BX'] || vals['BU'] || vals['AZ'] || '').trim();
      if (rawModel.endsWith('.0')) rawModel = rawModel.slice(0, -2);

      ai1Map.set(sku, {
        title: (vals['D'] || '').trim(),
        series: (vals['E'] || '').trim(),
        desc: (vals['F'] || '').trim(),
        miniDesc: (vals['G'] || '').trim(),
        mrp: parseFloat(vals['BS']) || 0,
        model: rawModel,
        movement: (vals['K'] || vals['L'] || '').trim(),
      });
    }
  } catch (_) {}
}

// 3. Existing PRODUCTS_DATA for reference specs
const { PRODUCTS_DATA: existingCatalog, CATEGORIES } = await import(path.resolve(rootDir, 'src/productsData.js'));
const existingBySku = new Map();
existingCatalog.forEach(p => existingBySku.set(p.sku.trim().toUpperCase(), p));

const catalogFiles = fs.readdirSync(catalogDir).filter(f => !f.startsWith('.') && f !== 'excel-front');

function sanitize(str) {
  if (!str) return '';
  return String(str)
    .replace(/&quot;/g, '')
    .replace(/&amp;/g, '&')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^["']+|["']+$/g, '')
    .replace(/Worl Cup/g, 'World Cup')
    .trim();
}

function resolveCanonicalModel(sku, explicitModel, ai1Model) {
  if (sku.startsWith('HBR-989-3')) return '989-3';
  if (sku.startsWith('HBR-8851-1')) return '8851-1';
  if (sku.startsWith('HBR-985')) return '985';
  if (sku.startsWith('HBR-980-AUTO-ORBITA')) return '980-1';
  if (sku.startsWith('HBR-995-1')) return '995-1';
  if (sku.startsWith('HBR-927')) return '927-2';
  if (sku.startsWith('HBR-30027-1')) return '30027-1';
  if (sku.startsWith('HBR-8824-AUTO-NAVIGATOR')) return '8824';
  if (sku.startsWith('HBR-8824-AUTO-NS')) return '8824';
  if (sku.startsWith('HBR-1018')) return '1018';
  if (sku.startsWith('HBR-1001-1')) return '1001-1';
  if (sku.startsWith('HBR-1001-2')) return '1001-2';
  if (sku.startsWith('HBR-1020')) return '1020';
  if (sku.startsWith('HBR-2003')) return '2003';
  if (sku.startsWith('HBR-933')) return '933';
  if (sku.includes('848')) return '848';
  if (sku.startsWith('HBR-8821-2')) return '8821-2';
  if (sku.startsWith('HBR-8821')) return '8821';
  if (sku.startsWith('HBR-918')) return '918';
  if (sku.startsWith('HBR-703-2')) return '703-2';
  if (sku.startsWith('HBR-917')) return '917';
  if (sku.startsWith('HBR-RING-5378-2')) return '5378-2';
  if (sku.startsWith('HBR-RING-5378')) return '5378';
  if (sku.startsWith('HBR-906')) return '906';
  if (sku.startsWith('HBR-9038')) return '9038';
  if (sku.startsWith('HBR-902')) return '902';
  if (sku.startsWith('HBR-824-2')) return '824-2';
  if (sku.startsWith('HBR-1309')) return '1309';
  if (sku.startsWith('HBR-981')) return '981';
  if (sku.startsWith('HBR-2712')) return '2712';
  if (sku.startsWith('HBR-972')) return '972';
  if (sku.startsWith('HBR-945-3')) return '945-3';
  if (sku.startsWith('HBR-1307')) return '1307';
  if (sku.startsWith('HBR-8022-1')) return '8022-1';
  if (sku.startsWith('HBR-900-3')) return '900-3';
  if (sku.startsWith('HBR-AERO-997')) return '997';
  if (sku.startsWith('HBR-ZODIAC-1027-2')) return '1027-2';
  if (sku.startsWith('HBR-WC-1038')) return '1038';
  if (sku.startsWith('HBR-1308')) return '1308';

  let m = String(explicitModel || ai1Model || '').trim();
  if (m.endsWith('.0')) m = m.slice(0, -2);
  if (m === '1270347') return '5378-2';
  if (m === '2527877') return '8821-2';
  if (m === '8022') return '8022-1';
  if (m === '945') return '945-3';
  if (m === '980') return '980-1';
  return m;
}

function resolveCollection(model) {
  switch (model) {
    case '989-3':
    case '985':
    case '927-2':
    case '933':
    case '918':
    case '9038':
    case '945-3':
    case '900-3':
    case '997':
      return { id: 'TONNEAU', name: 'Tonneau Skeleton' };
    case '8851-1':
    case '980-1':
    case '995-1':
    case '30027-1':
    case '1020':
    case '8821':
    case '8821-2':
    case '8022-1':
    case '1027-2':
      return { id: 'TOURBILLON', name: 'Tourbillon & Complications' };
    case '1001-1':
    case '1001-2':
      return { id: 'ROULETTE', name: 'Casino & Roulette' };
    case '2003':
    case '848':
    case '703-2':
    case '917':
    case '824-2':
    case '972':
      return { id: 'OCTAGONAL', name: 'Royal Octagonal' };
    case '1309':
    case '1307':
    case '1038':
    case '1308':
      return { id: 'DIVER_SPORT', name: 'Diver & Sport Chrono' };
    case '8824':
    case '1018':
    case '5378-2':
    case '5378':
    case '906':
    case '902':
    case '981':
    case '2712':
    default:
      return { id: 'CLASSIC', name: 'Classic & Moonphase' };
  }
}

function resolveTag(model) {
  switch (model) {
    case '989-3': return 'Carbon Fiber Skeleton Automatic';
    case '8851-1': return 'Triple Flywheel Skeleton Automatic';
    case '985': return 'Double Balance Wheel F1-Inspired';
    case '980-1': return 'Flagship Planetarium Complication';
    case '995-1': return 'Motorsport Tourbillon Complication';
    case '927-2': return 'FaceShift Six Masks Complication';
    case '30027-1': return 'Gear Rider Skeleton Tourbillon';
    case '8824': return 'Celestial Dual-Hemisphere Moonphase';
    case '1018': return '5D Dragon Imperial Zodiac Automatic';
    case '1001-1': return 'Button-Activated Casino Roulette';
    case '1001-2': return 'Casino Royale Baguette Gem-Set Edition';
    case '1020': return '9INE Planet Orbiting Solar Complication';
    case '2003': return 'Hive Mechanica Triple Complication';
    case '933': return 'Aviation Fighter Jet Skeleton Automatic';
    case '848': return 'Aurora Globe & Meteorite Dial';
    case '8821': return 'Twin Balance Wheel Tourbillon';
    case '918': return 'Futuristic Skeleton Mechanical';
    case '703-2': return 'Hexagonal Bezel Crystal Skeleton';
    case '917': return 'Heroic Superhero Skeleton Automatic';
    case '5378-2':
    case '5378': return '904L Steel Celebration Masterpiece';
    case '906': return 'Double-Sided Transparent Skeleton';
    case '9038': return 'Great Wave Ocean-Inspired Automatic';
    case '8821-2': return 'Twin Balance Wheel Steel Bracelet Edition';
    case '902': return 'Power Reserve Indicator Complication';
    case '824-2': return 'Octagonal Day-Date Automatic';
    case '1309': return '100M Steel Diver Chronograph';
    case '981': return '3D Carved Glacier Mountain Dial';
    case '2712': return '3D Globe Carve Central Flywheel';
    case '972': return 'Octagonal Open-Heart Automatic';
    case '945-3': return 'CarbonX ChronoTech Tonneau Skeleton';
    case '1307': return 'SeaKing 100M Luxury Deep Diver';
    case '8022-1': return 'Celestial Astronomical Tourbillon';
    case '900-3': return 'CarbonForge Full Carbon Automatic';
    case '997': return 'AeroTwin Dual Movement Skeleton';
    case '1027-2': return 'Celestia Astryx Rotating Zodiac';
    case '1038': return 'World Cup Edition Dual Complication';
    case '1308': return 'SeaKing Sapphire Multi-Function Diver';
    default: return 'Luxury Automatic Timepiece';
  }
}

// Build group model mapping for rows 2-60
let curModel = null;
let curTitle = null;
let curName = null;
let curMRP = null;
let curDesc = null;
let curSpecs = null;
let curMovement = null;
let curSellingPoints = null;

const groupData = [];

for (let i = 0; i < records.length; i++) {
  const r = records[i];
  if (r['Product model']) curModel = String(r['Product model']).trim();
  if (r['PRODUCT TITLE']) curTitle = String(r['PRODUCT TITLE']).trim();
  if (r['model name ']) curName = String(r['model name ']).trim();
  if (r['MRP']) curMRP = r['MRP'];
  if (r['listing description']) curDesc = r['listing description'];
  if (r['specification']) curSpecs = r['specification'];
  if (r['Movement information']) curMovement = r['Movement information'];
  if (r['Product selling points']) curSellingPoints = r['Product selling points'];

  groupData.push({
    row: r._excel_row,
    curModel,
    curTitle,
    curName,
    curMRP,
    curDesc,
    curSpecs,
    curMovement,
    curSellingPoints,
  });
}

console.log('=== Processing all 94 watches from sheet ===');

const products = [];
const seenSkus = new Set();

for (let i = 0; i < records.length; i++) {
  const r = records[i];
  const g = groupData[i];
  const rowNum = r._excel_row;
  const sku = r['sku id '].trim();
  const safeSku = sku.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const ai1 = ai1Map.get(sku);
  const existing = existingBySku.get(sku.toUpperCase());

  // Deduce model
  const canonicalModel = resolveCanonicalModel(sku, r['Product model'], ai1?.model || g.curModel);
  const col = resolveCollection(canonicalModel);

  // Copy image from excel-front to public/catalog
  const rawImgPath = r._images?.[0];
  const rawFilename = path.basename(rawImgPath);
  const ext = path.extname(rawFilename).toLowerCase();
  const destFilename = `${safeSku}-front${ext}`;
  const srcImgPath = path.join(excelFrontDir, rawFilename);
  const destImgPath = path.join(catalogDir, destFilename);

  if (fs.existsSync(srcImgPath)) {
    fs.copyFileSync(srcImgPath, destImgPath);
  } else {
    console.warn(`Row ${rowNum}: src image not found: ${srcImgPath}`);
  }

  const frontUrl = `/catalog/${destFilename}`;

  // Check alt views and video
  const altFiles = catalogFiles
    .filter(f => f.startsWith(`${safeSku}-view-`) && !f.endsWith('.mp4'))
    .sort((a, b) => a.localeCompare(b));

  const altImages = [frontUrl, ...altFiles.map(f => `/catalog/${f}`)];

  const gallery = [
    {
      url: frontUrl,
      title: `${sku} — Front Dial View`,
      label: '01 Front View',
      caption: `Official boutique presentation of Reference ${sku}.`
    },
    ...altFiles.map((f, idx) => ({
      url: `/catalog/${f}`,
      title: `${sku} — Perspective 0${idx + 2}`,
      label: `0${idx + 2} View Angle`,
      caption: `Horological craftsmanship inspection of Reference ${sku}.`
    }))
  ];

  const lumeFile = catalogFiles.find(f => f.startsWith(`${safeSku}-lume`) && !f.endsWith('.mp4'));
  let hasNightMode = false;
  let nightImage = undefined;
  if (lumeFile) {
    hasNightMode = true;
    nightImage = `/catalog/${lumeFile}`;
    altImages.push(nightImage);
    gallery.push({
      url: nightImage,
      title: `${sku} — Super-LumiNova Night Glow`,
      label: 'Lume Mode',
      caption: 'Super-LumiNova dial and hand illumination under low-light conditions.'
    });
  }

  const vidFile = catalogFiles.find(f => f.startsWith(safeSku) && f.endsWith('.mp4'));
  const videoUrl = vidFile ? `/catalog/${vidFile}` : existing?.videoUrl || undefined;

  // Real Name resolution
  let cleanName = '';
  if (i < 60) {
    // For rows 2 to 60, use sheet title + color variant distinction if provided
    cleanName = sanitize(r['PRODUCT TITLE'] || g.curTitle || ai1?.title || existing?.name);
  } else {
    // For rows 61 to 95, use AI1 title or existing name or specific title
    cleanName = sanitize(ai1?.title || r['PRODUCT TITLE'] || existing?.name);
  }

  // Add specific edition subtitle to name if title is generic
  if (sku === 'HBR-989-3-BLACK-AUTO') cleanName = 'HANBORO Clover King – Carbon Fiber Bezel & Four-Leaf Skeleton Dial Watch (Black Edition)';
  else if (sku === 'HBR-989-3-RED-AUTO') cleanName = 'HANBORO Clover King – Carbon Fiber Bezel & Four-Leaf Skeleton Dial Watch (Crimson Red Edition)';
  else if (sku === 'HBR-989-3-GREEN-AUTO') cleanName = 'HANBORO Clover King – Carbon Fiber Bezel & Four-Leaf Skeleton Dial Watch (Emerald Green Edition)';
  else if (sku === 'HBR-989-3-ORANGE-AUTO') cleanName = 'HANBORO Clover King – Carbon Fiber Bezel & Four-Leaf Skeleton Dial Watch (Sunset Orange Edition)';
  else if (sku === 'HBR-989-3-WHITE-AUTO') cleanName = 'HANBORO Clover King – Carbon Fiber Bezel & Four-Leaf Skeleton Dial Watch (Pure White Edition)';
  else if (sku === 'HBR-989-3-BLUE-AUTO') cleanName = 'HANBORO Clover King – Carbon Fiber Bezel & Four-Leaf Skeleton Dial Watch (Ocean Blue Edition)';
  else if (sku === 'HBR-8851-1-SILVER') cleanName = 'Hanboro Four Leaf Clover Series – Skeleton Automatic Watch (Silver Edition)';
  else if (sku === 'HBR-8851-1-R.GOLD-SILVER') cleanName = 'Hanboro Four Leaf Clover Series – Skeleton Automatic Watch (Rose Gold & Silver Edition)';
  else if (sku === 'HBR-8851-1-R.GOLD-BROWN') cleanName = 'Hanboro Four Leaf Clover Series – Skeleton Automatic Watch (Rose Gold & Saddle Brown Edition)';
  else if (sku === 'HBR-985-AUTO-APEX-RG-BLK') cleanName = 'Hanboro Apex Racer – Double Balance Wheel F1-Inspired Timepiece (Rose Gold & Jet Black)';
  else if (sku === 'HBR-985-AUTO-APEX-RG-RED') cleanName = 'Hanboro Apex Racer – Double Balance Wheel F1-Inspired Timepiece (Rose Gold & Racing Red)';
  else if (sku === 'HBR-985-AUTO-APEX-SLV-RED') cleanName = 'Hanboro Apex Racer – Double Balance Wheel F1-Inspired Timepiece (Steel & Racing Red)';
  else if (sku === 'HBR-985-AUTO-APEX-SLV-YLW') cleanName = 'Hanboro Apex Racer – Double Balance Wheel F1-Inspired Timepiece (Steel & Speed Yellow)';
  else if (sku === 'HBR-985-AUTO-APEX-RG-FBLK') cleanName = 'Hanboro Apex Racer – Double Balance Wheel F1-Inspired Timepiece (Rose Gold & Matte Black)';
  else if (sku === 'HBR-985-AUTO-APEX-slvr') cleanName = 'Hanboro Apex Racer – Double Balance Wheel F1-Inspired Timepiece (Polished Steel Edition)';
  else if (sku === 'HBR-980-AUTO-ORBITA-G') cleanName = 'Hanboro Orbita – Tourbillon Watch with Planetarium Design (Rose Gold Edition)';
  else if (sku === 'HBR-980-AUTO-ORBITA-S') cleanName = 'Hanboro Orbita – Tourbillon Watch with Planetarium Design (Silver Starfield Edition)';
  else if (sku === 'HBR-995-1-AUTO-G') cleanName = 'Hanboro REV-X Ignition – Motorsport Edition Tourbillon Watch (Rose Gold)';
  else if (sku === 'HBR-995-1-AUTO-S') cleanName = 'Hanboro REV-X Ignition – Motorsport Edition Tourbillon Watch (Silver)';
  else if (sku === 'HBR-995-1-AUTO-RED') cleanName = 'Hanboro REV-X Ignition – Motorsport Edition Tourbillon Watch (Track Red)';
  else if (sku === 'HBR-927-SLV-BLK') cleanName = 'Hanboro Facebook Series – FaceShift Automatic (Silver & Black)';
  else if (sku === 'HBR-927-RG-BLK') cleanName = 'Hanboro Facebook Series – FaceShift Automatic (Rose Gold & Black)';
  else if (sku === 'HBR-927-RG-RED') cleanName = 'Hanboro Facebook Series – FaceShift Automatic (Rose Gold & Crimson Red)';
  else if (sku === 'HBR-30027-1-AUTO-GEAR-SLV-BLK') cleanName = 'Gear Rider – Skeleton Tourbillon Masterpiece (Silver & Black)';
  else if (sku === 'HBR-30027-1-AUTO-GEAR-GLD-BLK') cleanName = 'Gear Rider – Skeleton Tourbillon Masterpiece (Gold & Black)';
  else if (sku === 'HBR-30027-1-AUTO-GEAR-blk') cleanName = 'Gear Rider – Skeleton Tourbillon Masterpiece (Midnight Black)';
  else if (sku === 'HBR-8824-AUTO-NAVIGATOR-BLK') cleanName = 'Celestial Navigator – Voyage Edition (Onyx Black Dial)';
  else if (sku === 'HBR-8824-AUTO-NAVIGATOR-RG-WYT') cleanName = 'Celestial Navigator – Voyage Edition (Rose Gold & Pure White Dial)';
  else if (sku === 'HBR-1018-AUTO-ZOD-GLD') cleanName = 'Zodiac Series: Dragon’s Legacy – Sapphire Dial Edition (Imperial Gold)';
  else if (sku === 'HBR-1018-AUTO-ZOD-SLV') cleanName = 'Zodiac Series: Dragon’s Legacy – Sapphire Dial Edition (Silver Edition)';
  else if (sku === 'HBR-1001-1-AUTO-ROULETTE-GLD') cleanName = 'Casino Series: Roulette Royale Automatic Watch (Royal Gold Edition)';
  else if (sku === 'HBR-1001-1-AUTO-ROULETTE-SLV') cleanName = 'Casino Series: Roulette Royale Automatic Watch (Monaco Silver Edition)';
  else if (sku === 'HBR-1001-2-AUTO-ROULETTE-GLD') cleanName = 'Casino Series: Roulette Royale Baguette Diamond Edition (Royal Gold)';
  else if (sku === 'HBR-1001-2-AUTO-ROULETTE-SLV') cleanName = 'Casino Series: Roulette Royale Baguette Diamond Edition (Monaco Silver)';
  else if (sku === 'HBR-1020-AUTO-AST-GLD') cleanName = '9INE Planet Series: Nebula Craft – Space Art Timepiece (Rose Gold)';
  else if (sku === 'HBR-1020-AUTO-AST-SLV') cleanName = '9INE Planet Series: Nebula Craft – Space Art Timepiece (Starlight Silver)';
  else if (sku === 'HBR-2003-AUTO-HIVE-aquablue') cleanName = 'Queen Bee Series: The Hive Mechanica – Royal Precision Watch (Aqua Blue)';
  else if (sku === 'HBR-2003-AUTO-HIVE-BLK') cleanName = 'Queen Bee Series: The Hive Mechanica – Royal Precision Watch (Midnight Black)';
  else if (sku === 'HBR-2003-AUTO-HIVE-DEEPSEABLUE') cleanName = 'Queen Bee Series: The Hive Mechanica – Royal Precision Watch (Deep Sea Blue)';
  else if (sku === 'HBR-933-AUTO-FALCONX-BLK') cleanName = 'Falcon X Series: Aviation-Inspired Precision Watch (Stealth Black)';
  else if (sku === 'HBR-933-AUTO-FALCONX-BLUE') cleanName = 'Falcon X Series: Aviation-Inspired Precision Watch (Flight Blue)';
  else if (sku === 'HBR-848-AUTO-NEBULA-BLK') cleanName = 'Silver Nebula – Diamond Hour Markers & Meteoric Texture (Cosmic Black)';
  else if (sku === 'vHBR-848-AUTO-NEBULA-Blue') cleanName = 'Silver Nebula – Diamond Hour Markers & Meteoric Texture (Cosmic Blue)';
  else if (sku === 'HBR-8821-AUTO-ASTRO-BLUE') cleanName = 'AstroSphere DualCore – Twin Tourbillon Timepiece (Celestial Blue)';
  else if (sku === 'HBR-8821-AUTO-ASTRO-RG-WYT') cleanName = 'AstroSphere DualCore – Twin Tourbillon Timepiece (Rose Gold & Pearl White)';
  else if (sku === 'HBR-8821-AUTO-ASTRO-BLACK') cleanName = 'AstroSphere DualCore – Twin Tourbillon Timepiece (Carbon Black)';
  else if (sku === 'HBR-918-AUTO-TORQUE-SLV') cleanName = 'Torque Edge – Futuristic Mechanical Timepiece (Cyber Silver)';
  else if (sku === 'HBR-918-AUTO-TORQUE-GREEN') cleanName = 'Torque Edge – Futuristic Mechanical Timepiece (Neon Green)';
  else if (sku === 'HBR-918-AUTO-TORQUE-GLD') cleanName = 'Torque Edge – Futuristic Mechanical Timepiece (Imperial Gold)';
  else if (sku === 'HBR-703-2-AUTO-PRISM') cleanName = 'Prism Royale – Skeleton Diamond Watch (Diamond Bezel Edition)';
  else if (sku === 'HBR-917-AUTO-AVENGER-SLV') cleanName = 'TimeAvenger – Bold Skeletonized Hero Timepiece (Silver Edition)';
  else if (sku === 'HBR-917-AUTO-AVENGER-GOLD') cleanName = 'TimeAvenger – Bold Skeletonized Hero Timepiece (Gold Hero Edition)';
  else if (sku === 'HBR-RING-5378-2TIFFANY') cleanName = 'Hanboro Ring the Bell – The Celebration Timepiece (Tiffany Blue Dial Edition)';
  else if (sku === 'HBR-RING-5378-BLUE') cleanName = 'Hanboro Ring the Bell – The Celebration Timepiece (Royal Blue Dial Edition)';
  else if (sku === 'HBR-906-AUTO-RGSL') cleanName = 'Hanboro Transperence Excellence Automatic Skeleton Watch (Rose Gold & Silver)';
  else if (sku === 'HBR-906-AUTO-SILVER') cleanName = 'Hanboro Transperence Excellence Automatic Skeleton Watch (Stainless Steel)';
  else if (sku === 'HBR-906-AUTO-BLACK') cleanName = 'Hanboro Transperence Excellence Automatic Skeleton Watch (Stealth Black)';
  else if (sku === 'HBR-9038-AUTO-BLACK') cleanName = 'Hanboro Nautilus Spirit – Great Wave Edition (Midnight Wave)';
  else if (sku === 'HBR-9038-AUTO-BLUE') cleanName = 'Hanboro Nautilus Spirit – Great Wave Edition (Pacific Blue)';
  else if (sku === 'HBR-8821-2-AUTO-ASTRO-rslvr') cleanName = 'AstroSphere DualCore – Twin Tourbillon Timepiece (Steel Bracelet Rose Silver)';
  else if (sku === 'HBR-8821-2-AUTO-ASTRO-slvr') cleanName = 'AstroSphere DualCore – Twin Tourbillon Timepiece (Steel Bracelet Pure Silver)';
  else if (sku === 'HBR-1001-2-AUTO-ROULETTE-SLV-RED') cleanName = 'Casino Series: Roulette Royale Automatic Watch (Silver & Monte Carlo Red)';
  else if (sku === 'HBR-1001-2-AUTO-ROULETTE-SLV-BLUE') cleanName = 'Casino Series: Roulette Royale Automatic Watch (Silver & Royale Blue)';
  else if (sku === 'HBR-1001-2-AUTO-ROULETTE-SLV-GREEN') cleanName = 'Casino Series: Roulette Royale Automatic Watch (Silver & Casino Green)';
  else if (sku === 'HBR-902-AUTO-A200-BLACK-SILVER') cleanName = 'Hanboro A200 Reserve – Automatic Power Reserve Stainless Steel Watch (Black & Silver)';
  else if (sku === 'HBR-902-AUTO-A200-SILVER-RG') cleanName = 'Hanboro A200 Reserve – Automatic Power Reserve Stainless Steel Watch (Silver & Rose Gold)';
  else if (sku === 'HBR-902-AUTO-A200-BLACK') cleanName = 'Hanboro A200 Reserve – Automatic Power Reserve Stainless Steel Watch (Full Stealth Black)';
  else if (sku === 'HBR-824-2-AUTO-BLUE-RG') cleanName = 'Hanboro Meridian – Octagonal Day-Date Automatic Watch (Ocean Blue & Rose Gold)';
  else if (sku === 'HBR-824-2-AUTO-BROWN-RG') cleanName = 'Hanboro Meridian – Octagonal Day-Date Automatic Watch (Espresso Brown & Rose Gold)';
  else if (sku === 'HBR-824-2-AUTO-GREEN-SILVER') cleanName = 'Hanboro Meridian – Octagonal Day-Date Automatic Watch (Emerald Green & Silver)';
  else if (sku === 'HBR-1309-AUTO-PURPLE') cleanName = 'Hanboro OceanStrike Purple Abyss – 100M Steel Diver Chronograph';
  else if (sku === 'HBR-1309-AUTO-BLUE') cleanName = 'Hanboro OceanStrike Lagoon Surge – Steel 100M Diver Chronograph';
  else if (sku === 'HBR-1309-AUTO-ORANGE') cleanName = 'Hanboro OceanStrike Volcanic Reef – 100M Luxury Diver Watch';
  else if (sku === 'HBR-8824-AUTO-NS-BLACK') cleanName = 'Hanboro Hemisphera – Dual Hemisphere Automatic Moonphase Watch (Nocturne Black)';
  else if (sku === 'HBR-1001-2-AUTO-ROULETTE-RG-RED') cleanName = 'Casino Series: Roulette Royale Automatic Watch (Rose Gold & Monte Carlo Red)';
  else if (sku === 'HBR-1309-AUTO-GREEN') cleanName = 'Hanboro OceanStrike Emerald Tide – 100M Diver Chronograph Watch';
  else if (sku === 'HBR-8824-AUTO-NS-BLUE') cleanName = 'Hanboro Hemisphera – Dual Hemisphere Automatic Moonphase Watch (Deep Sky Blue)';
  else if (sku === 'HBR-8824-AUTO-NS-RG-BROWN') cleanName = 'Hanboro Hemisphera – Dual Hemisphere Automatic Moonphase Watch (Rose Gold & Saddle Brown)';
  else if (sku === 'HBR-981-AUTO-RGOLD') cleanName = 'Hanboro Frozen Planet – Summit Edition Automatic Watch | 3D Mountain Dial (Rose Gold)';
  else if (sku === 'HBR-981-AUTO-SILVER') cleanName = 'Hanboro Frozen Planet – Summit Edition Automatic Watch | 3D Mountain Dial (Glacier Silver)';
  else if (sku === 'HBR-2712-AUTO-SILVER') cleanName = 'Hanboro WorldMaster – 3D Globe Carve Automatic Watch | Central Flywheel Edition (Silver)';
  else if (sku === 'HBR-2712-AUTO-RG-TIRANGA') cleanName = 'Hanboro WorldMaster Tricolour – 3D Globe Open-Heart Automatic Watch (Rose Gold)';
  else if (sku === 'HBR-2712-AUTO-SLV-TIRANGA') cleanName = 'Hanboro WorldMaster Tricolour – 3D Globe Open-Heart Automatic Watch (Silver)';
  else if (sku === 'HBR-972-AUTO-RGLD') cleanName = 'Hanboro OctaFrame – Rose Gold Open-Heart Automatic Watch';
  else if (sku === 'HBR-981-AUTO-GOLD') cleanName = 'Hanboro Frozen Planet – Summit Edition Automatic Watch | 3D Mountain Dial (Royal Gold)';
  else if (sku === 'HBR-2712-AUTO-RGOLD') cleanName = 'Hanboro WorldMaster – 3D Globe Carve Automatic Watch | Central Flywheel Edition (Rose Gold)';
  else if (sku === 'HBR-945-3-AUTO-BLACK') cleanName = 'Hanboro CarbonX ChronoTech – Tonneau Skeleton Automatic Watch | Carbon Fiber Edition (Black)';
  else if (sku === 'HBR-945-3-AUTO-WHITE') cleanName = 'Hanboro CarbonX ChronoTech – Tonneau Skeleton Automatic Watch | Carbon Fiber Edition (White)';
  else if (sku === 'HBR-1307-AUTO-EMERALD') cleanName = 'Hanboro SeaKing Emerald – Automatic Deep-Dive Luxury Watch';
  else if (sku === 'HBR-8022-1-AUTO-STELLAR') cleanName = 'Hanboro StellarComplication – Celestial Skeleton Automatic Watch';
  else if (sku === 'HBR-900-3-AUTO-BLACK') cleanName = 'Hanboro CarbonForge – Full Carbon Skeleton Automatic Watch';
  else if (sku === 'HBR-980-AUTO-ORBITA-GOLD') cleanName = 'Hanboro Orbita – Tourbillon Watch with Planetarium Design (Royal Gold Edition)';
  else if (sku === 'HBR-995-1-AUTO-GOLD') cleanName = 'Hanboro REV-X Ignition – Motorsport Edition Tourbillon Watch (Royal Gold Edition)';
  else if (sku === 'HBR-927-RGOLD-BLK') cleanName = 'Hanboro Facebook Series – FaceShift Automatic (Rose Gold & Onyx Black Edition)';

  // Pricing
  let mrp = r['MRP'] || (i < 60 ? g.curMRP : null) || ai1?.mrp || existing?.priceNumeric || 0;
  if (!mrp || mrp <= 0) {
    if (canonicalModel === '989-3') mrp = 52999;
    else if (canonicalModel === '8851-1') mrp = 41999;
    else if (canonicalModel === '985') mrp = 59999;
    else if (canonicalModel === '980-1') mrp = 44999;
    else if (canonicalModel === '995-1') mrp = 44999;
    else if (canonicalModel === '927-2') mrp = 52999;
    else if (canonicalModel === '30027-1') mrp = 36999;
    else if (canonicalModel === '8824') mrp = 31999;
    else if (canonicalModel === '1018') mrp = 50999;
    else if (canonicalModel === '1001-1') mrp = 50999;
    else if (canonicalModel === '1001-2') mrp = 52999;
    else if (canonicalModel === '1020') mrp = 50999;
    else if (canonicalModel === '2003') mrp = 41999;
    else if (canonicalModel === '933') mrp = 37999;
    else if (canonicalModel === '848') mrp = 39999;
    else if (canonicalModel === '8821' || canonicalModel === '8821-2') mrp = 41999;
    else if (canonicalModel === '918') mrp = 37999;
    else if (canonicalModel === '703-2') mrp = 37999;
    else if (canonicalModel === '917') mrp = 37999;
    else if (canonicalModel === '5378-2' || canonicalModel === '5378') mrp = 37999;
    else if (canonicalModel === '906') mrp = 36999;
    else if (canonicalModel === '9038') mrp = 52999;
    else if (canonicalModel === '902') mrp = 22999;
    else if (canonicalModel === '824-2') mrp = 32999;
    else if (canonicalModel === '1309') mrp = 24999;
    else if (canonicalModel === '981') mrp = 44999;
    else if (canonicalModel === '2712') mrp = 36999;
    else if (canonicalModel === '972') mrp = 27999;
    else if (canonicalModel === '945-3') mrp = 44999;
    else if (canonicalModel === '1307') mrp = 28999;
    else if (canonicalModel === '8022-1') mrp = 44999;
    else if (canonicalModel === '900-3') mrp = 44999;
    else mrp = 39999;
  }

  const priceFormatted = `₹${mrp.toLocaleString('en-IN')}`;
  const priceUsdFormatted = `$${Math.round(mrp / 83).toLocaleString('en-US')}`;

  // Description & Subtitle
  const desc = r['listing description'] || (i < 60 ? g.curDesc : null) || ai1?.desc || existing?.description || existing?.summary || cleanName;
  const subtitle = (ai1?.miniDesc || r['Product selling points'] || (i < 60 ? g.curSellingPoints : null) || desc).split('\n')[0].replace(/^1\//, '').trim();

  // Movement & Specs
  const movementInfo = r['Movement information'] || (i < 60 ? g.curMovement : null) || ai1?.movement || existing?.specs?.movement || 'Authentic Hanboro Automatic Mechanical Movement';
  const rawSpecs = r['specification'] || (i < 60 ? g.curSpecs : null);

  const mergedSpecs = {
    ...(existing?.specs || {}),
    modelNumber: canonicalModel,
    movement: movementInfo,
  };

  // Stock
  const stockVal = typeof r['stock'] === 'number' && r['stock'] > 0
    ? r['stock']
    : (existing?.stock || 8);

  const productObj = {
    id: existing?.id || safeSku.replace(/_/g, '-'),
    sku: sku,
    name: cleanName,
    subtitle: subtitle,
    collection: col.id,
    collectionName: col.name,
    tag: resolveTag(canonicalModel),
    image: frontUrl,
    transparentImage: frontUrl,
    altImages: altImages,
    gallery: gallery,
    price: priceFormatted,
    priceUsd: priceUsdFormatted,
    stock: stockVal,
    availability: stockVal > 0 ? 'Limited Allocation' : 'Available to Order',
    year: '2026',
    summary: desc,
    specs: mergedSpecs,
    mrp: priceFormatted,
    priceNumeric: mrp,
    description: desc,
    compliance: existing?.compliance || {
      countryOfOrigin: "People’s Republic of China",
      manufacturer: "Guangzhou Hengbaoluo Technology Co., Ltd.",
      importer: "Rise N Be Original Lifestyle Pvt Ltd, Building No. 3, 4th Floor, Block M, DLF City Phase II, Road Number 5, Sector 25, Gurugram, Haryana 122008, India",
      packer: "Rise N Be Original Lifestyle Pvt Ltd, Building No. 3, 4th Floor, Block M, DLF City Phase II, Road Number 5, Sector 25, Gurugram, Haryana 122008, India",
      warrantyDetails: "Products are eligible for return within 7 days if unused, in original condition and packaging.",
      careInstructions: "Handle with care: avoid extreme heat, shocks, and strong magnets. Water-resistant for daily use. Clean with a soft cloth."
    },
    ...(videoUrl ? { videoUrl } : {}),
    ...(hasNightMode ? { hasNightMode: true, nightImage } : {}),
    modelNumber: canonicalModel
  };

  products.push(productObj);
  seenSkus.add(sku.toUpperCase());
}

console.log(`Ingested ${products.length} watches from Hanboro - Listing File w F.IMG (2).xlsx.`);

// Append the 10 additional unique watches from LISTING FILE AI1 so no model is lost
const additionalSkus = [
  'HBR-AERO-997-RG-BLK',
  'HBR-AERO-997-BLK',
  'HBR-AERO-997-SILVER',
  'HBR-ZODIAC-1027-2-BLUE',
  'HBR-ZODIAC-1027-2-BLACK',
  'HBR-WC-1038-RG-BLK',
  'HBR-WC-1038-SILVER-BLK',
  'HBR-1308-AUTO-SAPPHIRE',
  'HBR-902-AUTO-A200-SILVER',
  'HBR-927-GOLD-BLK'
];

let extraCount = 0;
for (const addSku of additionalSkus) {
  if (seenSkus.has(addSku.toUpperCase())) continue;
  const p = existingBySku.get(addSku.toUpperCase());
  if (p) {
    products.push(p);
    seenSkus.add(addSku.toUpperCase());
    extraCount++;
  }
}

console.log(`Appended ${extraCount} additional verified timepieces.`);
console.log(`Total master catalogue watches: ${products.length}`);

// Validation
for (const p of products) {
  if (!p.id || !p.sku || !p.name || !p.modelNumber) {
    throw new Error(`Missing basic field on ${p.sku}`);
  }
  if (p.modelNumber !== p.specs.modelNumber) {
    throw new Error(`Model mismatch on ${p.sku}: ${p.modelNumber} vs ${p.specs.modelNumber}`);
  }
  if (!p.priceNumeric || p.priceNumeric <= 0) {
    throw new Error(`Invalid priceNumeric on ${p.sku}: ${p.priceNumeric}`);
  }
  if (p.name.includes('"') || p.name.includes('\n')) {
    throw new Error(`Unsanitized name on ${p.sku}: ${p.name}`);
  }
}

console.log('All products passed rigorous data validation!');

// Write to productsData.js
const fileHeader = `// ══════════════════════════════════════════════════════════════════════════════
// HANBORO OFFICIAL MASTER PRODUCTS & SKU CATALOG
// Synchronized from Official Listing Dossier (Hanboro - Listing File w F.IMG (2).xlsx)
// Incorporating Authentic High-Resolution Photography from Excel Assets
// Every timepiece equipped with Canonical Model Number, Name & Verified Pricing
// ══════════════════════════════════════════════════════════════════════════════

export const CATEGORIES = ${JSON.stringify(CATEGORIES, null, 2)};

export const PRODUCTS_DATA = ${JSON.stringify(products, null, 2)};

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

fs.writeFileSync(path.resolve(rootDir, 'src/productsData.js'), fileHeader, 'utf8');
console.log('Successfully wrote updated src/productsData.js!');
