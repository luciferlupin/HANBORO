// Meta Pixel / Meta Ads Dataset Integration Service
// Dataset ID: 1069596304671544
// Official Meta Ads Conversion & Standard Event Tracking for Hanboro Haute Horlogerie

export const META_DATASET_ID = "1069596304671544";

class MetaPixelService {
  constructor() {
    this.datasetId = META_DATASET_ID;
    this.isInitialized = false;
    this.eventHistory = [];
  }

  // Safe wrapper for window.fbq with ad-blocker resistance & test event capture
  safeFbq(action, eventName, params = {}) {
    const timestamp = new Date().toISOString();
    const eventRecord = { action, eventName, params, timestamp };
    this.eventHistory.unshift(eventRecord);
    if (this.eventHistory.length > 50) this.eventHistory.pop();

    try {
      if (typeof window !== "undefined" && typeof window.fbq === "function") {
        if (params && Object.keys(params).length > 0) {
          window.fbq(action, eventName, params);
        } else {
          window.fbq(action, eventName);
        }
      }
    } catch (err) {
      console.warn("Meta Pixel telemetry notification:", err);
    }

    // Dispatch synthetic DOM event for testing and telemetry subscribers
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      try {
        window.dispatchEvent(
          new CustomEvent("meta_pixel_event", { detail: eventRecord })
        );
      } catch {}
    }

    return eventRecord;
  }

  // 1. PageView - Triggered on page view & hash route changes
  trackPageView(pageName = "") {
    const path = pageName || (typeof window !== "undefined" ? window.location.hash || window.location.pathname : "/");
    return this.safeFbq("track", "PageView", {
      page_path: path,
      dataset_id: this.datasetId,
    });
  }

  // 2. ViewContent - Triggered when viewing a timepiece product modal/dossier
  trackViewContent(product) {
    if (!product) return null;
    const priceNum =
      typeof product.priceNumeric === "number"
        ? product.priceNumeric
        : parseInt(String(product.price || 0).replace(/[^\d]/g, ""), 10) || 0;

    return this.safeFbq("track", "ViewContent", {
      content_name: product.name || "Hanboro Luxury Timepiece",
      content_category: product.collection || "Luxury Watches",
      content_ids: [String(product.sku || product.id || "").toUpperCase()],
      content_type: "product",
      value: priceNum,
      currency: "INR",
    });
  }

  // 3. AddToCart - Triggered when adding a watch to cart
  trackAddToCart(product, quantity = 1) {
    if (!product) return null;
    const priceNum =
      typeof product.priceNumeric === "number"
        ? product.priceNumeric
        : parseInt(String(product.price || 0).replace(/[^\d]/g, ""), 10) || 0;
    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    return this.safeFbq("track", "AddToCart", {
      content_name: product.name || "Hanboro Luxury Timepiece",
      content_category: product.collection || "Luxury Watches",
      content_ids: [String(product.sku || product.id || "").toUpperCase()],
      content_type: "product",
      value: priceNum * qty,
      currency: "INR",
      num_items: qty,
    });
  }

  // 4. Contact / Lead - Triggered on WhatsApp concierge or newsletter
  trackContact(details = {}) {
    const payload = typeof details === "string" ? { channel: details } : (details || {});
    return this.safeFbq("track", "Contact", {
      currency: "INR",
      ...payload,
    });
  }

  trackLead(details = {}) {
    const payload = typeof details === "string" ? { content_name: details } : (details || {});
    return this.safeFbq("track", "Lead", {
      currency: "INR",
      ...payload,
    });
  }

  // Get telemetry history
  getEventHistory() {
    return [...this.eventHistory];
  }

  // Clear telemetry history (testing and resets)
  clearHistory() {
    this.eventHistory = [];
  }
}

export const metaPixelService = new MetaPixelService();
