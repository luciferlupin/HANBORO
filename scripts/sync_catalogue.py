import json
import re
import subprocess

# 1. Load Excel data
with open('scratch_excel_products.json', 'r', encoding='utf-8') as f:
    excel_list = json.load(f)

excel_by_sku = {}
for e in excel_list:
    sku = e['sku'].strip()
    if sku and sku not in excel_by_sku:
        excel_by_sku[sku] = e

print(f"Loaded {len(excel_by_sku)} unique Excel SKUs.")

# 2. Load current site products
node_script = 'import("./src/productsData.js").then(m => console.log(JSON.stringify(m.PRODUCTS_DATA)))'
out = subprocess.check_output(['node', '-e', node_script]).decode('utf-8')
site_products = json.loads(out)
print(f"Loaded {len(site_products)} site products.")

def format_inr(val, default="₹52,999"):
    if not val:
        return default
    try:
        num = int(float(str(val).replace(',', '').strip()))
        return f"₹{num:,}"
    except:
        return str(val)

def get_numeric_price(val, default=52999):
    if not val:
        return default
    try:
        return int(float(str(val).replace(',', '').strip()))
    except:
        return default

# Mapping for the 84 site products to Excel SKUs
SITE_TO_EXCEL = {
    'astroworld-celestial': 'HBR-980-AUTO-ORBITA-GOLD',
    'astroworld-celestial-silver': 'HBR-980-AUTO-ORBITA-S',
    'astroworld-tourbillon-black-dlc': 'HBR-8022-1-AUTO-STELLAR',
    'astroworld-tourbillon-fluted-rosegold': 'HBR-981-AUTO-RGOLD',
    'astroworld-tourbillon-fluted-silver': 'HBR-981-AUTO-SILVER',
    'volcano-glacier-compass-gold': 'HBR-981-AUTO-GOLD',
    'volcano-glacier-compass-rosegold': 'HBR-981-AUTO-RGOLD',
    'volcano-glacier-compass-silver': 'HBR-981-AUTO-SILVER',
    'supercar-engine-block-rosegold': 'HBR-985-AUTO-APEX-RG-BLK',
    'supercar-engine-block-silver': 'HBR-985-AUTO-APEX-slvr',
    'casino-roulette-wheel-rosegold': 'HBR-1001-2-AUTO-ROULETTE-GLD',
    'casino-roulette-wheel-silver': 'HBR-1001-2-AUTO-ROULETTE-SLV',
    'casino-roulette-wheel-diamond-emerald': 'HBR-1001-2-AUTO-ROULETTE-RG-GREEN',
    'casino-roulette-wheel-sapphire-diamond': 'HBR-1001-2-AUTO-ROULETTE-RG-BLUE',
    'casino-roulette-wheel-emerald-alligator': 'HBR-1001-1-AUTO-ROULETTE-GLD',
    'casino-roulette-wheel-ruby-diamond': 'HBR-1001-2-AUTO-ROULETTE-RG-RED',
    'casino-roulette-wheel-silver-diamond-emerald': 'HBR-1001-2-AUTO-ROULETTE-SLV-GREEN',
    'casino-roulette-wheel-silver-sapphire-diamond': 'HBR-1001-2-AUTO-ROULETTE-SLV-BLUE',
    'casino-roulette-wheel-silver-emerald-alligator': 'HBR-1001-1-AUTO-ROULETTE-SLV',
    'casino-roulette-wheel-silver-ruby-diamond': 'HBR-1001-2-AUTO-ROULETTE-SLV-RED',
    'celestial-dragon-tourbillon-rosegold': 'HBR-1018-AUTO-ZOD-GLD',
    'celestial-dragon-tourbillon-silver': 'HBR-1018-AUTO-ZOD-SLV',
    'planetary-cosmos-tourbillon-rosegold': 'HBR-1020-AUTO-AST-GLD',
    'planetary-cosmos-tourbillon-silver': 'HBR-1020-AUTO-AST-SLV',
    'oceanic-diver-200m-green': 'HBR-1307-AUTO-EMERALD',
    'seamaster-chronograph-diver-teal': 'HBR-1309-AUTO-BLUE',
    'seamaster-chronograph-diver-olive': 'HBR-1309-AUTO-GREEN',
    'seamaster-chronograph-diver-amber': 'HBR-1309-AUTO-ORANGE',
    'seamaster-chronograph-diver-violet': 'HBR-1309-AUTO-PURPLE',
    'mecha-cantilever-tourbillon-iceblue': 'HBR-995-1-AUTO-S',
    'world-map-tourbillon-rosegold': 'HBR-2712-AUTO-RGOLD',
    'world-map-tourbillon-blue': 'HBR-2712-AUTO-SILVER',
    'world-map-tourbillon-silver': 'HBR-2712-AUTO-SLV-TIRANGA',
    'world-map-tourbillon-silver-dual': 'HBR-2712-AUTO-RG-TIRANGA',
    'overseas-perpetual-skeleton-steel': 'HBR-8022-1-AUTO-STELLAR',
    'celestial-pilot-moonphase-black': 'HBR-8824-AUTO-NS-BLACK',
    'celestial-pilot-moonphase-rosegold': 'HBR-8824-AUTO-NS-RG-BROWN',
    'dual-hemispheres-moonphase-steel': 'HBR-8824-AUTO-NAVIGATOR-BLK',
    'dual-hemispheres-moonphase-blue': 'HBR-8824-AUTO-NS-BLUE',
    'dual-hemispheres-moonphase-rosegold': 'HBR-8824-AUTO-NAVIGATOR-RG-WYT',
    'sonnerie-bell-iceblue': 'HBR-RING-5378-2TIFFANY',
    'sonnerie-bell-blue': 'HBR-RING-5378-BLUE',
    'cyber-cogwheel-skeleton-rosegold': 'HBR-30027-1-AUTO-GEAR-GLD-BLK',
    'cyber-cogwheel-skeleton-twotone': 'HBR-30027-1-AUTO-GEAR-SLV-BLK',
    'cyber-cogwheel-skeleton-steel': 'HBR-30027-1-AUTO-GEAR-blk',
    'world-globe': 'HBR-2712-AUTO-SILVER',
    'architectural-skeleton-black': 'HBR-906-AUTO-BLACK',
    'architectural-skeleton-rosegold': 'HBR-906-AUTO-RGSL',
    'arachnid-geometric-skeleton': 'HBR-918-AUTO-TORQUE-GREEN',
    'cyber-green-skeleton': 'HBR-917-AUTO-AVENGER-SLV',
    'emerald-roulette': 'HBR-1001-2-AUTO-ROULETTE-RG-GREEN',
    'blue-roulette': 'HBR-1001-2-AUTO-ROULETTE-SLV-BLUE',
    'arctic-tonneau': 'HBR-945-3-AUTO-WHITE',
    'sichuan-opera-diamond-tonneau': 'HBR-927-GOLD-BLK',
    'sichuan-opera-diamond-steel': 'HBR-927-SLV-BLK',
    'sapphire-kanagawa-wave': 'HBR-9038-AUTO-BLUE',
    'stealth-fighter-jet-tonneau': 'HBR-933-AUTO-FALCONX-BLK',
    'forged-carbon-tonneau-tourbillon': 'HBR-900-3-AUTO-BLACK',
    'forged-carbon-damascus-10atm': 'HBR-945-3-AUTO-BLACK',
    'arctic-tonneau-10atm-white': 'HBR-945-3-AUTO-WHITE',
    'forged-carbon-ribbed-shield': 'HBR-989-3-BLACK-AUTO',
    'forged-carbon-ribbed-shield-blue': 'HBR-989-3-BLUE-AUTO',
    'forged-carbon-ribbed-shield-green': 'HBR-989-3-GREEN-AUTO',
    'forged-carbon-ribbed-shield-red': 'HBR-989-3-RED-AUTO',
    'forged-carbon-ribbed-shield-white': 'HBR-989-3-WHITE-AUTO',
    'double-balance-cantilever-rosegold': 'HBR-985-AUTO-APEX-RG-BLK',
    'double-balance-cantilever-yellow': 'HBR-985-AUTO-APEX-SLV-YLW',
    'double-balance-cantilever-red': 'HBR-985-AUTO-APEX-slvr',
    'clover-king-crimson': 'HBR-989-3-RED-AUTO',
    'imperial-dragon': 'HBR-1018-AUTO-ZOD-GLD',
    'octagonal-diamond-celestial': 'HBR-824-2-AUTO-BLUE-RG',
    'octagonal-diamond-bronze': 'HBR-824-2-AUTO-BROWN-RG',
    'octagonal-diamond-emerald': 'HBR-824-2-AUTO-GREEN-SILVER',
    'octagonal-blue': 'HBR-824-2-AUTO-BLUE-RG',
    'octagonal-skeleton-steel': 'HBR-972-AUTO-RGLD',
    'orbital-moonphase': 'HBR-8824-AUTO-NAVIGATOR-RG-WYT',
    'aurora-celestial-frost': 'HBR-848-AUTO-NEBULA-BLK',
    'purple-chrono': 'HBR-1309-AUTO-PURPLE',
    'green-diver': 'HBR-1308-AUTO-SAPPHIRE',
    'powerreserve-black': 'HBR-902-AUTO-A200-BLACK',
    'powerreserve-silver': 'HBR-902-AUTO-A200-SILVER',
    'powerreserve-opaline': 'HBR-902-AUTO-A200-BLACK-SILVER',
    'powerreserve-twotone': 'HBR-902-AUTO-A200-SILVER-RG',
    'turquoise-ringbell': 'HBR-RING-5378-2TIFFANY'
}

updated_products = []
used_excel_skus = set()

for prod in site_products:
    p = dict(prod)
    pid = p['id']
    excel_sku = SITE_TO_EXCEL.get(pid)
    e = excel_by_sku.get(excel_sku) if excel_sku else None

    if e:
        used_excel_skus.add(e['sku'])
        p['sku'] = e['sku']
        
        # Clean title: strip quotes/newlines
        clean_title = e['title'].strip().strip('"').strip("'").replace('\n', ' ')
        p['name'] = clean_title
        
        # Prices
        mrp_num = get_numeric_price(e.get('mrp'), 52999)
        p['price'] = format_inr(mrp_num)
        p['mrp'] = p['price']
        p['priceNumeric'] = mrp_num
        p['priceUsd'] = f"${round(mrp_num / 83)}"
        
        # Subtitle / description
        if e.get('minidescription') and len(e['minidescription']) > 15:
            p['subtitle'] = e['minidescription'].strip().replace('\n', ' ')
        elif e.get('description'):
            first_sent = e['description'].split('.')[0] + '.'
            p['subtitle'] = first_sent.strip().replace('\n', ' ')
            
        if e.get('description') and len(e['description']) > 30:
            p['description'] = e['description'].strip()
            p['summary'] = e['description'].strip()
            
        # Specs
        if 'specs' not in p or not isinstance(p['specs'], dict):
            p['specs'] = {}
        s = p['specs']
        
        if e.get('model_number'):
            s['modelNumber'] = str(e['model_number']).replace('.0', '').strip()
        if e.get('movement'):
            s['movement'] = e['movement'].strip()
        if e.get('case_material'):
            s['caseMaterial'] = e['case_material'].strip()
        if e.get('dial_diameter'):
            s['caseDimensions'] = f"{e['dial_diameter'].replace('.0', '').strip()}mm Diameter"
        if e.get('glass'):
            s['glass'] = e['glass'].strip()
        if e.get('water_resistance'):
            wr = str(e['water_resistance']).replace('.0', '').strip()
            try:
                atm = int(int(wr) / 10)
                s['waterResistance'] = f"{wr}M ({atm} ATM)"
            except:
                s['waterResistance'] = f"{wr}M"
        if e.get('strap_type'):
            st = e['strap_type'].strip()
            sc = e.get('strap_color', '').strip()
            s['strap'] = f"{st} ({sc})" if sc else st
        if e.get('clasp_type'):
            s['clasp'] = e['clasp_type'].strip()
        s['warranty'] = f"{e.get('warranty_months', '24')} Months Official Manufacturer Warranty"
        
        # Compliance
        p['compliance'] = {
            "countryOfOrigin": e.get('country_origin') or "People's Republic of China",
            "manufacturer": e.get('manufacturer') or "Guangzhou Hengbaoluo Technology Co., Ltd.",
            "importer": "Rise N Be Original Lifestyle Pvt Ltd, Building No. 3, 4th Floor, Block M, DLF City Phase II, Road Number 5, Sector 25, Gurugram, Haryana 122008, India",
            "packer": "Rise N Be Original Lifestyle Pvt Ltd, Building No. 3, 4th Floor, Block M, DLF City Phase II, Road Number 5, Sector 25, Gurugram, Haryana 122008, India",
            "warrantyDetails": e.get('warranty_details', '24 Months Official Manufacturer Warranty'),
            "careInstructions": e.get('care_instructions', 'Handle with care: avoid extreme heat, shocks, and strong magnetic fields.')
        }

    updated_products.append(p)

print(f"Updated {len(updated_products)} site products.")
print(f"Used {len(used_excel_skus)} Excel SKUs directly.")

# Now add any unused Excel SKUs as new complementary official models
unused_skus = [sku for sku in excel_by_sku if sku not in used_excel_skus]
print(f"Adding {len(unused_skus)} remaining official models from spreadsheet...")

# Template for creating new watch entry
FAMILY_TEMPLATES = {
    'HBR-AERO': {
        'collection': 'TONNEAU',
        'collectionName': 'Tonneau Skeleton',
        'image': '/watch-arctic-tonneau-white.webp',
        'tag': 'AeroTwin Dual Movement'
    },
    'HBR-ZODIAC': {
        'collection': 'CLASSIC',
        'collectionName': 'Classic & Moonphase',
        'image': '/watch-astroworld-moon-rosegold-front-transparent.webp',
        'tag': 'Celestia Astryx Zodiac'
    },
    'HBR-WC': {
        'collection': 'DIVER_SPORT',
        'collectionName': 'Diver & Sport Chrono',
        'image': '/watch-diamond-octagonal-front-transparent.webp',
        'tag': 'Nations Cup Limited Series'
    },
    'HBR-8851': {
        'collection': 'CLASSIC',
        'collectionName': 'Classic & Moonphase',
        'image': '/watch-carousel-octagonal.webp',
        'tag': 'Four Leaf Clover Series'
    },
    'HBR-2003': {
        'collection': 'OCTAGONAL',
        'collectionName': 'Royal Octagonal',
        'image': '/watch-diamond-octagonal-green-front-transparent.webp',
        'tag': 'Queen Bee Mechanica'
    },
    'HBR-8821': {
        'collection': 'TOURBILLON',
        'collectionName': 'Tourbillon & Complications',
        'image': '/watch-astroworld-tourbillon-dlc-front-transparent.webp',
        'tag': 'AstroSphere DualCore'
    },
    'HBR-9038': {
        'collection': 'CLASSIC',
        'collectionName': 'Classic & Moonphase',
        'image': '/watch-sapphire-kanagawa-wave-front-transparent.webp',
        'tag': 'Nautilus Spirit Great Wave'
    },
    'HBR-995': {
        'collection': 'TOURBILLON',
        'collectionName': 'Tourbillon & Complications',
        'image': '/watch-supercar-engine-block-rosegold-front-transparent.webp',
        'tag': 'REV-X Ignition Tourbillon'
    }
}

for sku in unused_skus:
    e = excel_by_sku[sku]
    clean_id = sku.lower().replace('.', '-').replace('_', '-')
    clean_title = e['title'].strip().strip('"').strip("'").replace('\n', ' ')
    
    # Pick matching family template
    tmpl = None
    for prefix, t in FAMILY_TEMPLATES.items():
        if sku.startswith(prefix):
            tmpl = t
            break
    if not tmpl:
        tmpl = {
            'collection': 'CLASSIC',
            'collectionName': 'Classic & Moonphase',
            'image': '/watch-astroworld-moon-rosegold-front-transparent.webp',
            'tag': 'Official Collection'
        }
        
    mrp_num = get_numeric_price(e.get('mrp'), 44999)
    price_str = format_inr(mrp_num)
    
    new_watch = {
        "id": clean_id,
        "sku": e['sku'],
        "name": clean_title,
        "subtitle": e.get('minidescription') or clean_title,
        "collection": tmpl['collection'],
        "collectionName": tmpl['collectionName'],
        "tag": tmpl['tag'],
        "image": tmpl['image'],
        "transparentImage": tmpl['image'],
        "altImages": [tmpl['image']],
        "gallery": [
            {
                "url": tmpl['image'],
                "title": clean_title,
                "label": "Front View",
                "caption": e.get('description', clean_title)[:200]
            }
        ],
        "price": price_str,
        "mrp": price_str,
        "priceNumeric": mrp_num,
        "priceUsd": f"${round(mrp_num / 83)}",
        "stock": 10,
        "availability": "Ready for Dispatch",
        "year": 2026,
        "summary": e.get('description', clean_title),
        "description": e.get('description', clean_title),
        "specs": {
            "modelNumber": str(e.get('model_number', '')).replace('.0', '').strip(),
            "movement": e.get('movement', 'Japan Automatic Movement'),
            "frequency": "28,800 BPH (4 Hz)",
            "powerReserve": "~42 Hours",
            "jewels": "24 Synthetic Rubies",
            "caseMaterial": e.get('case_material', '316L Stainless Steel'),
            "caseDimensions": f"{e.get('dial_diameter', '42').replace('.0', '').strip()}mm Diameter",
            "glass": e.get('glass', 'Sapphire Crystal Glass'),
            "waterResistance": f"{e.get('water_resistance', '50').replace('.0', '').strip()}M",
            "strap": f"{e.get('strap_type', 'Stainless Steel')} ({e.get('strap_color', 'Black')})",
            "clasp": e.get('clasp_type', 'Double-Push Butterfly Clasp'),
            "warranty": f"{e.get('warranty_months', '24')} Months Official Manufacturer Warranty"
        },
        "compliance": {
            "countryOfOrigin": e.get('country_origin') or "People's Republic of China",
            "manufacturer": e.get('manufacturer') or "Guangzhou Hengbaoluo Technology Co., Ltd.",
            "importer": "Rise N Be Original Lifestyle Pvt Ltd, Building No. 3, 4th Floor, Block M, DLF City Phase II, Road Number 5, Sector 25, Gurugram, Haryana 122008, India",
            "packer": "Rise N Be Original Lifestyle Pvt Ltd, Building No. 3, 4th Floor, Block M, DLF City Phase II, Road Number 5, Sector 25, Gurugram, Haryana 122008, India",
            "warrantyDetails": e.get('warranty_details', '24 Months Official Manufacturer Warranty'),
            "careInstructions": e.get('care_instructions', 'Handle with care.')
        }
    }
    updated_products.append(new_watch)

print(f"Final catalog contains {len(updated_products)} total watches covering all {len(excel_by_sku)} spreadsheet items.")

# 3. Read top of productsData.js (CATEGORIES)
with open('src/productsData.js', 'r', encoding='utf-8') as f:
    orig_code = f.read()

categories_idx = orig_code.find('export const CATEGORIES = [')
categories_end = orig_code.find('export const PRODUCTS_DATA = [')
categories_part = orig_code[categories_idx:categories_end].strip()

# Format updated PRODUCTS_DATA as JS code
products_json = json.dumps(updated_products, indent=2, ensure_ascii=False)

new_code = f'''// ══════════════════════════════════════════════════════════════════════════════
// HANBORO OFFICIAL MASTER PRODUCTS & SKU CATALOG
// Synchronized from Official Listing Dossier (LISTING FILE AI1 .xlsx)
// Retaining High-Resolution Site Photography per Design Directive
// ══════════════════════════════════════════════════════════════════════════════

{categories_part}

export const PRODUCTS_DATA = {products_json};

// Quick Helper: Find Product by ID or SKU
export function getProductByIdOrSku(identifier) {{
  if (!identifier) return null;
  const clean = identifier.toLowerCase().trim();
  return (
    PRODUCTS_DATA.find((p) => p.id.toLowerCase() === clean || p.sku.toLowerCase() === clean) ||
    null
  );
}}
'''

with open('src/productsData.js', 'w', encoding='utf-8') as f:
    f.write(new_code)

print("Successfully wrote updated src/productsData.js!")
