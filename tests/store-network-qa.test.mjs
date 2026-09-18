import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { MAP_CITIES, INDIA_MAP_VIEWBOX, INDIA_MAP_PATHS } from "../src/indiaMapData.js";

// Load STORES_DATA and CITY_FILTERS from App.jsx
function loadStoreLocatorData() {
  const appContent = fs.readFileSync(path.resolve(process.cwd(), "src/App.jsx"), "utf8");
  
  const storeStart = appContent.indexOf("const STORES_DATA = [");
  const storeEnd = appContent.indexOf("];\n\n\n\n// ═════", storeStart);
  const storeCode = appContent.slice(storeStart, storeEnd + 2).replace("const STORES_DATA = ", "");
  const stores = (new Function("return " + storeCode))();

  const filterStart = appContent.indexOf("const CITY_FILTERS = [");
  const filterEnd = appContent.indexOf("];\n\nfunction StoreLocatorView", filterStart);
  const filterCode = appContent.slice(filterStart, filterEnd + 2).replace("const CITY_FILTERS = ", "");
  const filters = (new Function("return " + filterCode))();

  return { stores, filters };
}

test("Store Network QA: All stores have complete and valid dossiers", () => {
  const { stores } = loadStoreLocatorData();
  assert.ok(stores.length >= 19, `Expected at least 19 authorized boutiques, got ${stores.length}`);

  const seenIds = new Set();

  stores.forEach((store) => {
    // Unique ID
    assert.ok(store.id, `Store must have an ID: ${JSON.stringify(store)}`);
    assert.ok(!seenIds.has(store.id), `Duplicate store ID found: ${store.id}`);
    seenIds.add(store.id);

    // Essential fields
    assert.ok(store.name && store.name.trim().length > 0, `Store ${store.id} missing name`);
    assert.ok(store.city && store.city.trim().length > 0, `Store ${store.id} missing city`);
    assert.ok(store.state && store.state.trim().length > 0, `Store ${store.id} missing state`);
    assert.ok(store.country === "India", `Store ${store.id} must have country set to India`);
    assert.ok(store.address && store.address.length >= 10, `Store ${store.id} has invalid address: ${store.address}`);
    assert.ok(store.phone && store.phone.includes("+91"), `Store ${store.id} missing formatted phone: ${store.phone}`);
    assert.ok(store.phoneRaw && /^\+?91\d{10}$/.test(store.phoneRaw.replace(/\D/g, "")), `Store ${store.id} has invalid phoneRaw: ${store.phoneRaw}`);
    assert.ok(store.hours && store.hours.includes("–"), `Store ${store.id} missing hours`);
    assert.ok(store.mapUrl && store.mapUrl.startsWith("http"), `Store ${store.id} has invalid mapUrl: ${store.mapUrl}`);
    assert.ok(store.type && store.type.includes("Authorized"), `Store ${store.id} missing Authorized retailer type: ${store.type}`);

    // High-res Image file verification on disk
    assert.ok(store.image && store.image.startsWith("/"), `Store ${store.id} invalid image path: ${store.image}`);
    const localImagePath = path.resolve(process.cwd(), "public" + store.image);
    assert.ok(fs.existsSync(localImagePath), `Store ${store.id} image missing from public/: ${store.image}`);
  });
});

test("Store Network QA: City filters match existing retailers", () => {
  const { stores, filters } = loadStoreLocatorData();
  assert.ok(filters.includes("ALL"), "Filters must contain 'ALL'");

  filters.forEach((filter) => {
    if (filter === "ALL") return;

    const matched = stores.some((store) => {
      const cityMatches = store.city.toUpperCase() === filter;
      const areaMatches = store.area && store.area.toUpperCase() === filter;
      const keywordMatches = store.keywords && store.keywords.toUpperCase().includes(filter);
      return cityMatches || areaMatches || keywordMatches;
    });

    assert.ok(matched, `City filter '${filter}' does not match any store in STORES_DATA!`);
  });
});

test("Store Network QA: India map data and pins are accurate", () => {
  const { stores } = loadStoreLocatorData();
  assert.equal(INDIA_MAP_VIEWBOX, "0 0 612 696");
  assert.ok(INDIA_MAP_PATHS.length >= 35, "Expected comprehensive Survey of India map regions");

  const [,, vbWidth, vbHeight] = INDIA_MAP_VIEWBOX.split(" ").map(Number);
  const seenCityNames = new Set();

  MAP_CITIES.forEach((node) => {
    assert.ok(node.name, "City pin must have a name");
    assert.ok(!seenCityNames.has(node.name), `Duplicate city pin: ${node.name}`);
    seenCityNames.add(node.name);

    // Coordinate bounds check inside SVG viewBox
    assert.ok(node.x >= 0 && node.x <= vbWidth, `Pin ${node.name} x:${node.x} outside viewBox width ${vbWidth}`);
    assert.ok(node.y >= 0 && node.y <= vbHeight, `Pin ${node.name} y:${node.y} outside viewBox height ${vbHeight}`);

    // Matches a store
    const matchesStore = stores.some((s) => {
      return (
        s.city.toUpperCase() === node.name ||
        (s.area && s.area.toUpperCase() === node.name) ||
        (s.keywords && s.keywords.toUpperCase().includes(node.name))
      );
    });
    assert.ok(matchesStore, `Map pin ${node.name} does not match any store in directory!`);
  });
});
