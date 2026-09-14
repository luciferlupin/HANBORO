import fs from 'node:fs';
import path from 'node:path';
import { execSync, exec } from 'node:child_process';

const EXCEL_PATH = '/Users/harshitgoyal/Downloads/LISTING FILE AI1 .xlsx';
const OUTPUT_DIR = path.resolve('public/catalog');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

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

const allRawWatches = [];
const folderCache = new Map(); // folderId -> array of file items [ { id, name, mime } ]

for (let s = 1; s <= 11; s++) {
  try {
    const sheetXml = execSync(`unzip -p "${EXCEL_PATH}" xl/worksheets/sheet${s}.xml 2>/dev/null`).toString('utf8');
    let rels = {};
    try {
      const relsXml = execSync(`unzip -p "${EXCEL_PATH}" xl/worksheets/_rels/sheet${s}.xml.rels 2>/dev/null`).toString('utf8');
      const rMatch = relsXml.match(/<Relationship[^>]+Id="([^"]+)"[^>]+Target="([^"]+)"/g) || [];
      for (const r of rMatch) {
        rels[r.match(/Id="([^"]+)"/)[1]] = r.match(/Target="([^"]+)"/)[1];
      }
    } catch (_) {}

    const hyperlinks = {};
    const hlMatches = sheetXml.match(/<hyperlink[^>]+>/g) || [];
    for (const hl of hlMatches) {
      const refMatch = hl.match(/ref="([^"]+)"/);
      const ridMatch = hl.match(/r:id="([^"]+)"/);
      if (refMatch && ridMatch && rels[ridMatch[1]]) {
        hyperlinks[refMatch[1]] = rels[ridMatch[1]];
      }
    }

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
      const seriesName = (vals['E'] || '').trim();
      const description = (vals['F'] || '').trim();
      const miniDescription = (vals['G'] || '').trim();
      const mrpRaw = (vals['BS'] || '').trim();
      const mrpNum = parseFloat(mrpRaw) || 0;

      // Check image links
      const uLink = hyperlinks[`U${rowNum}`] || vals['U'] || '';
      const vLink = hyperlinks[`V${rowNum}`] || vals['V'] || '';
      const wLink = hyperlinks[`W${rowNum}`] || vals['W'] || '';

      allRawWatches.push({
        sheet: s,
        row: rowNum,
        sku,
        title,
        seriesName,
        description,
        miniDescription,
        mrp: mrpNum,
        uLink,
        vLink,
        wLink
      });
    }
  } catch (e) {
    // console.error(`Sheet ${s} error:`, e.message);
  }
}

console.log(`Parsed ${allRawWatches.length} total watch records from Excel.`);

// Helper: resolve a Google Drive folder to its file list
function resolveFolder(folderId) {
  if (folderCache.has(folderId)) return folderCache.get(folderId);
  try {
    const html = execSync(`curl -s -L "https://drive.google.com/drive/folders/${folderId}"`, { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
    const match = html.match(/window\['_DRIVE_ivd'\]\s*=\s*'([^']+)'/);
    if (match) {
      const decoded = match[1].replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
      const json = JSON.parse(decoded);
      const files = (json[0] || []).filter(Array.isArray).map(f => ({
        id: f[0],
        name: f[2],
        mime: f[3]
      }));
      folderCache.set(folderId, files);
      return files;
    }
  } catch (e) {
    console.error(`Error resolving folder ${folderId}:`, e.message);
  }
  folderCache.set(folderId, []);
  return [];
}

console.log('\n=== Step 2: Resolving Google Drive Folders & Media ===');
const allFolders = new Set();
for (const w of allRawWatches) {
  for (const l of [w.uLink, w.vLink, w.wLink]) {
    const m = l.match(/\/drive\/folders\/([a-zA-Z0-9_-]+)/);
    if (m) allFolders.add(m[1]);
  }
}
console.log(`Found ${allFolders.size} unique Google Drive folders to resolve.`);

let fCount = 0;
for (const fid of allFolders) {
  fCount++;
  const files = resolveFolder(fid);
  console.log(`[${fCount}/${allFolders.size}] Folder ${fid}: ${files.length} files found`);
}

// Helper: download file from Google Drive if not already cached
function downloadDriveFile(id, destPath) {
  return new Promise((resolve) => {
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 5000) {
      return resolve({ success: true, cached: true });
    }
    const url = `https://drive.usercontent.google.com/download?id=${id}&export=download`;
    exec(`curl -L -s "${url}" -o "${destPath}"`, { timeout: 30000 }, (err) => {
      if (err) return resolve({ success: false, err: err.message });
      try {
        if (fs.existsSync(destPath) && fs.statSync(destPath).size > 5000) {
          return resolve({ success: true });
        }
      } catch (_) {}
      resolve({ success: false });
    });
  });
}

// Queue downloads with concurrency
async function downloadInBatches(tasks, concurrency = 6) {
  let index = 0;
  const results = [];
  async function worker() {
    while (index < tasks.length) {
      const cur = index++;
      const task = tasks[cur];
      const res = await task();
      results[cur] = res;
    }
  }
  const workers = Array(Math.min(concurrency, tasks.length)).fill(0).map(worker);
  await Promise.all(workers);
  return results;
}

console.log('\n=== Step 3: Preparing Download Tasks for Watch Photography ===');

const downloadTasks = [];
const watchPhotoMap = new Map(); // sku -> { frontImage, altImages: [], nightImage: null }

for (const w of allRawWatches) {
  const safeSku = w.sku.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const photos = {
    frontImage: null,
    altImages: [],
    nightImage: null
  };

  const candidateFiles = []; // [ { id, name } ]

  for (const l of [w.uLink, w.vLink, w.wLink]) {
    if (!l) continue;
    const folderMatch = l.match(/\/drive\/folders\/([a-zA-Z0-9_-]+)/);
    if (folderMatch) {
      const folderFiles = folderCache.get(folderMatch[1]) || [];
      for (const ff of folderFiles) {
        if (/\.(png|jpe?g|webp)$/i.test(ff.name)) {
          candidateFiles.push({ id: ff.id, name: ff.name });
        }
      }
    } else {
      const fileMatch = l.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (fileMatch) {
        candidateFiles.push({ id: fileMatch[1], name: 'primary.jpg' });
      }
    }
  }

  // Deduplicate candidates by id
  const seenIds = new Set();
  const uniqueCandidates = [];
  for (const c of candidateFiles) {
    if (!seenIds.has(c.id)) {
      seenIds.add(c.id);
      uniqueCandidates.push(c);
    }
  }

  if (uniqueCandidates.length > 0) {
    // Sort candidates: transparent PNGs (e.g. 1.png, 15.png) or primary first, lume photos for night
    let frontCandidate = uniqueCandidates.find(c => /\.(png|webp)$/i.test(c.name) && !c.name.includes('夜光')) || uniqueCandidates[0];
    const nightCandidate = uniqueCandidates.find(c => c.name.includes('夜光') || c.name.toLowerCase().includes('lume') || c.name.toLowerCase().includes('night'));

    const frontExt = path.extname(frontCandidate.name) || '.jpg';
    const frontDest = path.join(OUTPUT_DIR, `${safeSku}-front${frontExt}`);
    photos.frontImage = `/catalog/${safeSku}-front${frontExt}`;

    downloadTasks.push(async () => {
      return downloadDriveFile(frontCandidate.id, frontDest);
    });

    if (nightCandidate) {
      const nightExt = path.extname(nightCandidate.name) || '.jpg';
      const nightDest = path.join(OUTPUT_DIR, `${safeSku}-lume${nightExt}`);
      photos.nightImage = `/catalog/${safeSku}-lume${nightExt}`;
      downloadTasks.push(async () => {
        return downloadDriveFile(nightCandidate.id, nightDest);
      });
    }

    // Additional angles
    let angleIdx = 1;
    for (const c of uniqueCandidates) {
      if (c.id === frontCandidate.id || (nightCandidate && c.id === nightCandidate.id)) continue;
      if (angleIdx > 5) break; // max 5 alt images per watch
      const ext = path.extname(c.name) || '.jpg';
      const altDest = path.join(OUTPUT_DIR, `${safeSku}-view-${angleIdx}${ext}`);
      const altUrl = `/catalog/${safeSku}-view-${angleIdx}${ext}`;
      photos.altImages.push(altUrl);
      downloadTasks.push(async () => {
        return downloadDriveFile(c.id, altDest);
      });
      angleIdx++;
    }
  }

  watchPhotoMap.set(w.sku, photos);
}

console.log(`Generated ${downloadTasks.length} image download tasks. Executing parallel download pool...`);

const startDownloadTime = Date.now();
await downloadInBatches(downloadTasks, 8);
console.log(`Completed all image downloads in ${((Date.now() - startDownloadTime) / 1000).toFixed(1)}s.`);

// Verify downloaded images
const downloadedFiles = fs.readdirSync(OUTPUT_DIR).filter(f => !f.startsWith('.'));
console.log(`Total active photos in public/catalog: ${downloadedFiles.length}`);

console.log('\n=== Step 4: Synchronizing src/productsData.js with Authentic Photos ===');

// Read existing productsData.js
const productsDataJs = fs.readFileSync('src/productsData.js', 'utf8');

let updatedCode = productsDataJs;
let updatedCount = 0;

for (const [sku, photos] of watchPhotoMap.entries()) {
  if (!photos.frontImage) continue;

  const safeFront = path.join(OUTPUT_DIR, path.basename(photos.frontImage));
  if (!fs.existsSync(safeFront) || fs.statSync(safeFront).size < 3000) {
    continue; // Don't replace if download failed
  }

  // Find the product block by SKU
  const escapedSku = sku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const blockRegex = new RegExp(`(\\{\\s*id:[^}]+sku:\\s*["']${escapedSku}["'][\\s\\S]*?\\n  \\})`, 'g');

  const match = blockRegex.exec(updatedCode);
  if (match) {
    let block = match[1];
    
    // Replace image: "..."
    block = block.replace(/image:\s*["'][^"']+["']/, `image: "${photos.frontImage}"`);

    // Replace or add nightImage
    if (photos.nightImage) {
      const safeLume = path.join(OUTPUT_DIR, path.basename(photos.nightImage));
      if (fs.existsSync(safeLume) && fs.statSync(safeLume).size > 3000) {
        if (block.includes('nightImage:')) {
          block = block.replace(/nightImage:\s*["'][^"']+["']/, `nightImage: "${photos.nightImage}"`);
        } else {
          block = block.replace(/hasNightMode:\s*(true|false)/, `hasNightMode: true,\n    nightImage: "${photos.nightImage}"`);
        }
      }
    }

    // Replace or add altImages
    if (photos.altImages.length > 0) {
      const validAlts = [photos.frontImage];
      for (const alt of photos.altImages) {
        const altFile = path.join(OUTPUT_DIR, path.basename(alt));
        if (fs.existsSync(altFile) && fs.statSync(altFile).size > 3000) {
          validAlts.push(alt);
        }
      }
      if (validAlts.length > 1) {
        const altsJson = JSON.stringify(validAlts);
        if (block.includes('altImages:')) {
          block = block.replace(/altImages:\s*\[[\s\S]*?\]/, `altImages: ${altsJson}`);
        } else {
          block = block.replace(/image:\s*["'][^"']+["'],/, `image: "${photos.frontImage}",\n    altImages: ${altsJson},`);
        }
      }
    }

    updatedCode = updatedCode.replace(match[1], block);
    updatedCount++;
  }
}

fs.writeFileSync('src/productsData.js', updatedCode, 'utf8');
console.log(`Successfully updated ${updatedCount} watches in src/productsData.js with authentic Excel photography!`);
