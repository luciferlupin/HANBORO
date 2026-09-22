import os
import shutil
import sys
from concurrent.futures import ThreadPoolExecutor
from PIL import Image

def main():
    if len(sys.argv) < 2:
        print("Usage: optimize-theme-assets.py <theme_assets_dir>")
        sys.exit(1)
    
    theme_assets = sys.argv[1]
    os.makedirs(theme_assets, exist_ok=True)
    
    src_dirs = ['dist/client', 'public']
    processed = set()
    items = []
    
    for s_dir in src_dirs:
        if not os.path.exists(s_dir):
            continue
        for root, _, files in os.walk(s_dir):
            for f in files:
                if f.startswith('.') or f.endswith('.csv') or f.endswith('.html') or f.endswith('.map') or f in processed:
                    continue
                src_p = os.path.join(root, f)
                dest_p = os.path.join(theme_assets, f)
                processed.add(f)
                items.append((src_p, dest_p))
    
    def process_item(item):
        src_p, dest_p = item
        try:
            ext = os.path.splitext(src_p)[1].lower()
            if ext in ('.png', '.jpg', '.jpeg', '.webp'):
                im = Image.open(src_p)
                max_dim = 750
                if max(im.size) > max_dim:
                    scale = max_dim / max(im.size)
                    new_size = (int(im.size[0] * scale), int(im.size[1] * scale))
                    im = im.resize(new_size, Image.Resampling.LANCZOS)
                
                if ext == '.webp':
                    im.save(dest_p, 'WEBP', quality=72, method=3)
                elif ext in ('.jpg', '.jpeg'):
                    if im.mode in ('RGBA', 'P'):
                        im = im.convert('RGB')
                    im.save(dest_p, 'JPEG', quality=72, optimize=True)
                elif ext == '.png':
                    if im.mode == 'P':
                        im = im.convert('RGBA')
                    if im.mode == 'RGBA':
                        alpha = im.split()[-1]
                        if alpha.getextrema() == (255, 255):
                            im = im.convert('RGB')
                            im.save(dest_p, 'JPEG', quality=72, optimize=True)
                        else:
                            im = im.quantize(colors=256, method=Image.Resampling.LANCZOS)
                            im.save(dest_p, 'PNG', optimize=True)
                    else:
                        im.save(dest_p, 'JPEG', quality=72, optimize=True)
            else:
                if not os.path.exists(dest_p):
                    shutil.copyfile(src_p, dest_p)
        except Exception as e:
            if not os.path.exists(dest_p):
                shutil.copyfile(src_p, dest_p)
    
    with ThreadPoolExecutor(max_workers=8) as ex:
        list(ex.map(process_item, items))
    
    print(f"Processed and optimized {len(items)} theme assets.")

if __name__ == "__main__":
    main()
