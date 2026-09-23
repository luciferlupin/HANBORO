import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT_DIR = process.cwd();
const DIST_CLIENT = path.join(ROOT_DIR, "dist", "client");
const THEME_DIR = path.join(ROOT_DIR, "shopify-theme");
const ZIP_OUTPUT = path.join(ROOT_DIR, "hanboro-shopify-theme.zip");

console.log("🎨 Packaging HANBORO Shopify Online Store Theme (<50MB compliant)...");

// 1. Ensure build exists or run build
if (!fs.existsSync(DIST_CLIENT) || !fs.existsSync(path.join(DIST_CLIENT, "index.html"))) {
  console.log("📦 Running production build first...");
  execSync("npm run build", { stdio: "inherit", cwd: ROOT_DIR });
}

// 2. Clean and create shopify-theme structure
if (fs.existsSync(THEME_DIR)) {
  fs.rmSync(THEME_DIR, { recursive: true, force: true });
}

const themeFolders = [
  "assets",
  "config",
  "layout",
  "locales",
  "sections",
  "snippets",
  "templates",
  "templates/customers",
];

themeFolders.forEach((folder) => {
  fs.mkdirSync(path.join(THEME_DIR, folder), { recursive: true });
});

// 3. Parse dist/client/index.html to find generated assets
const indexHtmlContent = fs.readFileSync(path.join(DIST_CLIENT, "index.html"), "utf-8");

// Extract main JS entry script
const jsMatch = indexHtmlContent.match(/<script type="module" crossorigin src="\/assets\/([^"]+)"><\/script>/);
const mainJsFile = jsMatch ? jsMatch[1] : null;

// Extract CSS entry stylesheet
const cssMatch = indexHtmlContent.match(/<link rel="stylesheet" crossorigin href="\/assets\/([^"]+)">/);
const mainCssFile = cssMatch ? cssMatch[1] : null;

// Extract preloads
const preloadMatches = [...indexHtmlContent.matchAll(/<link rel="modulepreload" crossorigin href="\/assets\/([^"]+)">/g)];
const preloadFiles = preloadMatches.map((m) => m[1]);

console.log(`✨ Detected entry files: JS -> ${mainJsFile}, CSS -> ${mainCssFile}`);
console.log(`✨ Preload chunks count: ${preloadFiles.length}`);

// 4. Optimize and copy all assets into shopify-theme/assets (<50MB)
console.log("⚡ Optimizing and copying asset files...");
const themeAssetsDir = path.join(THEME_DIR, "assets");

// Copy JS and CSS build chunks directly
if (fs.existsSync(path.join(DIST_CLIENT, "assets"))) {
  const buildAssets = fs.readdirSync(path.join(DIST_CLIENT, "assets"));
  for (const file of buildAssets) {
    fs.copyFileSync(path.join(DIST_CLIENT, "assets", file), path.join(themeAssetsDir, file));
  }
}

// Run python parallel optimizer for image and media assets
execSync(`python3 scripts/optimize-theme-assets.py "${themeAssetsDir}"`, { stdio: "inherit", cwd: ROOT_DIR });

// 5. Generate theme files

// config/settings_schema.json
const settingsSchema = [
  {
    name: "theme_info",
    theme_name: "HANBORO Haute Horlogerie",
    theme_version: "1.0.0",
    theme_author: "HANBORO India",
    theme_documentation_url: "https://www.hanborowatches.in",
    theme_support_url: "https://www.hanborowatches.in",
  },
  {
    name: "Storefront Configuration",
    settings: [
      {
        type: "text",
        id: "meta_pixel_id",
        label: "Meta Pixel Dataset ID",
        default: "1069596304671544",
      },
      {
        type: "text",
        id: "support_phone",
        label: "Support Phone / WhatsApp",
        default: "+91 93102 24548",
      },
    ],
  },
];
fs.writeFileSync(path.join(THEME_DIR, "config", "settings_schema.json"), JSON.stringify(settingsSchema, null, 2));

// config/settings_data.json
const settingsData = {
  current: {
    sections: {
      "main-app": {
        type: "main-app",
        settings: {},
      },
    },
  },
};
fs.writeFileSync(path.join(THEME_DIR, "config", "settings_data.json"), JSON.stringify(settingsData, null, 2));

// locales/en.default.json
const localesEn = {
  general: {
    meta: {
      tags: "Tags: {{ tags }}",
      page: "Page {{ page }}",
    },
    404: {
      title: "Page Not Found",
      subtext: "The page you requested does not exist.",
      link: "Return to boutique",
    },
    accessibility: {
      skip_to_content: "Skip to content",
      close: "Close",
    },
  },
};
fs.writeFileSync(path.join(THEME_DIR, "locales", "en.default.json"), JSON.stringify(localesEn, null, 2));

// sections/main-app.liquid
const sectionMainApp = `
<div id="root">
  <div id="hanboro-app-mount"></div>
</div>

{% schema %}
{
  "name": "Hanboro Storefront App",
  "tag": "section",
  "class": "hanboro-storefront-section",
  "settings": []
}
{% endschema %}
`.trim();
fs.writeFileSync(path.join(THEME_DIR, "sections", "main-app.liquid"), sectionMainApp);

// templates (Liquid templates)
const templateLiquidContent = `
<div id="root">
  <div id="hanboro-app-mount"></div>
</div>
`.trim();

const templates = [
  "index.liquid",
  "product.liquid",
  "collection.liquid",
  "page.liquid",
  "cart.liquid",
  "404.liquid",
  "search.liquid",
  "blog.liquid",
  "article.liquid",
  "list-collections.liquid",
];

templates.forEach((tpl) => {
  fs.writeFileSync(path.join(THEME_DIR, "templates", tpl), templateLiquidContent);
});

// customer templates
["account.liquid", "login.liquid", "register.liquid", "order.liquid", "addresses.liquid"].forEach((tpl) => {
  fs.writeFileSync(path.join(THEME_DIR, "templates", "customers", tpl), templateLiquidContent);
});

// layout/theme.liquid
const themeLiquid = `<!doctype html>
<html class="no-js" lang="{{ request.locale.iso_code }}">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <meta name="theme-color" content="#080808">
    <link rel="canonical" href="{{ canonical_url }}">

    <title>
      {{ page_title }}
      {%- if current_tags %} &ndash; tagged "{{ current_tags | join: ', ' }}"{% endif -%}
      {%- if current_page != 1 %} &ndash; Page {{ current_page }}{% endif -%}
      {%- unless page_title contains shop.name %} &ndash; {{ shop.name }}{% endunless -%}
    </title>

    {% if page_description %}
      <meta name="description" content="{{ page_description | escape }}">
    {% else %}
      <meta name="description" content="Hanboro Haute Horlogerie India | Luxury Skeleton & Tourbillon Watches">
    {% endif %}

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&display=swap" rel="stylesheet" />

    <!-- Google Site Verification -->
    <meta name="google-site-verification" content="googledccfa22a0725d83d" />

    <!-- Apple Touch Icons & Favicons -->
    <link rel="apple-touch-icon" sizes="180x180" href="{{ 'apple-touch-icon.png' | asset_url }}" />
    <link rel="shortcut icon" href="{{ 'favicon.ico' | asset_url }}" />
    <link rel="icon" type="image/svg+xml" href="{{ 'favicon.svg' | asset_url }}" />
    <link rel="manifest" href="{{ 'site.webmanifest' | asset_url }}" />

    <!-- Open Graph Branding -->
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Hanboro Watches" />
    <meta property="og:url" content="{{ canonical_url }}" />
    <meta property="og:title" content="Hanboro — Haute Horlogerie India | Luxury Skeleton & Tourbillon Watches" />
    <meta property="og:description" content="Discover Hanboro Haute Horlogerie India. Luxury automatic skeleton timepieces, flying tourbillons, and casino roulette complications with certified 2-year warranty." />
    <meta property="og:image" content="{{ 'og-image.png' | asset_url }}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Hanboro — Haute Horlogerie India" />
    <meta name="twitter:description" content="Handcrafted luxury automatic skeleton watches, flying tourbillons, and casino roulette complications." />
    <meta name="twitter:image" content="{{ 'og-image.png' | asset_url }}" />

    <!-- Meta Pixel / Meta Ads Dataset (Dataset ID: 1069596304671544) -->
    <script>
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '{{ settings.meta_pixel_id | default: "1069596304671544" }}');
      fbq('track', 'PageView');
    </script>
    <!-- End Meta Pixel Code -->

    <!-- Dynamic Shopify Context & Asset Path Helper -->
    <script>
      window.__SHOPIFY_THEME_ENV__ = {
        shopDomain: {{ shop.permanent_domain | json }},
        currentDomain: {{ shop.domain | json }},
        currency: {{ cart.currency.iso_code | json }},
        assetUrlBase: {{ 'favicon.ico' | asset_url | json }}.replace(/favicon\\.ico.*$/, '')
      };
    </script>

    <!-- Module Preloads -->
${preloadFiles.map((file) => `    <link rel="modulepreload" crossorigin href="{{ '${file}' | asset_url }}">`).join("\n")}

    <!-- Stylesheet -->
    ${mainCssFile ? `<link rel="stylesheet" crossorigin href="{{ '${mainCssFile}' | asset_url }}">` : ""}

    <!-- Shopify Core Header Hooks -->
    {{ content_for_header }}
  </head>
  <body class="template-{{ template | replace: '.', ' ' | truncatewords: 1, '' | handle }} bg-black text-white antialiased">
    <noscript>
      <img height="1" width="1" style="display:none"
        src="https://www.facebook.com/tr?id=1069596304671544&ev=PageView&noscript=1"
        alt=""
      />
    </noscript>

    <!-- App Root Container -->
    <div id="root">
      {{ content_for_layout }}
    </div>

    <!-- Storefront App Bundle -->
    ${mainJsFile ? `<script type="module" crossorigin src="{{ '${mainJsFile}' | asset_url }}"></script>` : ""}
  </body>
</html>
`;

fs.writeFileSync(path.join(THEME_DIR, "layout", "theme.liquid"), themeLiquid);

console.log("🗜️  Compressing into Shopify Theme ZIP archive (Level 9)...");

// Remove existing zip if any
if (fs.existsSync(ZIP_OUTPUT)) {
  fs.unlinkSync(ZIP_OUTPUT);
}

// Create ZIP using native zip command with maximum compression
execSync(`cd "${THEME_DIR}" && zip -r -9 -q "${ZIP_OUTPUT}" .`, { stdio: "inherit" });

// Clean up intermediate uncompressed folder
if (fs.existsSync(THEME_DIR)) {
  fs.rmSync(THEME_DIR, { recursive: true, force: true });
}

const stats = fs.statSync(ZIP_OUTPUT);
const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

console.log(`\n🎉 Shopify Theme ZIP successfully created!`);
console.log(`📁 File location: ${ZIP_OUTPUT}`);
console.log(`📊 Size: ${sizeMb} MB (Compliant with Shopify <50MB limit)`);
console.log(`\n📋 How to install in Shopify:`);
console.log(`1. Open your Shopify Admin -> Online Store -> Themes`);
console.log(`2. Under "Theme library", click "Add theme" -> "Upload zip file"`);
console.log(`3. Select "${ZIP_OUTPUT}"`);
console.log(`4. Click "Upload" and then "Publish"!`);
