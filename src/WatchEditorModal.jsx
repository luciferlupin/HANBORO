import React, { useState, useEffect, useRef } from "react";
import { CATEGORIES } from "./productsData";

const TAG_PRESETS = [
  "Flagship Grand Complication",
  "Limited Allocation",
  "Masterpiece Reference",
  "New 2026 Reference",
  "Royal Diamond Edition",
  "Tonneau Haute Skeleton",
  "Kinetic Casino Exclusive",
  "Bestseller",
  "Collector Priority",
];

const COMPLICATION_SUGGESTIONS = [
  "Co-Axial Flying Tourbillon Regulating Assembly",
  "3D Orbital Celestial Moonphase Indicator",
  "Multi-Layer Openworked Skeleton Movement",
  "Kinetic Precision Ceramic Ball Roulette Wheel",
  "Double-Axis Hand-Beveled Skeleton Bridges",
  "Supersonic Stealth Fighter Micro-Sculpture",
  "Super-LumiNova Grade X1 Photoluminescent Lume",
  "Screw-Down Crown with Double O-Ring Seal",
];

const TABS = [
  { id: "identity", step: "1", title: "Identity", subtitle: "Name & Series", icon: "💎" },
  { id: "valuation", step: "2", title: "Pricing & Stock", subtitle: "Valuation & Units", icon: "🏷️" },
  { id: "media", step: "3", title: "Imagery", subtitle: "Device Upload", icon: "📷" },
  { id: "specs", step: "4", title: "Technical Specs", subtitle: "Caliber Dossier", icon: "⚙️" },
  { id: "preview", step: "5", title: "Live Preview", subtitle: "Verify & Publish", icon: "👁️" },
];

export function WatchEditorModal({
  isOpen,
  onClose,
  initialData = null,
  onSave,
  onDeleteRequest,
}) {
  const isEditMode = Boolean(initialData && (initialData.id || initialData.sku));
  const [activeTab, setActiveTab] = useState("identity");
  const [errors, setErrors] = useState({});
  const [showUrlInput, setShowUrlInput] = useState(false);

  const mainFileInputRef = useRef(null);
  const galleryFileInputRef = useRef(null);
  const nightFileInputRef = useRef(null);

  // Form State
  const [form, setForm] = useState({
    name: "",
    sku: "",
    subtitle: "",
    collection: "TOURBILLON",
    collectionName: "Tourbillon & Complications",
    tag: "Haute Horlogerie",
    price: "₹1,25,000",
    priceUsd: "$1,500",
    availability: "In Stock",
    year: "2026",
    summary: "",
    image: "",
    transparentImage: "",
    nightImage: "",
    hasNightMode: false,
    stock: 12,
    isActive: true,
    galleryUrls: "",
    specs: {
      movement: "Caliber H-9000 In-House Co-Axial Tourbillon Automatic",
      frequency: "28,800 VPH (4.0 Hz)",
      powerReserve: "72 Hours Power Reserve",
      jewels: "33 Synthetic Rubies",
      caseMaterial: "Sculpted 316L Surgical Stainless Steel & 18K Rose Gold PVD",
      caseDimensions: "44.0 mm × 14.5 mm",
      lugToLug: "52.0 mm",
      glass: "Multi-Curved Panoramic Sapphire Crystal with Dual AR Coating",
      caseback: "Full Exhibition Sapphire Crystal Caseback with Laser Serialization",
      dial: "Deep-Space Multi-Layer Skeleton Dial with Micro-Sculpted Accents",
      waterResistance: "50 Meters (5 ATM / 165 Feet)",
      strap: "High-Performance Vulcanized Fluororubber Strap with Quick-Release",
      clasp: "Double-Security Push-Button Deployant Clasp",
      complications: [
        "Co-Axial Flying Tourbillon Regulating Assembly",
        "3D Orbital Celestial Indicator",
        "Multi-Layer Openworked Movement Architecture",
      ],
      packaging: "Piano-Black Lacquered Wooden Vault with Domed Viewing Port & Collector Passport",
    },
  });

  const [complicationInput, setComplicationInput] = useState("");

  // Sync form state when modal opens or initialData changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      const gUrls = initialData.altImages || (initialData.gallery || []).map((g) => (typeof g === "string" ? g : g.url));
      setForm({
        name: initialData.name || "",
        sku: initialData.sku || "",
        subtitle: initialData.subtitle || "",
        collection: initialData.collection || "TOURBILLON",
        collectionName: initialData.collectionName || "Tourbillon & Complications",
        tag: initialData.tag || "Haute Horlogerie",
        price: initialData.price || "₹1,25,000",
        priceUsd: initialData.priceUsd || "$1,500",
        availability: initialData.availability || "In Stock",
        year: initialData.year || "2026",
        summary: initialData.summary || "",
        image: initialData.image || "",
        transparentImage: initialData.transparentImage || initialData.image || "",
        nightImage: initialData.nightImage || "",
        hasNightMode: Boolean(initialData.hasNightMode || initialData.nightImage),
        stock: typeof initialData.stock === "number" ? initialData.stock : 12,
        isActive: initialData.isActive !== false,
        galleryUrls: Array.isArray(gUrls) ? gUrls.join("\n") : (initialData.image || ""),
        specs: {
          movement: initialData.specs?.movement || "Caliber H-9000 In-House Automatic",
          frequency: initialData.specs?.frequency || "28,800 VPH (4.0 Hz)",
          powerReserve: initialData.specs?.powerReserve || "72 Hours Power Reserve",
          jewels: initialData.specs?.jewels || "33 Synthetic Rubies",
          caseMaterial: initialData.specs?.caseMaterial || "Sculpted 316L Surgical Stainless Steel",
          caseDimensions: initialData.specs?.caseDimensions || "44.0 mm × 14.5 mm",
          lugToLug: initialData.specs?.lugToLug || "52.0 mm",
          glass: initialData.specs?.glass || "Panoramic Sapphire Crystal with Dual AR Coating",
          caseback: initialData.specs?.caseback || "Exhibition Sapphire Crystal Caseback",
          dial: initialData.specs?.dial || "Openworked Skeleton Multi-Layer Dial",
          waterResistance: initialData.specs?.waterResistance || "50 Meters (5 ATM / 165 Feet)",
          strap: initialData.specs?.strap || "High-Performance Vulcanized Fluororubber Strap",
          clasp: initialData.specs?.clasp || "Double-Security Push-Button Deployant Clasp",
          complications: Array.isArray(initialData.specs?.complications) && initialData.specs.complications.length > 0
            ? initialData.specs.complications
            : ["Co-Axial Flying Tourbillon Regulating Assembly", "Multi-Layer Openworked Skeleton Architecture"],
          packaging: initialData.specs?.packaging || "Piano-Black Lacquered Wooden Presentation Vault",
        },
      });
    } else {
      const randomSkuNum = Math.floor(1000 + Math.random() * 9000);
      setForm({
        name: "",
        sku: `HBR-${randomSkuNum}-X`,
        subtitle: "Avant-Garde Skeleton Tourbillon • Haute Horlogerie 2026",
        collection: "TOURBILLON",
        collectionName: "Tourbillon & Complications",
        tag: "New Masterpiece 2026",
        price: "₹1,35,000",
        priceUsd: "$1,620",
        availability: "In Stock",
        year: "2026",
        summary: "An extraordinary horological creation featuring sculpted architecture, multi-axis finishing, and high-frequency precision timekeeping.",
        image: "/watch-astroworld-moon-rosegold-front-transparent.webp",
        transparentImage: "/watch-astroworld-moon-rosegold-front-transparent.webp",
        nightImage: "",
        hasNightMode: false,
        stock: 10,
        isActive: true,
        galleryUrls: "",
        specs: {
          movement: "Caliber H-9000 In-House Co-Axial Flying Tourbillon Automatic",
          frequency: "28,800 VPH (4.0 Hz)",
          powerReserve: "72 Hours Power Reserve",
          jewels: "33 Synthetic Rubies",
          caseMaterial: "Sculpted 316L Surgical Stainless Steel with Satin-Brushed Planes",
          caseDimensions: "44.0 mm × 14.5 mm",
          lugToLug: "52.0 mm",
          glass: "Panoramic Curved Sapphire Crystal with Dual AR Coating",
          caseback: "Full Exhibition Sapphire Crystal Caseback with Laser Serialization",
          dial: "Multi-Layer Openworked Skeleton Dial with Hand-Beveled Bridges",
          waterResistance: "50 Meters (5 ATM / 165 Feet)",
          strap: "High-Performance Vulcanized Black Ergonomic Fluororubber",
          clasp: "Double-Security Push-Button Deployant Clasp",
          complications: [
            "Co-Axial Flying Tourbillon Regulating Assembly",
            "3D Orbital Celestial Moonphase Indicator",
            "Multi-Layer Openworked Skeleton Movement",
          ],
          packaging: "Piano-Black Lacquered Wooden Presentation Vault with Passport",
        },
      });
    }

    setErrors({});
    setActiveTab("identity");
    setShowUrlInput(false);
  }, [isOpen, initialData]);

  // Lock background body scroll and pause Lenis while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalPadding = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    document.body.style.overflow = "hidden";
    document.body.classList.add("modal-open");
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    window.__hanboro_lenis?.stop();

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPadding;
      document.body.classList.remove("modal-open");
      window.__hanboro_lenis?.start();
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // File Upload Handlers (Device Photos)
  const handleMainImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setForm((prev) => ({
        ...prev,
        image: dataUrl,
        transparentImage: dataUrl,
      }));
      if (errors.image) setErrors({ ...errors, image: null });
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        setForm((prev) => {
          const current = prev.galleryUrls ? prev.galleryUrls.split("\n").filter(Boolean) : [];
          return {
            ...prev,
            galleryUrls: [...current, dataUrl].join("\n"),
          };
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveGalleryItem = (index) => {
    setForm((prev) => {
      const current = prev.galleryUrls ? prev.galleryUrls.split("\n").filter(Boolean) : [];
      const filtered = current.filter((_, i) => i !== index);
      return {
        ...prev,
        galleryUrls: filtered.join("\n"),
      };
    });
  };

  const handleNightImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setForm((prev) => ({
        ...prev,
        nightImage: dataUrl,
        hasNightMode: true,
      }));
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop for primary photo
  const handleDropMain = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setForm((prev) => ({
        ...prev,
        image: dataUrl,
        transparentImage: dataUrl,
      }));
      if (errors.image) setErrors({ ...errors, image: null });
    };
    reader.readAsDataURL(file);
  };

  // Auto-calculate USD price when INR price changes
  const handlePriceInrChange = (val) => {
    const rawDigits = val.replace(/[^\d]/g, "");
    let formattedInr = val;
    if (rawDigits) {
      const num = parseInt(rawDigits, 10);
      formattedInr = `₹${num.toLocaleString("en-IN")}`;
      const approxUsd = Math.round(num / 83);
      setForm((prev) => ({
        ...prev,
        price: formattedInr,
        priceUsd: `$${approxUsd.toLocaleString("en-US")}`,
      }));
    } else {
      setForm((prev) => ({ ...prev, price: val }));
    }
  };

  const handleCollectionChange = (collectionId) => {
    const matched = CATEGORIES.find((c) => c.id === collectionId);
    setForm((prev) => ({
      ...prev,
      collection: collectionId,
      collectionName: matched ? matched.label : "Haute Horlogerie",
    }));
  };

  const handleSpecChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      specs: {
        ...prev.specs,
        [key]: value,
      },
    }));
  };

  const handleAddComplication = (text) => {
    const comp = text || complicationInput;
    if (!comp || !comp.trim()) return;
    if ((form.specs.complications || []).includes(comp.trim())) return;
    setForm((prev) => ({
      ...prev,
      specs: {
        ...prev.specs,
        complications: [...(prev.specs.complications || []), comp.trim()],
      },
    }));
    setComplicationInput("");
  };

  const handleRemoveComplication = (index) => {
    setForm((prev) => ({
      ...prev,
      specs: {
        ...prev.specs,
        complications: prev.specs.complications.filter((_, i) => i !== index),
      },
    }));
  };

  const validateForm = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Model name is required";
    if (!form.sku.trim()) errs.sku = "SKU code is required";
    if (!form.price.trim()) errs.price = "Price is required";
    if (!form.image.trim()) errs.image = "Please upload a photo of the timepiece from your device";
    setErrors(errs);
    return errs;
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length > 0) {
      if (errs.name || errs.sku) setActiveTab("identity");
      else if (errs.price) setActiveTab("valuation");
      else if (errs.image) setActiveTab("media");
      return;
    }

    const rawGallery = form.galleryUrls
      ? form.galleryUrls.split("\n").map((u) => u.trim()).filter(Boolean)
      : (form.image ? [form.image] : []);

    const formattedGallery = rawGallery.map((url, i) => ({
      url,
      title: `${form.name} — Perspective ${i + 1}`,
      label: `0${i + 1} Perspective`,
      caption: `Precision horological inspection of ${form.name}.`,
    }));

    const safeId =
      initialData?.id ||
      form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") +
        `-${Date.now().toString().slice(-4)}`;

    const payload = {
      ...(initialData || {}),
      id: safeId,
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      subtitle: form.subtitle.trim() || `${form.collectionName} • Haute Horlogerie`,
      collection: form.collection,
      collectionName: form.collectionName,
      tag: form.tag.trim(),
      price: form.price.trim().startsWith("₹") ? form.price.trim() : `₹${form.price.trim()}`,
      priceUsd: form.priceUsd.trim().startsWith("$") ? form.priceUsd.trim() : `$${form.priceUsd.trim()}`,
      availability: form.availability,
      year: form.year.trim() || "2026",
      summary: form.summary.trim() || "Precision mechanical luxury timepiece engineered by Hanboro Watches.",
      image: form.image.trim(),
      transparentImage: form.transparentImage.trim() || form.image.trim(),
      nightImage: form.nightImage.trim() || null,
      hasNightMode: Boolean(form.nightImage.trim()),
      stock: Math.max(0, parseInt(form.stock, 10) || 0),
      isActive: form.isActive,
      altImages: rawGallery,
      gallery: formattedGallery,
      specs: form.specs,
    };

    onSave(payload);
    onClose();
  };

  if (!isOpen) return null;

  const galleryList = form.galleryUrls ? form.galleryUrls.split("\n").filter(Boolean) : [];

  return (
    <div className="watch-editor-overlay" role="dialog" aria-modal="true" data-lenis-prevent="true">
      <div className="watch-editor-backdrop" onClick={onClose} />

      <div className="watch-editor-modal" data-lenis-prevent="true">
        {/* ── HEADER ── */}
        <div className="watch-editor-header">
          <div className="editor-brand-badge">
            <span className="editor-ref-pill">
              {isEditMode ? `REF. ${form.sku || initialData?.sku}` : "NEW TIMEPIECE"}
            </span>
            <h2 className="editor-modal-head-title">
              {isEditMode ? (form.name || "Edit Timepiece") : "Create New Timepiece Dossier"}
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              className="editor-header-save-btn"
              onClick={handleSubmit}
            >
              ✓ Save
            </button>
            <button
              type="button"
              className="editor-close-btn"
              onClick={onClose}
              aria-label="Close editor"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── CLEAN SEGMENTED TABS NAVIGATION ── */}
        <div className="editor-tabs-bar" data-lenis-prevent="true">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`editor-tab-btn ${activeTab === t.id ? "is-active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="tab-icon">{t.icon}</span>
              <span className="tab-label">
                <strong>{t.step}. {t.title}</strong>
              </span>
            </button>
          ))}
        </div>

        {/* ── SCROLLABLE MODAL BODY ── */}
        <div className="watch-editor-body" data-lenis-prevent="true">
          
          {/* TAB 1: IDENTITY & SERIES */}
          {activeTab === "identity" && (
            <div className="editor-tab-pane">
              <div className="editor-card-section">
                <div className="editor-card-section-head">
                  <span className="section-step-badge">1.1</span>
                  <div>
                    <h3 className="section-title">Core Reference Information</h3>
                    <p className="section-desc">Essential identification data shown on the main boutique card and search listings.</p>
                  </div>
                </div>

                <div className="editor-form-grid">
                  <div className="editor-field-group editor-span-2">
                    <label className="editor-label">
                      Timepiece Model Name <span className="field-required">*</span>
                    </label>
                    <input
                      type="text"
                      className={`editor-input editor-input--prominent ${errors.name ? "is-invalid" : ""}`}
                      placeholder="e.g. Astroworld Celestial Moon Tourbillon Rose Gold"
                      value={form.name}
                      onChange={(e) => {
                        setForm({ ...form, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: null });
                      }}
                    />
                    {errors.name && <span className="editor-error-msg">{errors.name}</span>}
                  </div>

                  <div className="editor-field-group">
                    <label className="editor-label">
                      Reference SKU Code <span className="field-required">*</span>
                    </label>
                    <input
                      type="text"
                      className={`editor-input editor-input--mono ${errors.sku ? "is-invalid" : ""}`}
                      placeholder="e.g. HBR-8801-TG"
                      value={form.sku}
                      onChange={(e) => {
                        setForm({ ...form, sku: e.target.value.toUpperCase() });
                        if (errors.sku) setErrors({ ...errors, sku: null });
                      }}
                    />
                    {errors.sku && <span className="editor-error-msg">{errors.sku}</span>}
                  </div>

                  <div className="editor-field-group">
                    <label className="editor-label">Series / Collection Category</label>
                    <select
                      className="editor-select"
                      value={form.collection}
                      onChange={(e) => handleCollectionChange(e.target.value)}
                    >
                      {CATEGORIES.filter((c) => c.id !== "ALL").map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="editor-field-group">
                    <label className="editor-label">Release Year</label>
                    <input
                      type="text"
                      className="editor-input"
                      placeholder="2026"
                      value={form.year}
                      onChange={(e) => setForm({ ...form, year: e.target.value })}
                    />
                  </div>

                  <div className="editor-field-group">
                    <label className="editor-label">Prestige Badge / Tag</label>
                    <input
                      type="text"
                      className="editor-input"
                      placeholder="e.g. Flagship Grand Complication"
                      value={form.tag}
                      onChange={(e) => setForm({ ...form, tag: e.target.value })}
                    />
                  </div>
                </div>

                <div className="editor-quick-pills-row">
                  <span className="pills-label">Quick Tag:</span>
                  {TAG_PRESETS.slice(0, 5).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`editor-tag-pill ${form.tag === t ? "is-selected" : ""}`}
                      onClick={() => setForm({ ...form, tag: t })}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="editor-card-section">
                <div className="editor-card-section-head">
                  <span className="section-step-badge">1.2</span>
                  <div>
                    <h3 className="section-title">Marketing Dossier & Narrative</h3>
                    <p className="section-desc">Short subtitle and detailed craftsmanship description for the timepiece detail page.</p>
                  </div>
                </div>

                <div className="editor-form-grid">
                  <div className="editor-field-group editor-span-2">
                    <label className="editor-label">Card Subtitle / Lineage</label>
                    <input
                      type="text"
                      className="editor-input"
                      placeholder="e.g. Avant-Garde Tonneau Skeleton • Haute Horlogerie 2026"
                      value={form.subtitle}
                      onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    />
                  </div>

                  <div className="editor-field-group editor-span-2">
                    <label className="editor-label">Horological Master Narrative</label>
                    <textarea
                      rows={3}
                      className="editor-textarea"
                      placeholder="Describe the architectural design, hand-finishing, movement craftsmanship, and horological inspiration..."
                      value={form.summary}
                      onChange={(e) => setForm({ ...form, summary: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="editor-step-nav-bar">
                <div />
                <button
                  type="button"
                  className="editor-nav-btn editor-nav-btn--primary"
                  onClick={() => setActiveTab("valuation")}
                >
                  Continue to Pricing & Stock →
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: VALUATION & INVENTORY */}
          {activeTab === "valuation" && (
            <div className="editor-tab-pane">
              <div className="editor-card-section">
                <div className="editor-card-section-head">
                  <span className="section-step-badge">2.1</span>
                  <div>
                    <h3 className="section-title">Retail Valuation</h3>
                    <p className="section-desc">Set the official boutique retail price. USD equivalent is computed automatically.</p>
                  </div>
                </div>

                <div className="editor-form-grid">
                  <div className="editor-field-group">
                    <label className="editor-label">
                      Retail Price (INR ₹) <span className="field-required">*</span>
                    </label>
                    <div className="input-with-currency-prefix">
                      <span className="currency-symbol">₹</span>
                      <input
                        type="text"
                        className={`editor-input editor-input--priced ${errors.price ? "is-invalid" : ""}`}
                        placeholder="1,25,000"
                        value={form.price.replace("₹", "")}
                        onChange={(e) => handlePriceInrChange(e.target.value)}
                      />
                    </div>
                    {errors.price && <span className="editor-error-msg">{errors.price}</span>}
                  </div>

                  <div className="editor-field-group">
                    <label className="editor-label">Retail Price (USD $)</label>
                    <div className="input-with-currency-prefix">
                      <span className="currency-symbol">$</span>
                      <input
                        type="text"
                        className="editor-input"
                        placeholder="1,500"
                        value={form.priceUsd.replace("$", "")}
                        onChange={(e) => setForm({ ...form, priceUsd: `$${e.target.value.replace("$", "")}` })}
                      />
                    </div>
                    <span className="field-subnote">Auto-synced with ₹ valuation</span>
                  </div>
                </div>
              </div>

              <div className="editor-card-section">
                <div className="editor-card-section-head">
                  <span className="section-step-badge">2.2</span>
                  <div>
                    <h3 className="section-title">Vault Stock & Allocation</h3>
                    <p className="section-desc">Manage physical inventory count and client order availability tags.</p>
                  </div>
                </div>

                <div className="editor-form-grid">
                  <div className="editor-field-group">
                    <label className="editor-label">Physical Vault Stock</label>
                    <div className="editor-stock-stepper-wrap">
                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => setForm({ ...form, stock: Math.max(0, (form.stock || 0) - 1) })}
                      >
                        –
                      </button>
                      <input
                        type="number"
                        min="0"
                        className="editor-input editor-input--center"
                        value={form.stock}
                        onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value, 10) || 0 })}
                      />
                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => setForm({ ...form, stock: (form.stock || 0) + 1 })}
                      >
                        +
                      </button>
                    </div>
                    <span className="field-subnote">
                      {form.stock > 0 ? `✓ ${form.stock} units ready for delivery` : "⚠️ 0 units: Displays as Made to Order"}
                    </span>
                  </div>

                  <div className="editor-field-group">
                    <label className="editor-label">Allocation Status</label>
                    <select
                      className="editor-select"
                      value={form.availability}
                      onChange={(e) => setForm({ ...form, availability: e.target.value })}
                    >
                      <option value="In Stock">In Stock (Immediate Dispatch)</option>
                      <option value="Limited Allocation">Limited Allocation (VIP Priority)</option>
                      <option value="Only 3 Units Remaining">Only 3 Units Remaining</option>
                      <option value="Made to Order (Bespoke)">Made to Order (Custom Order)</option>
                      <option value="Vault Reserve">Vault Reserve (Inquiry Required)</option>
                    </select>
                  </div>

                  <div className="editor-field-group editor-span-2">
                    <div className="editor-apple-toggle-box">
                      <label className="apple-toggle-switch">
                        <input
                          type="checkbox"
                          checked={form.isActive}
                          onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                        />
                        <span className="apple-toggle-slider" />
                      </label>
                      <div className="apple-toggle-details">
                        <span className="toggle-heading">
                          {form.isActive ? "● Active in Boutique Catalog" : "○ Hidden from Public"}
                        </span>
                        <span className="toggle-subnote">
                          {form.isActive
                            ? "This timepiece is live and purchasable by clients on the storefront."
                            : "This timepiece is hidden from the public storefront and search."}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="editor-step-nav-bar">
                <button
                  type="button"
                  className="editor-nav-btn editor-nav-btn--secondary"
                  onClick={() => setActiveTab("identity")}
                >
                  ← Back to Identity
                </button>
                <button
                  type="button"
                  className="editor-nav-btn editor-nav-btn--primary"
                  onClick={() => setActiveTab("media")}
                >
                  Continue to Imagery →
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: VISUAL MEDIA (DEVICE UPLOAD SYSTEM) */}
          {activeTab === "media" && (
            <div className="editor-tab-pane">
              
              {/* ── CARD 1: PRIMARY FRONT PHOTO ── */}
              <div className="editor-card-section">
                <div className="editor-card-section-head">
                  <span className="section-step-badge">3.1</span>
                  <div>
                    <h3 className="section-title">Primary Timepiece Photo</h3>
                    <p className="section-desc">Add a high-resolution front perspective photo of the timepiece directly from your device.</p>
                  </div>
                </div>

                <div className="device-upload-primary-row">
                  {/* Left: Upload Dropzone & Actions */}
                  <div className="device-upload-left">
                    <input
                      ref={mainFileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleMainImageFile}
                    />

                    <div
                      className={`device-dropzone ${form.image ? "has-photo" : ""} ${errors.image ? "is-error" : ""}`}
                      onClick={() => mainFileInputRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDropMain}
                    >
                      <div className="dropzone-icon-ring">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>

                      <div className="dropzone-text-group">
                        <span className="dropzone-title">
                          {form.image ? "Click or Drop to Replace Photo" : "Choose Photo from Device"}
                        </span>
                        <span className="dropzone-subtitle">
                          Supports PNG, WebP, JPG, or transparent cutouts
                        </span>
                      </div>

                      <button
                        type="button"
                        className="dropzone-browse-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          mainFileInputRef.current?.click();
                        }}
                      >
                        Browse Files
                      </button>
                    </div>

                    {errors.image && <span className="editor-error-msg">{errors.image}</span>}

                    {/* URL toggle for direct link input if needed */}
                    <div className="device-url-toggle-bar">
                      <button
                        type="button"
                        className="url-toggle-link"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                      >
                        {showUrlInput ? "Hide image URL input" : "Or specify image via web URL →"}
                      </button>
                    </div>

                    {showUrlInput && (
                      <div className="device-direct-url-box">
                        <input
                          type="text"
                          className="editor-input"
                          placeholder="https://... or /watch-photo.webp"
                          value={form.image}
                          onChange={(e) => {
                            setForm({
                              ...form,
                              image: e.target.value,
                              transparentImage: form.transparentImage || e.target.value,
                            });
                            if (errors.image) setErrors({ ...errors, image: null });
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Right: Live Render Preview Stage */}
                  <div className="device-preview-card">
                    <span className="stage-tag">PREVIEW STAGE</span>
                    <div className="device-stage-box">
                      {form.image ? (
                        <img
                          src={form.image}
                          alt="Watch preview"
                          className="device-watch-img"
                          onError={(e) => {
                            e.target.src = "/watch-astroworld-moon-rosegold-front-transparent.webp";
                          }}
                        />
                      ) : (
                        <div className="device-empty-stage">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          <span>No photo selected</span>
                        </div>
                      )}
                    </div>
                    <div className="device-meta-footer">
                      <span className="stage-model-name">{form.name || "Timepiece Title"}</span>
                      {form.image && (
                        <button
                          type="button"
                          className="device-clear-photo-btn"
                          onClick={() => setForm({ ...form, image: "", transparentImage: "" })}
                          title="Remove photo"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── CARD 2: MULTI-PERSPECTIVE GALLERY (FROM DEVICE) ── */}
              <div className="editor-card-section">
                <div className="editor-card-section-head">
                  <span className="section-step-badge">3.2</span>
                  <div>
                    <h3 className="section-title">Additional Perspective Angles & Gallery</h3>
                    <p className="section-desc">Add side profile, wrist shot, or caseback photos directly from your device.</p>
                  </div>
                </div>

                <input
                  ref={galleryFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: "none" }}
                  onChange={handleGalleryFiles}
                />

                <div className="device-gallery-grid">
                  {galleryList.map((url, idx) => (
                    <div key={idx} className="device-gallery-item">
                      <div className="device-gallery-thumb">
                        <img src={url} alt={`Perspective ${idx + 1}`} />
                      </div>
                      <span className="device-gallery-tag">Angle {idx + 1}</span>
                      <button
                        type="button"
                        className="device-gallery-remove-btn"
                        onClick={() => handleRemoveGalleryItem(idx)}
                        title="Remove angle"
                        aria-label="Remove angle"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {/* Add Angle Button */}
                  <button
                    type="button"
                    className="device-gallery-add-card"
                    onClick={() => galleryFileInputRef.current?.click()}
                  >
                    <div className="add-plus-icon">+</div>
                    <span>Add Angle Photo</span>
                  </button>
                </div>
              </div>

              {/* ── CARD 3: NIGHT LUME MODE PHOTO (OPTIONAL) ── */}
              <div className="editor-card-section">
                <div className="editor-card-section-head">
                  <span className="section-step-badge">3.3</span>
                  <div>
                    <h3 className="section-title">Night Lume & Luminescence (Optional)</h3>
                    <p className="section-desc">Upload a dark/glow photo to enable the interactive Night Mode preview on the product page.</p>
                  </div>
                </div>

                <input
                  ref={nightFileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleNightImageFile}
                />

                <div className="device-lume-row">
                  <div
                    className={`device-lume-box ${form.nightImage ? "has-lume" : ""}`}
                    onClick={() => nightFileInputRef.current?.click()}
                  >
                    {form.nightImage ? (
                      <div className="lume-preview-frame">
                        <img src={form.nightImage} alt="Night Lume Preview" className="lume-preview-img" />
                        <span className="lume-active-badge">✓ Night Glow Ready</span>
                      </div>
                    ) : (
                      <div className="lume-empty-prompt">
                        <span className="lume-moon-icon">🌙</span>
                        <div>
                          <strong>Upload Night Lume Glow Photo</strong>
                          <p>Click to choose a glow photo from your device</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {form.nightImage && (
                    <button
                      type="button"
                      className="editor-cancel-btn"
                      onClick={() => setForm({ ...form, nightImage: "", hasNightMode: false })}
                    >
                      Remove Lume
                    </button>
                  )}
                </div>
              </div>

              <div className="editor-step-nav-bar">
                <button
                  type="button"
                  className="editor-nav-btn editor-nav-btn--secondary"
                  onClick={() => setActiveTab("valuation")}
                >
                  ← Back to Valuation
                </button>
                <button
                  type="button"
                  className="editor-nav-btn editor-nav-btn--primary"
                  onClick={() => setActiveTab("specs")}
                >
                  Continue to Technical Specs →
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: TECHNICAL SPECS */}
          {activeTab === "specs" && (
            <div className="editor-tab-pane">
              <div className="editor-card-section">
                <div className="editor-card-section-head">
                  <span className="section-step-badge">4.1</span>
                  <div>
                    <h3 className="section-title">Caliber & Movement Engine</h3>
                    <p className="section-desc">Movement specifications displayed in the technical dossier drawer.</p>
                  </div>
                </div>

                <div className="editor-form-grid">
                  <div className="editor-field-group editor-span-2">
                    <label className="editor-label">Caliber Movement</label>
                    <input
                      type="text"
                      className="editor-input"
                      value={form.specs.movement}
                      onChange={(e) => handleSpecChange("movement", e.target.value)}
                    />
                  </div>

                  <div className="editor-field-group">
                    <label className="editor-label">Power Reserve</label>
                    <input
                      type="text"
                      className="editor-input"
                      value={form.specs.powerReserve}
                      onChange={(e) => handleSpecChange("powerReserve", e.target.value)}
                    />
                  </div>

                  <div className="editor-field-group">
                    <label className="editor-label">Frequency Beat Rate</label>
                    <input
                      type="text"
                      className="editor-input"
                      value={form.specs.frequency}
                      onChange={(e) => handleSpecChange("frequency", e.target.value)}
                    />
                  </div>

                  <div className="editor-field-group">
                    <label className="editor-label">Synthetic Jewels</label>
                    <input
                      type="text"
                      className="editor-input"
                      value={form.specs.jewels}
                      onChange={(e) => handleSpecChange("jewels", e.target.value)}
                    />
                  </div>

                  <div className="editor-field-group">
                    <label className="editor-label">Water Resistance</label>
                    <input
                      type="text"
                      className="editor-input"
                      value={form.specs.waterResistance}
                      onChange={(e) => handleSpecChange("waterResistance", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="editor-card-section">
                <div className="editor-card-section-head">
                  <span className="section-step-badge">4.2</span>
                  <div>
                    <h3 className="section-title">Case Architecture & Materials</h3>
                    <p className="section-desc">Physical dimensions, materials, and ergonomic finishing parameters.</p>
                  </div>
                </div>

                <div className="editor-form-grid">
                  <div className="editor-field-group editor-span-2">
                    <label className="editor-label">Case Metallurgy & Finish</label>
                    <input
                      type="text"
                      className="editor-input"
                      value={form.specs.caseMaterial}
                      onChange={(e) => handleSpecChange("caseMaterial", e.target.value)}
                    />
                  </div>

                  <div className="editor-field-group">
                    <label className="editor-label">Case Dimensions</label>
                    <input
                      type="text"
                      className="editor-input"
                      value={form.specs.caseDimensions}
                      onChange={(e) => handleSpecChange("caseDimensions", e.target.value)}
                    />
                  </div>

                  <div className="editor-field-group">
                    <label className="editor-label">Lug-to-Lug Distance</label>
                    <input
                      type="text"
                      className="editor-input"
                      value={form.specs.lugToLug}
                      onChange={(e) => handleSpecChange("lugToLug", e.target.value)}
                    />
                  </div>

                  <div className="editor-field-group">
                    <label className="editor-label">Crystal Glass</label>
                    <input
                      type="text"
                      className="editor-input"
                      value={form.specs.glass}
                      onChange={(e) => handleSpecChange("glass", e.target.value)}
                    />
                  </div>

                  <div className="editor-field-group">
                    <label className="editor-label">Exhibition Caseback</label>
                    <input
                      type="text"
                      className="editor-input"
                      value={form.specs.caseback}
                      onChange={(e) => handleSpecChange("caseback", e.target.value)}
                    />
                  </div>

                  <div className="editor-field-group">
                    <label className="editor-label">Strap Material</label>
                    <input
                      type="text"
                      className="editor-input"
                      value={form.specs.strap}
                      onChange={(e) => handleSpecChange("strap", e.target.value)}
                    />
                  </div>

                  <div className="editor-field-group">
                    <label className="editor-label">Clasp / Deployant</label>
                    <input
                      type="text"
                      className="editor-input"
                      value={form.specs.clasp}
                      onChange={(e) => handleSpecChange("clasp", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="editor-card-section">
                <div className="editor-card-section-head">
                  <span className="section-step-badge">4.3</span>
                  <div>
                    <h3 className="section-title">Complications & Horological Highlights</h3>
                    <p className="section-desc">Key complications registered to this reference.</p>
                  </div>
                </div>

                <div className="complications-builder">
                  <div className="complication-input-bar">
                    <input
                      type="text"
                      className="editor-input"
                      placeholder="Type a custom complication or tap a preset below..."
                      value={complicationInput}
                      onChange={(e) => setComplicationInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddComplication();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="editor-add-pill-btn"
                      onClick={() => handleAddComplication()}
                    >
                      + Add
                    </button>
                  </div>

                  <div className="complication-preset-chips">
                    {COMPLICATION_SUGGESTIONS.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        className="complication-suggestion-pill"
                        onClick={() => handleAddComplication(sug)}
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>

                  <div className="active-complications-container">
                    {(form.specs.complications || []).map((comp, idx) => (
                      <div key={idx} className="active-complication-tag">
                        <span>✦ {comp}</span>
                        <button
                          type="button"
                          className="complication-tag-remove"
                          onClick={() => handleRemoveComplication(idx)}
                          aria-label={`Remove ${comp}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="editor-step-nav-bar">
                <button
                  type="button"
                  className="editor-nav-btn editor-nav-btn--secondary"
                  onClick={() => setActiveTab("media")}
                >
                  ← Back to Imagery
                </button>
                <button
                  type="button"
                  className="editor-nav-btn editor-nav-btn--primary"
                  onClick={() => setActiveTab("preview")}
                >
                  Continue to Live Preview →
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: LIVE CARD PREVIEW */}
          {activeTab === "preview" && (
            <div className="editor-tab-pane">
              <div className="editor-card-section">
                <div className="editor-card-section-head">
                  <span className="section-step-badge">5.1</span>
                  <div>
                    <h3 className="section-title">Live Storefront Card Inspection</h3>
                    <p className="section-desc">Review the rendered card and specifications dossier summary before saving.</p>
                  </div>
                </div>

                <div className="editor-live-preview-grid">
                  <div className="preview-card-frame">
                    <article className="apple-watch-card" style={{ maxWidth: "340px", margin: "0 auto" }}>
                      <div className="card-header-meta">
                        <span className="card-series-tag">{form.collectionName}</span>
                        <span className="card-sku-code">{form.sku || "HBR-REF"}</span>
                      </div>

                      <div className="card-media-stage">
                        {form.image ? (
                          <img
                            src={form.image}
                            alt={form.name}
                            className="card-watch-photo"
                            onError={(e) => {
                              e.target.src = "/watch-astroworld-moon-rosegold-front-transparent.webp";
                            }}
                          />
                        ) : (
                          <div style={{ color: "#71717a", fontSize: "12px", textAlign: "center", padding: "40px 0" }}>
                            No photo uploaded
                          </div>
                        )}
                      </div>

                      <div className="card-body-content">
                        <h3 className="card-watch-title">{form.name || "Untitled Timepiece"}</h3>
                        <p className="card-watch-tagline">{form.subtitle}</p>

                        <div className="card-feature-chips">
                          <span className="feature-chip">
                            {form.specs?.caseDimensions ? form.specs.caseDimensions.split(" ")[0] : "44mm"}
                          </span>
                          <span className="feature-chip">
                            {form.specs?.powerReserve ? form.specs.powerReserve.split(" ")[0] : "72H"}
                          </span>
                          <span className="feature-chip">
                            {form.specs?.waterResistance ? form.specs.waterResistance.split(" ")[0] : "50M"}
                          </span>
                        </div>

                        <div className="card-pricing-meta-row">
                          <div className="card-price-display">
                            <span className="price-main">{form.price || "₹1,25,000"}</span>
                            <span className="price-usd">{form.priceUsd || "$1,500"}</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  </div>

                  <div className="preview-dossier-sidebar">
                    <div className="dossier-summary-box">
                      <h4 className="dossier-box-title">Dossier Parameters</h4>
                      <div className="dossier-summary-rows">
                        <div className="dossier-summary-item">
                          <span>Reference Model</span>
                          <strong>{form.name || "—"}</strong>
                        </div>
                        <div className="dossier-summary-item">
                          <span>SKU Identifier</span>
                          <code className="dossier-code">{form.sku || "—"}</code>
                        </div>
                        <div className="dossier-summary-item">
                          <span>Collection Series</span>
                          <strong>{form.collectionName}</strong>
                        </div>
                        <div className="dossier-summary-item">
                          <span>Retail Valuation</span>
                          <strong className="dossier-price">{form.price} ({form.priceUsd})</strong>
                        </div>
                        <div className="dossier-summary-item">
                          <span>Vault Allocation</span>
                          <strong style={{ color: form.stock > 0 ? "#30d158" : "#f87171" }}>
                            {form.stock} units in vault
                          </strong>
                        </div>
                        <div className="dossier-summary-item">
                          <span>Catalog Status</span>
                          <strong style={{ color: form.isActive ? "#30d158" : "#8e8e93" }}>
                            {form.isActive ? "● Active in Boutique" : "○ Hidden"}
                          </strong>
                        </div>
                        <div className="dossier-summary-item">
                          <span>Caliber Movement</span>
                          <strong>{form.specs.movement}</strong>
                        </div>
                        <div className="dossier-summary-item">
                          <span>Complications</span>
                          <strong>{(form.specs.complications || []).length} registered</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="editor-step-nav-bar">
                <button
                  type="button"
                  className="editor-nav-btn editor-nav-btn--secondary"
                  onClick={() => setActiveTab("specs")}
                >
                  ← Back to Specs
                </button>
                <button
                  type="button"
                  className="editor-save-btn"
                  onClick={handleSubmit}
                  style={{ padding: "12px 28px", fontSize: "14px" }}
                >
                  ✦ Save & Publish Reference
                </button>
              </div>
            </div>
          )}

        </div>

        {/* ── MODAL FOOTER ── */}
        <div className="watch-editor-footer">
          {isEditMode && onDeleteRequest ? (
            <button
              type="button"
              className="editor-delete-action-btn"
              onClick={() => onDeleteRequest(initialData)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span>Archive Reference</span>
            </button>
          ) : (
            <div />
          )}

          <div className="footer-right">
            <button type="button" className="editor-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="editor-save-btn" onClick={handleSubmit}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              <span>{isEditMode ? "Save Changes" : "Create Timepiece"}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
