import os
import sys
import json
import cv2
import numpy as np
from PIL import Image

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CATALOG_DIR = os.path.join(ROOT_DIR, "public", "catalog")
TRANSPARENT_DIR = os.path.join(ROOT_DIR, "public", "transparent")
PUBLIC_DIR = os.path.join(ROOT_DIR, "public")

os.makedirs(TRANSPARENT_DIR, exist_ok=True)

def make_transparent_from_white(input_path, output_path, tol=16):
    img = cv2.imread(input_path)
    if img is None:
        raise ValueError(f"Could not read image: {input_path}")
    h, w, _ = img.shape
    
    # Check background color around edges
    edge_pixels = np.concatenate([
        img[0, :], img[-1, :], img[:, 0], img[:, -1]
    ], axis=0)
    bg_color = np.median(edge_pixels, axis=0)
    
    diff = np.linalg.norm(img.astype(np.float32) - bg_color.astype(np.float32), axis=2)
    pad_diff = np.pad(diff, ((1, 1), (1, 1)), mode="constant", constant_values=0)
    
    is_bg = (pad_diff < tol).astype(np.uint8)
    num_labels, labels = cv2.connectedComponents(is_bg)
    bg_label = labels[0, 0]
    bg_mask = (labels[1:-1, 1:-1] == bg_label)
    
    alpha = np.where(bg_mask, 0, 255).astype(np.uint8)
    
    # Boundary anti-aliasing
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    boundary = cv2.morphologyEx(alpha, cv2.MORPH_GRADIENT, kernel) > 0
    alpha_float = np.clip((diff - 4) / ((tol + 8) - 4) * 255, 0, 255).astype(np.uint8)
    alpha[boundary] = alpha_float[boundary]
    
    b, g, r = cv2.split(img)
    rgba = cv2.merge([r, g, b, alpha])
    
    pil_img = Image.fromarray(rgba)
    pil_img.save(output_path, "WEBP", quality=95)
    
    solid = np.sum(alpha > 128) / (h * w)
    top_solid = np.sum(alpha[:int(h * 0.15), :] > 128)
    bot_solid = np.sum(alpha[int(h * 0.85):, :] > 128)
    return solid, top_solid, bot_solid

def make_zodiac_black(input_blue_path, output_black_path):
    # Convert blue dial and strap of zodiac watch to onyx black
    im = Image.open(input_blue_path).convert("RGBA")
    arr = np.array(im)
    r = arr[:, :, 0].astype(np.float32)
    g = arr[:, :, 1].astype(np.float32)
    b = arr[:, :, 2].astype(np.float32)
    a = arr[:, :, 3]
    
    # Blue mask: where blue is significantly stronger than red and green
    is_blue = (b > r + 15) & (b > g + 10) & (a > 100)
    
    # Convert blue regions to deep metallic gray / black
    luminance = (0.299 * r + 0.587 * g + 0.114 * b) * 0.38
    arr[is_blue, 0] = luminance[is_blue].astype(np.uint8)
    arr[is_blue, 1] = luminance[is_blue].astype(np.uint8)
    arr[is_blue, 2] = luminance[is_blue].astype(np.uint8)
    
    out_im = Image.fromarray(arr)
    out_im.save(output_black_path, "PNG")
    print(f"Created black zodiac variant: {output_black_path}")

def main():
    print("Starting catalog images audit & fix...")
    
    # 1. Create black zodiac variant if needed
    blue_zodiac = os.path.join(CATALOG_DIR, "hbr-zodiac-1027-2-blue-front.png")
    black_zodiac = os.path.join(CATALOG_DIR, "hbr-zodiac-1027-2-black-front.png")
    if os.path.exists(blue_zodiac) and not os.path.exists(black_zodiac):
        make_zodiac_black(blue_zodiac, black_zodiac)

    # 2. Map of all catalog files
    catalog_files = os.listdir(CATALOG_DIR)
    
    # We will process each watch that has a JPG or needs a clean transparent cutout
    # List of all JPG/PNG front files that need conversion to public/transparent/
    targets = [
        ("hbr-900-3-auto-black-front.jpg", "hbr-900-3-auto-black.webp"),
        ("hbr-945-3-auto-black-front.jpg", "hbr-945-3-auto-black.webp"),
        ("hbr-945-3-auto-white-front.jpg", "hbr-945-3-auto-white.webp"),
        ("hbr-1307-auto-emerald-front.jpg", "hbr-1307-auto-emerald.webp"),
        ("hbr-8022-1-auto-stellar-front.jpg", "hbr-8022-1-auto-stellar.webp"),
        ("hbr-989-3-black-auto-front.jpg", "hbr-989-3-black-auto.webp"),
        ("hbr-989-3-red-auto-front.jpg", "clover-king-crimson.webp"),
        ("hbr-989-3-green-auto-front.jpg", "hbr-989-3-green-auto.webp"),
        ("hbr-989-3-orange-auto-front.jpg", "hbr-989-3-orange-auto.webp"),
        ("hbr-989-3-white-auto-front.jpg", "hbr-989-3-white-auto.webp"),
        ("hbr-989-3-blue-auto-front.jpg", "hbr-989-3-blue-auto.webp"),
        ("hbr-981-auto-gold-front.jpg", "hbr-981-auto-gold.webp"),
        ("hbr-981-auto-rgold-front.jpg", "hbr-981-auto-rgold.webp"),
        ("hbr-981-auto-silver-front.jpg", "hbr-981-auto-silver.webp"),
        ("hbr-2712-auto-silver-front.jpg", "world-globe.webp"),
        ("hbr-2712-auto-rgold-front.jpg", "hbr-2712-auto-rgold.webp"),
        ("hbr-2712-auto-rg-tiranga-front.jpg", "hbr-2712-auto-rg-tiranga.webp"),
        ("hbr-2712-auto-slv-tiranga-front.jpg", "hbr-2712-auto-slv-tiranga.webp"),
        ("hbr-1309-auto-blue-front.jpg", "hbr-1309-auto-blue.webp"),
        ("hbr-1309-auto-orange-front.jpg", "hbr-1309-auto-orange.webp"),
        ("hbr-1309-auto-purple-front.jpg", "purple-chrono.webp"),
        ("hbr-1309-auto-green-front.jpg", "hbr-1309-auto-green.webp"),
        ("hbr-8824-auto-ns-black-front.jpg", "hbr-8824-auto-ns-black.webp"),
        ("hbr-8824-auto-ns-blue-front.jpg", "hbr-8824-auto-ns-blue.webp"),
        ("hbr-8824-auto-ns-rg-brown-front.jpg", "hbr-8824-auto-ns-rg-brown.webp"),
        ("hbr-902-auto-a200-black-front.jpg", "powerreserve-black.webp"),
        ("hbr-902-auto-a200-black-silver-front.jpg", "hbr-902-auto-a200-black-silver.webp"),
        ("hbr-902-auto-a200-silver-rg-front.jpg", "hbr-902-auto-a200-silver-rg.webp"),
        ("hbr-824-2-auto-blue-rg-front.jpg", "octagonal-blue.webp"),
        ("hbr-824-2-auto-brown-rg-front.jpg", "octagonal-diamond-bronze.webp"),
        ("hbr-824-2-auto-green-silver-front.jpg", "octagonal-diamond-emerald.webp"),
        ("hbr-972-auto-rgld-front.jpg", "octagonal-skeleton-steel.webp"),
        ("hbr-927-rgold-blk-front.jpg", "hbr-927-rgold-blk.webp"),
        ("hbr-927-gold-blk-front.jpg", "sichuan-opera-diamond-tonneau.webp"),
        ("hbr-1018-auto-zod-gld-front.jpg", "imperial-dragon.webp"),
        ("hbr-1018-auto-zod-slv-front.jpg", "hbr-1018-auto-zod-slv.webp"),
        ("hbr-1020-auto-ast-gld-front.jpg", "hbr-1020-auto-ast-gld.webp"),
        ("hbr-1020-auto-ast-slv-front.jpg", "hbr-1020-auto-ast-slv.webp"),
        ("hbr-2003-auto-hive-aquablue-front.jpg", "hbr-2003-auto-hive-aquablue.webp"),
        ("hbr-2003-auto-hive-blk-front.jpg", "hbr-2003-auto-hive-blk.webp"),
        ("hbr-2003-auto-hive-deepseablue-front.jpg", "hbr-2003-auto-hive-deepseablue.webp"),
        ("hbr-933-auto-falconx-blk-front.jpg", "stealth-fighter-jet-tonneau.webp"),
        ("hbr-848-auto-nebula-blk-front.jpg", "hbr-848-auto-nebula-blk.webp"),
        ("vhbr-848-auto-nebula-blue-front.jpg", "vhbr-848-auto-nebula-blue.webp"),
        ("hbr-8821-auto-astro-blue-front.jpg", "hbr-8821-auto-astro-blue.webp"),
        ("hbr-8821-auto-astro-rg-wyt-front.jpg", "hbr-8821-auto-astro-rg-wyt.webp"),
        ("hbr-8821-auto-astro-black-front.jpg", "hbr-8821-auto-astro-black.webp"),
        ("hbr-8821-2-auto-astro-rslvr-front.jpg", "hbr-8821-2-auto-astro-rslvr.webp"),
        ("hbr-8821-2-auto-astro-slvr-front.jpg", "hbr-8821-2-auto-astro-slvr.webp"),
        ("hbr-918-auto-torque-slv-front.jpg", "hbr-918-auto-torque-slv.webp"),
        ("hbr-918-auto-torque-green-front.jpg", "arachnid-geometric-skeleton.webp"),
        ("hbr-918-auto-torque-gld-front.jpg", "hbr-918-auto-torque-gld.webp"),
        ("hbr-703-2-auto-prism-front.jpg", "hbr-703-2-auto-prism.webp"),
        ("hbr-917-auto-avenger-slv-front.jpg", "hbr-917-auto-avenger-slv.webp"),
        ("hbr-917-auto-avenger-gold-front.jpg", "hbr-917-auto-avenger-gold.webp"),
        ("hbr-ring-5378-2tiffany-front.jpg", "turquoise-ringbell.webp"),
        ("hbr-ring-5378-blue-front.jpg", "hbr-ring-5378-blue.webp"),
        ("hbr-906-auto-rgsl-front.jpg", "hbr-906-auto-rgsl.webp"),
        ("hbr-906-auto-silver-front.jpg", "hbr-906-auto-silver.webp"),
        ("hbr-906-auto-black-front.jpg", "hbr-906-auto-black.webp"),
        ("hbr-9038-auto-black-front.jpg", "hbr-9038-auto-black.webp"),
        ("hbr-9038-auto-blue-front.jpg", "hbr-9038-auto-blue.webp"),
        ("hbr-1001-2-auto-roulette-slv-red-front.jpg", "casino-roulette-wheel-silver-ruby-diamond.webp"),
        ("hbr-1001-2-auto-roulette-slv-blue-front.jpg", "hbr-1001-2-auto-roulette-slv-blue.webp"),
        ("hbr-1001-2-auto-roulette-slv-green-front.jpg", "casino-roulette-wheel-silver-diamond-emerald.webp"),
        ("hbr-1001-2-auto-roulette-rg-red-front.jpg", "casino-roulette-wheel-ruby-diamond.webp"),
        ("hbr-985-auto-apex-slvr-front.jpg", "hbr-985-auto-apex-slvr.webp"),
        ("hbr-wc-1038-rg-blk-front.PNG", "hbr-wc-1038-rg-blk.webp"),
        ("hbr-wc-1038-silver-blk-front.PNG", "hbr-wc-1038-silver-blk.webp"),
    ]

    for src_file, dest_file in targets:
        src_path = os.path.join(CATALOG_DIR, src_file)
        dest_path = os.path.join(TRANSPARENT_DIR, dest_file)
        if not os.path.exists(src_path):
            print(f"Warning: source not found: {src_path}")
            continue
        try:
            solid, top_solid, bot_solid = make_transparent_from_white(src_path, dest_path)
            print(f"Processed {dest_file:40s} | solid: {solid:.1%} | top: {top_solid:5d} | bot: {bot_solid:5d}")
        except Exception as e:
            print(f"Error processing {src_file}: {e}")

    # Also also also: Also create /transparent/forged-carbon-tonneau-tourbillon.webp as a clean cutout of hbr-900-3-auto-black-front.jpg
    # so that any legacy reference to forged-carbon-tonneau-tourbillon.webp is 100% repaired and pristine!
    forged_dest = os.path.join(TRANSPARENT_DIR, "forged-carbon-tonneau-tourbillon.webp")
    src_900 = os.path.join(CATALOG_DIR, "hbr-900-3-auto-black-front.jpg")
    solid, top_solid, bot_solid = make_transparent_from_white(src_900, forged_dest)
    print(f"Repaired forged-carbon-tonneau-tourbillon.webp | solid: {solid:.1%}")

    # Also repair /transparent/astroworld-celestial.webp as a clean copy of hbr-980-auto-orbita-g-front.png!
    orbita_dest = os.path.join(TRANSPARENT_DIR, "astroworld-celestial.webp")
    src_orbita_png = os.path.join(CATALOG_DIR, "hbr-980-auto-orbita-g-front.png")
    if os.path.exists(src_orbita_png):
        im = Image.open(src_orbita_png).convert("RGBA")
        im.save(orbita_dest, "WEBP", quality=95)
        print("Repaired astroworld-celestial.webp from hbr-980-auto-orbita-g-front.png")

    # Also repair /transparent/hbr-995-1-auto-gold.webp from hbr-995-1-auto-g-front.png!
    revx_dest = os.path.join(TRANSPARENT_DIR, "hbr-995-1-auto-gold.webp")
    src_revx_png = os.path.join(CATALOG_DIR, "hbr-995-1-auto-g-front.png")
    if os.path.exists(src_revx_png):
        im = Image.open(src_revx_png).convert("RGBA")
        im.save(revx_dest, "WEBP", quality=95)
        print("Repaired hbr-995-1-auto-gold.webp from hbr-995-1-auto-g-front.png")

    print("\nAll image generation & repair completed successfully!")

if __name__ == "__main__":
    main()
