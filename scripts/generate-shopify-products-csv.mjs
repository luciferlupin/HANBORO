import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function escapeCsvField(val) {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

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
    "Option2 Name",
    "Option2 Value",
    "Option3 Name",
    "Option3 Value",
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
    "Image Alt Text",
    "Gift Card",
    "SEO Title",
    "SEO Description",
    "Google Shopping / Google Product Category",
    "Google Shopping / Gender",
    "Google Shopping / Age Group",
    "Google Shopping / MPN",
    "Google Shopping / Condition",
    "Google Shopping / Custom Product",
    "Google Shopping / Custom Label 0",
    "Google Shopping / Custom Label 1",
    "Google Shopping / Custom Label 2",
    "Google Shopping / Custom Label 3",
    "Google Shopping / Custom Label 4",
    "Variant Image",
    "Variant Weight Unit",
    "Variant Tax Code",
    "Cost per item",
    "Status"
  ];

  const rows = [headers];

  for (const watch of PRODUCTS_DATA) {
    const handle = String(watch.sku || watch.id || "watch")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const title = watch.name || `HANBORO Watch ${watch.sku}`;
    
    // Build clean, rich HTML body
    const desc = watch.description || watch.summary || `Luxury Swiss precision automatic timepiece. Reference ${watch.sku}.`;
    const specsHtml = watch.specs ? `
<h3>Specifications</h3>
<ul>
  <li><strong>Movement:</strong> ${watch.specs.movement?.replace(/\n/g, ", ") || "Automatic Mechanical"}</li>
  <li><strong>Power Reserve:</strong> ${watch.specs.powerReserve || "Approx. 42 Hours"}</li>
  <li><strong>Jewels:</strong> ${watch.specs.jewels || "21+ Jewels"}</li>
  <li><strong>Frequency:</strong> ${watch.specs.frequency || "21,600 VPH"}</li>
  <li><strong>Case Material:</strong> ${watch.specs.caseMaterial || "316L Stainless Steel"}</li>
  <li><strong>Glass:</strong> ${watch.specs.glass || "Synthetic Sapphire Crystal"}</li>
  <li><strong>Case Diameter:</strong> ${watch.specs.caseDiameter || watch.specs.caseDimensions || "42mm"}</li>
  <li><strong>Water Resistance:</strong> ${watch.specs.waterResistance || "50M (5 ATM)"}</li>
  <li><strong>Strap:</strong> ${watch.specs.strap || "Fluororubber / Stainless Steel"}</li>
  <li><strong>Clasp:</strong> ${watch.specs.clasp || "Butterfly Clasp / Tang Buckle"}</li>
  <li><strong>Warranty:</strong> ${watch.specs.warranty || "24 Months Official Manufacturer Warranty"}</li>
</ul>` : "";

    const complianceHtml = watch.compliance ? `
<h3>Compliance & Care</h3>
<p><strong>Country of Origin:</strong> ${watch.compliance.countryOfOrigin || "People’s Republic of China"}</p>
<p><strong>Manufacturer:</strong> ${watch.compliance.manufacturer || "Guangzhou Hengbaoluo Technology Co., Ltd."}</p>
<p><strong>Importer / Packer:</strong> ${watch.compliance.importer || "Rise N Be Original Lifestyle Pvt Ltd, India"}</p>` : "";

    const bodyHtml = `<p>${desc.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>${specsHtml}${complianceHtml}`;

    const vendor = "HANBORO";
    const category = "Apparel & Accessories > Jewelry > Watches";
    const type = "Luxury Automatic Watches";
    const tagList = [
      "HANBORO",
      "Luxury Watches",
      "Automatic",
      watch.collection || "AUTOMATIC",
      watch.tag || "Skeleton Watch",
      watch.sku,
      watch.modelNumber ? `Model-${watch.modelNumber}` : "",
      watch.specs?.movement?.toLowerCase().includes("tourbillon") ? "Tourbillon" : "Skeleton"
    ].filter(Boolean);
    const tags = tagList.join(", ");

    const priceNum = Number.parseInt(String(watch.price || 0).replace(/[^\d]/g, ""), 10) || 18500;
    const mrpNum = Number.parseInt(String(watch.mrp || 0).replace(/[^\d]/g, ""), 10) || Math.round(priceNum * 1.25);

    // Collect all unique images for this watch
    const rawImages = [];
    if (watch.image) rawImages.push(watch.image);
    if (Array.isArray(watch.altImages)) {
      for (const img of watch.altImages) {
        if (img && !rawImages.includes(img)) rawImages.push(img);
      }
    }
    if (Array.isArray(watch.gallery)) {
      for (const g of watch.gallery) {
        if (g?.url && !rawImages.includes(g.url)) rawImages.push(g.url);
      }
    }
    if (rawImages.length === 0) {
      rawImages.push("/placeholder-watch.png");
    }

    const imageUrls = rawImages.map((img) =>
      img.startsWith("http") ? img : `https://hanborowatches.in${img}`
    );

    // Primary row (Product + First Image + Variant)
    const firstImage = imageUrls[0];
    const row1 = [
      handle,                                      // Handle
      title,                                       // Title
      bodyHtml,                                    // Body (HTML)
      vendor,                                      // Vendor
      category,                                    // Product Category
      type,                                        // Type
      tags,                                        // Tags
      "TRUE",                                      // Published
      "Title",                                     // Option1 Name
      "Default Title",                             // Option1 Value
      "", "", "", "",                              // Option2/3 Name & Value
      watch.sku || handle.toUpperCase(),           // Variant SKU
      "250",                                       // Variant Grams
      "shopify",                                   // Variant Inventory Tracker
      String(watch.stock || 10),                   // Variant Inventory Qty
      "continue",                                  // Variant Inventory Policy
      "manual",                                    // Variant Fulfillment Service
      priceNum.toString(),                         // Variant Price
      mrpNum.toString(),                           // Variant Compare At Price
      "TRUE",                                      // Variant Requires Shipping
      "TRUE",                                      // Variant Taxable
      watch.sku || "",                             // Variant Barcode
      firstImage,                                  // Image Src
      "1",                                         // Image Position
      `${title} - Reference ${watch.sku || ""}`,   // Image Alt Text
      "FALSE",                                     // Gift Card
      title,                                       // SEO Title
      (watch.subtitle || desc).slice(0, 320),      // SEO Description
      "Apparel & Accessories > Jewelry > Watches", // Google Category
      "Unisex",                                    // Gender
      "Adult",                                     // Age Group
      watch.sku || "",                             // MPN
      "new",                                       // Condition
      "FALSE",                                     // Custom Product
      "", "", "", "", "",                          // Custom Labels 0-4
      firstImage,                                  // Variant Image
      "g",                                         // Variant Weight Unit
      "",                                          // Variant Tax Code
      "",                                          // Cost per item
      "active"                                     // Status
    ];

    rows.push(row1.map(escapeCsvField));

    // Secondary image rows
    for (let i = 1; i < imageUrls.length; i++) {
      const imgUrl = imageUrls[i];
      const imageRow = new Array(headers.length).fill("");
      imageRow[0] = handle;                        // Handle
      imageRow[25] = imgUrl;                       // Image Src
      imageRow[26] = (i + 1).toString();           // Image Position
      imageRow[27] = `${title} - View ${i + 1}`;  // Image Alt Text
      rows.push(imageRow.map(escapeCsvField));
    }
  }

  const csvContent = rows.map((r) => r.join(",")).join("\r\n");
  const outputPath = path.join(rootDir, "public", "shopify_products_export.csv");
  fs.writeFileSync(outputPath, csvContent, "utf8");

  console.log(`✅ Successfully generated official Shopify CSV with ${PRODUCTS_DATA.length} watches!`);
  console.log(`📁 File saved to: ${outputPath}`);
  console.log(`📊 Total CSV Rows (including multi-images): ${rows.length}`);
}

run().catch(console.error);
