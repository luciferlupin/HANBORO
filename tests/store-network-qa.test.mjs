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

test("Store Network QA: Exactly 12 authentic stores with 100% unique photos and valid dossiers", () => {
  const { stores } = loadStoreLocatorData();
  assert.equal(stores.length, 12, `Expected exactly 12 authentic authorized showrooms, got ${stores.length}`);

  const seenIds = new Set();
  const seenImages = new Set();

  stores.forEach((store) => {
    // Unique ID
    assert.ok(store.id, `Store must have an ID: ${JSON.stringify(store)}`);
    assert.ok(!seenIds.has(store.id), `Duplicate store ID found: ${store.id}`);
    seenIds.add(store.id);

    // ZERO duplicate photos across stores!
    assert.ok(store.image && store.image.startsWith("/"), `Store ${store.id} invalid image path: ${store.image}`);
    assert.ok(!seenImages.has(store.image), `Duplicate store photo detected! Store ${store.id} uses ${store.image} which is already used by another store`);
    seenImages.add(store.image);

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
    const localImagePath = path.resolve(process.cwd(), "public" + store.image);
    assert.ok(fs.existsSync(localImagePath), `Store ${store.id} image missing from public/: ${store.image}`);
  });

  // Verify seen images count equals stores count
  assert.equal(seenImages.size, stores.length, "Each store must have a completely unique photo!");
});

test("Store Network QA: City/State filters match existing authentic retailers without ghost filters", () => {
  const { stores, filters } = loadStoreLocatorData();
  assert.ok(filters.includes("ALL"), "Filters must contain 'ALL'");

  filters.forEach((filter) => {
    if (filter === "ALL") return;

    const matched = stores.some((store) => {
      const cityMatches = store.city.toUpperCase() === filter;
      const stateMatches = store.state && store.state.toUpperCase() === filter;
      const areaMatches = store.area && store.area.toUpperCase() === filter;
      const keywordMatches = store.keywords && store.keywords.toUpperCase().includes(filter);
      return cityMatches || stateMatches || areaMatches || keywordMatches;
    });

    assert.ok(matched, `Filter '${filter}' does not match any authentic showroom in STORES_DATA!`);
  });
});

test("Store Network QA: Delhi filter only returns Pitampura (Time Point); Nagpal and Time Planet are strictly under Haryana", () => {
  const { stores } = loadStoreLocatorData();

  // Delhi filter strictly contains only Delhi stores (Time Point in Pitampura)
  const delhiStores = stores.filter((s) => s.city.toUpperCase() === "DELHI" || (s.state && s.state.toUpperCase() === "DELHI"));
  assert.equal(delhiStores.length, 1, "Delhi must have exactly 1 store (Time Point in Pitampura)");
  assert.equal(delhiStores[0].id, "time-point-pitampura");
  assert.equal(delhiStores[0].area, "Pitampura");

  // Nagpal Watches and Time Planet are strictly Haryana
  const haryanaStores = stores.filter((s) => s.state && s.state.toUpperCase() === "HARYANA");
  assert.equal(haryanaStores.length, 2, "Haryana must have exactly 2 stores (Nagpal Watches and Time Planet)");
  const haryanaIds = haryanaStores.map((s) => s.id);
  assert.ok(haryanaIds.includes("nagpal-watches-karnal"), "Nagpal Watches must be in Haryana");
  assert.ok(haryanaIds.includes("time-planet-bahadurgarh"), "Time Planet must be in Haryana");

  // Neither Nagpal Watches nor Time Planet contains Delhi in keywords
  assert.ok(!haryanaStores.some((s) => s.keywords.includes("Delhi NCR")), "Haryana stores must not contain 'Delhi NCR' keywords");
});

test("Store Network QA: Lokhandwala Watches Pvt Ltd is present with valid Mumbai address, photo, and hours", () => {
  const { stores } = loadStoreLocatorData();
  const lokhandwala = stores.find((s) => s.id === "lokhandwala-watches-mumbai");
  assert.ok(lokhandwala, "Lokhandwala Watches must be present in directory");
  assert.equal(lokhandwala.name, "LOKHANDWALA WATCHES PVT LTD");
  assert.equal(lokhandwala.city, "Mumbai");
  assert.equal(lokhandwala.area, "Andheri West");
  assert.equal(lokhandwala.state, "Maharashtra");
  assert.ok(lokhandwala.address.includes("Swiss Palace"));
  assert.ok(lokhandwala.address.includes("Shastri Nagar"));
  assert.ok(lokhandwala.address.includes("Andheri West"));
  assert.equal(lokhandwala.image, "/store-lokhandwala-watches-mumbai.jpg");
  assert.ok(fs.existsSync(path.resolve(process.cwd(), "public" + lokhandwala.image)));
});

test("Store Network QA: India map data has exactly 11 authentic pins matching directory", () => {
  const { stores } = loadStoreLocatorData();
  assert.equal(INDIA_MAP_VIEWBOX, "0 0 612 696");
  assert.ok(INDIA_MAP_PATHS.length >= 35, "Expected comprehensive Survey of India map regions");
  assert.equal(MAP_CITIES.length, 11, `Expected exactly 11 map pins matching the authentic store cities, got ${MAP_CITIES.length}`);

  const [,, vbWidth, vbHeight] = INDIA_MAP_VIEWBOX.split(" ").map(Number);
  const seenCityNames = new Set();

  MAP_CITIES.forEach((node) => {
    assert.ok(node.name, "City pin must have a name");
    assert.ok(!seenCityNames.has(node.name), `Duplicate city pin: ${node.name}`);
    seenCityNames.add(node.name);

    // Coordinate bounds check inside SVG viewBox
    assert.ok(node.x >= 0 && node.x <= vbWidth, `Pin ${node.name} x:${node.x} outside viewBox width ${vbWidth}`);
    assert.ok(node.y >= 0 && node.y <= vbHeight, `Pin ${node.name} y:${node.y} outside viewBox height ${vbHeight}`);

    // Matches a real store
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
