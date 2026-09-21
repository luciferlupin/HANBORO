import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

async function run() {
  const { PRODUCTS_DATA } = await import("../src/productsData.js");

  const headers = [
    "Handle",
    "Title",
    "Body (HTML)",
    "Vendor",
    "Product Category",
    "Type",
    "Tags",
    "Published",
    "Option1 Name",
    "Option1 Value",
    "Variant SKU",
    "Variant Grams",
    "Variant Inventory Tracker",
    "Variant Inventory Qty",
    "Variant Inventory Policy",
    "Variant Fulfillment Service",
    "Variant Price",
    "Variant Compare At Price",
    "Variant Requires Shipping",
    "Variant Taxable",
    "Variant Barcode",
    "Image Src",
    "Image Position",
    "Status"
  ];

  const rows = [headers];

  for (const watch of PRODUCTS_DATA) {
    const handle = String(watch.sku || watch.id || "watch")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    
    const title = watch.name || `HANBORO Watch ${watch.sku}`;
    const desc = watch.description || `Luxury Swiss precision automatic timepiece. Reference ${watch.sku}.`;
    const bodyHtml = `<p>${desc}</p><p><strong>Movement:</strong> ${watch.specs?.movement || "Automatic"}</p><p><strong>Water Resistance:</strong> ${watch.specs?.waterResistance || "5 ATM"}</p>`;
    const vendor = "HANBORO";
    const category = "Apparel & Accessories > Jewelry > Watches";
    const type = "Watches";
    const tags = [
      watch.category || "LUXURY",
      "Automatic",
      watch.specs?.movement?.includes("Tourbillon") ? "Tourbillon" : "Skeleton",
      watch.sku
    ].filter(Boolean).join(", ");
    
    const priceNum = Number.parseInt(String(watch.price || 0).replace(/[^\d]/g, ""), 10) || 18500;
    const mrpNum = Number.parseInt(String(watch.mrp || 0).replace(/[^\d]/g, ""), 10) || Math.round(priceNum * 1.5);
    
    const imagePath = watch.image?.startsWith("http")
      ? watch.image
      : `https://hanborowatches.in${watch.image || ""}`;

    rows.push([
      handle,
      title,
      `"${bodyHtml.replace(/"/g, '""')}"`,
      vendor,
      category,
      type,
      `"${tags}"`,
      "TRUE",
      "Title",
      "Default Title",
      watch.sku || "",
      "250",
      "shopify",
      "10",
      "continue",
      "manual",
      priceNum.toString(),
      mrpNum.toString(),
      "TRUE",
      "TRUE",
      watch.sku || "",
      imagePath,
      "1",
      "active"
    ]);
  }

  const csvContent = rows.map((r) => r.join(",")).join("\n");
  const outputPath = path.join(rootDir, "public", "shopify_products_export.csv");
  fs.writeFileSync(outputPath, csvContent, "utf8");
  console.log(`Generated Shopify CSV with ${PRODUCTS_DATA.length} watches at: ${outputPath}`);
}

run().catch(console.error);
