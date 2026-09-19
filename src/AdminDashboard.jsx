import React, { useState, useEffect, useMemo } from "react";
import {
  ordersService,
  inventoryService,
  cartService,
  draftOrdersService,
  abandonedCheckoutsService,
  discountsService,
  profilesService,
  teamAuditService,
  calculateEan13,
  enrichOrderItemWithSkuEan,
  safeStorage,
  sortCatalogStably,
  isDemoEmail,
  isDemoOrder,
} from "./supabaseClient";
import { PRODUCTS_DATA, CATEGORIES } from "./productsData";
import { PROMO_CODES, useStore } from "./StoreContext";
import { HanboroLogo } from "./HanboroLogo";
import { WatchEditorModal } from "./WatchEditorModal";
import { DeleteWatchModal } from "./DeleteWatchModal";
import {
  IconHome,
  IconOrders,
  IconProducts,
  IconCustomers,
  IconDiscounts,
  IconMarkets,
  IconAnalytics,
  IconAudit,
  IconStorefront,
  IconWhatsApp,
  IconSettings,
  IconSearch,
  IconSync,
  IconFilter,
  IconExport,
  IconPlus,
  IconExternalLink,
  IconEye,
  IconTrash,
  IconPrinter,
  IconBarcode,
  IconInvoice,
  IconCopy,
  IconGripVertical,
  IconGrid,
  IconList,
  IconArrowUp,
  IconArrowDown,
  IconArrowTop,
  IconArrowBottom,
} from "./AdminIcons";

// Clean Production State: No mock seeds. All orders, abandoned leads, and customer profiles start at 0.

function AdminLoginGate({ onNavigateHome, onLogin }) {
  const [email, setEmail] = useState("connect@hanborowatches.in");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const cleanEmail = email.trim();
    const cleanPass = password.trim();
    if (!cleanEmail || !cleanPass) {
      setError("Please provide both your administrator email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await onLogin({ email: cleanEmail, password: cleanPass });
      if (res?.error) {
        setError(res.error || "Authentication failed. Please verify credentials.");
      }
    } catch (err) {
      setError(err?.message || "Unexpected authentication error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sp-login-gate" data-lenis-prevent="true">
      <div className="sp-login-card">
        <div className="sp-login-header">
          <div className="sp-login-emblem">
            <HanboroLogo size={36} theme="light" />
            <span className="sp-login-tagline">HANBORO Staff Portal</span>
          </div>
          <h1 className="sp-login-title">Admin Sign In</h1>
          <p className="sp-login-subtitle">
            Authorized administrators and staff only.
          </p>
        </div>

        {error && (
          <div className="sp-login-error" role="alert">
            {error}
          </div>
        )}

        <form className="sp-login-form" onSubmit={handleSubmit}>
          <div className="sp-login-field">
            <label htmlFor="sp-admin-email">Email</label>
            <input
              id="sp-admin-email"
              type="email"
              className="sp-login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="connect@hanborowatches.in"
              autoComplete="username"
              required
            />
          </div>

          <div className="sp-login-field">
            <label htmlFor="sp-admin-password">Password</label>
            <div className="sp-login-password-wrap">
              <input
                id="sp-admin-password"
                type={showPassword ? "text" : "password"}
                className="sp-login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                autoFocus
                required
              />
              <button
                type="button"
                className="sp-login-pass-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="sp-login-submit-btn"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In →"}
          </button>
        </form>

        <div className="sp-login-footer">
          <button
            type="button"
            className="sp-login-back-btn"
            onClick={onNavigateHome}
          >
            ← Back to Store
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard({ onNavigateHome }) {
  const {
    user,
    isAdmin,
    login,
    logout,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
    reorderProducts,
    resetProductOrder,
    resetProductsToDefault,
  } = useStore();

  // If user is not authenticated as admin, show dedicated executive login gate
  if (!isAdmin) {
    return <AdminLoginGate onNavigateHome={onNavigateHome} onLogin={login} />;
  }

  // Active Tab navigation matching Shopify: 'home' | 'orders' | 'drafts' | 'abandoned' | 'products' | 'customers' | 'analytics' | 'discounts' | 'whatsapp' | 'settings'
  const [activeTab, setActiveTabState] = useState(() => {
    const hash = (typeof window !== "undefined" ? window.location.hash : "") || "";
    if (hash.includes("abandoned")) return "abandoned";
    if (hash.includes("drafts")) return "drafts";
    if (hash.includes("orders")) return "orders";
    if (hash.includes("products") || hash.includes("inventory")) return "products";
    if (hash.includes("customers")) return "customers";
    if (hash.includes("analytics")) return "analytics";
    if (hash.includes("audit")) return "audit";
    if (hash.includes("discounts")) return "discounts";
    if (hash.includes("whatsapp")) return "whatsapp";
    if (hash.includes("settings")) return "settings";
    try {
      const saved = localStorage.getItem("hanboro_admin_tab");
      if (saved && saved !== "growth" && saved !== "content") return saved;
    } catch {}
    return "products"; // Default to Products view so SKU listings are immediate
  });

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem("hanboro_admin_tab", tab);
    } catch {}
    if (typeof window !== "undefined" && window.location.hash.startsWith("#admin")) {
      window.history.replaceState(null, "", `#admin/${tab}`);
    }
  };

  // Theme Mode: "shopify-light" (Polaris clean light matching screenshots) vs "luxury-dark"
  const [adminTheme, setAdminTheme] = useState(() => {
    const saved = localStorage.getItem("hanboro_admin_theme");
    return saved === "luxury-dark" ? "luxury-dark" : "shopify-light";
  });

  const toggleTheme = () => {
    const next = adminTheme === "shopify-light" ? "luxury-dark" : "shopify-light";
    setAdminTheme(next);
    localStorage.setItem("hanboro_admin_theme", next);
  };

  // Orders State (Pure Live Orders)
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusTab, setOrderStatusTab] = useState("all"); // "all" | "unfulfilled" | "unpaid" | "open" | "closed"
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [inspectingOrder, setInspectingOrder] = useState(null);

  // Abandoned Checkouts State (Pure Live Leads)
  const [abandonedCheckouts, setAbandonedCheckouts] = useState([]);
  const [abandonedSearch, setAbandonedSearch] = useState("");
  const [selectedCheckouts, setSelectedCheckouts] = useState(new Set());
  const [inspectingCheckout, setInspectingCheckout] = useState(null);

  // Drafts State (Pure Live Drafts)
  const [draftOrders, setDraftOrders] = useState([]);
  const [showCreateDraftModal, setShowCreateDraftModal] = useState(false);
  const [draftFormData, setDraftFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    productId: "",
    customPrice: "",
    discountRate: "",
    deliveryMethod: "Standard (Prepaid)",
    paymentMethod: "Prepaid UPI / Card",
    notes: ""
  });

  // Products / Inventory State
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("ALL");
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [editorModalOpen, setEditorModalOpen] = useState(false);
  const [editingWatch, setEditingWatch] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingWatch, setDeletingWatch] = useState(null);

  // ── WATCH MODEL DRAG & DROP REORDERING STATE ──
  const [productViewMode, setProductViewMode] = useState("table"); // "table" | "arrange"
  const [draggedWatchIndex, setDraggedWatchIndex] = useState(null);
  const [dragOverWatchIndex, setDragOverWatchIndex] = useState(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [orderSaveSuccess, setOrderSaveSuccess] = useState(false);

  const handleReorderWatch = async (fromIdx, toIdx) => {
    if (fromIdx === toIdx || fromIdx === null || toIdx === null) return;
    const currentList = [...filteredProducts];
    if (fromIdx < 0 || fromIdx >= currentList.length || toIdx < 0 || toIdx >= currentList.length) return;

    const allMaster = Array.isArray(products) && products.length > 0 ? [...products] : [...PRODUCTS_DATA];
    let nextFullList;

    if (productCategoryFilter === "ALL" && !productSearch.trim()) {
      const [movedItem] = currentList.splice(fromIdx, 1);
      currentList.splice(toIdx, 0, movedItem);
      nextFullList = currentList;
    } else {
      // Relative movement within full master catalog when filtered
      const moved = currentList[fromIdx];
      const target = currentList[toIdx];
      const movedId = String(moved.id || moved.sku).toLowerCase();
      const targetId = String(target.id || target.sku).toLowerCase();

      const masterCopy = [...allMaster];
      const masterFromIdx = masterCopy.findIndex((p) => String(p.id || p.sku).toLowerCase() === movedId);
      if (masterFromIdx >= 0) {
        const [extracted] = masterCopy.splice(masterFromIdx, 1);
        const masterToIdx = masterCopy.findIndex((p) => String(p.id || p.sku).toLowerCase() === targetId);
        if (masterToIdx >= 0) {
          const insertIdx = fromIdx < toIdx ? masterToIdx + 1 : masterToIdx;
          masterCopy.splice(insertIdx, 0, extracted);
        } else {
          masterCopy.splice(toIdx, 0, extracted);
        }
      }
      nextFullList = masterCopy;
    }

    setIsSavingOrder(true);
    try {
      if (reorderProducts) {
        await reorderProducts(nextFullList);
      }
      setOrderSaveSuccess(true);
      setTimeout(() => setOrderSaveSuccess(false), 2600);
    } catch (e) {
      console.error("Failed to persist watch order:", e);
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleWatchDragStart = (e, index) => {
    setDraggedWatchIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleWatchDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverWatchIndex !== index) {
      setDragOverWatchIndex(index);
    }
  };

  const handleWatchDrop = (e, dropIndex) => {
    e.preventDefault();
    const fromIdx = draggedWatchIndex !== null ? draggedWatchIndex : parseInt(e.dataTransfer.getData("text/plain"), 10);
    setDraggedWatchIndex(null);
    setDragOverWatchIndex(null);
    if (!isNaN(fromIdx) && fromIdx !== dropIndex) {
      handleReorderWatch(fromIdx, dropIndex);
    }
  };

  const handleWatchDragEnd = () => {
    setDraggedWatchIndex(null);
    setDragOverWatchIndex(null);
  };

  // ── CUSTOMERS & PROFILES DATABASE STATE (Pure Live Customer Profiles) ──
  const [profiles, setProfiles] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerVipFilter, setCustomerVipFilter] = useState("all"); // "all" | "vip" | "repeat" | "high_value"
  const [selectedCustomerDossier, setSelectedCustomerDossier] = useState(null);
  const [invoiceModalOrder, setInvoiceModalOrder] = useState(null);
  const [editingNotesEmail, setEditingNotesEmail] = useState(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopyText = (text, key) => {
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(String(text));
      }
    } catch {}
    setCopiedKey(key);
    showToast(`Copied ${key || "text"} to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Indian currency amount in words converter
  const amountToWords = (num) => {
    const a = [
      "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
      "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
    ];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    const cleanNum = Math.round(Number(num) || 0);
    if (cleanNum === 0) return "Zero Rupees Only";

    function inWords(n) {
      if (n < 20) return a[n];
      const digit = n % 10;
      if (n < 100) return b[Math.floor(n / 10)] + (digit ? " " + a[digit] : " ");
      if (n < 1000) return a[Math.floor(n / 100)] + "Hundred " + (n % 100 === 0 ? "" : inWords(n % 100));
      if (n < 100000) return inWords(Math.floor(n / 1000)) + "Thousand " + (n % 1000 === 0 ? "" : inWords(n % 1000));
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + "Lakh " + (n % 100000 === 0 ? "" : inWords(n % 100000));
      return inWords(Math.floor(n / 10000000)) + "Crore " + (n % 10000000 === 0 ? "" : inWords(n % 10000000));
    }

    return (inWords(cleanNum).trim() + " Rupees Only");
  };

  // High-precision authentic SVG barcode stripes visualization
  const BarcodeStripeGraphic = ({ ean, height = 30, showNumber = true }) => {
    const cleanEan = String(ean || "8908012010014").replace(/[^\d]/g, "");
    const stripes = [];
    for (let i = 0; i < cleanEan.length; i++) {
      const d = parseInt(cleanEan[i], 10);
      stripes.push({ width: (d % 3) + 1.2, gap: ((d + 1) % 2) + 1.1 });
    }
    return (
      <div className="sp-barcode-container" title={`EAN-13: ${cleanEan}`}>
        <svg height={height} viewBox="0 0 160 34" className="sp-barcode-svg" preserveAspectRatio="none">
          <rect x="2" y="0" width="2" height="34" fill="#0f172a" />
          <rect x="6" y="0" width="2" height="34" fill="#0f172a" />
          {stripes.map((s, idx) => {
            const x = 12 + idx * 10;
            return (
              <g key={idx}>
                <rect x={x} y="0" width={s.width} height={idx % 4 === 0 ? "34" : "30"} fill="#0f172a" />
                <rect x={x + s.width + s.gap} y="0" width={s.width * 0.8} height="30" fill="#0f172a" />
              </g>
            );
          })}
          <rect x="152" y="0" width="2" height="34" fill="#0f172a" />
          <rect x="156" y="0" width="2" height="34" fill="#0f172a" />
        </svg>
        {showNumber && <span className="sp-barcode-digits">{cleanEan}</span>}
      </div>
    );
  };

  // Save concierge profile notes handler
  const handleSaveCustomerNotes = async (email, newNotes) => {
    const cleanEmail = email.toLowerCase().trim();
    const updated = await profilesService.upsertProfile({
      email: cleanEmail,
      notes: newNotes,
    });
    setProfiles((prev) =>
      prev.map((p) => (p.email?.toLowerCase() === cleanEmail ? { ...p, notes: newNotes } : p))
    );
    if (selectedCustomerDossier && selectedCustomerDossier.email?.toLowerCase() === cleanEmail) {
      setSelectedCustomerDossier((prev) => ({ ...prev, notes: newNotes }));
    }
    setEditingNotesEmail(null);
    showToast("Customer dossier notes updated in database");
  };

  // ── TEAM AUDIT LEDGER STATE (Real-Time Atelier Activity) ──
  const [auditLogs, setAuditLogs] = useState(() => teamAuditService.getAuditLogs());
  const [auditSearch, setAuditSearch] = useState("");
  const [auditCategoryFilter, setAuditCategoryFilter] = useState("all");
  const [inspectingAuditLog, setInspectingAuditLog] = useState(null);
  const [showClearAuditModal, setShowClearAuditModal] = useState(false);

  useEffect(() => {
    const unsub = teamAuditService.subscribe((logs) => {
      setAuditLogs(logs);
    });
    return () => unsub();
  }, []);

  const handleExportAuditJson = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `hanboro-team-audit-ledger-${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Exported Team Audit Ledger (JSON)");
    } catch {
      showToast("Could not export audit ledger");
    }
  };

  const handleExportAuditCsv = () => {
    try {
      const headers = ["ID", "Timestamp", "Category", "Action", "Actor", "Actor Role", "Target", "Summary"];
      const rows = auditLogs.map((log) => [
        `"${String(log.id || "").replace(/"/g, '""')}"`,
        `"${String(log.timestamp || "").replace(/"/g, '""')}"`,
        `"${String(log.category || "").replace(/"/g, '""')}"`,
        `"${String(log.action || "").replace(/"/g, '""')}"`,
        `"${String(log.actor || "").replace(/"/g, '""')}"`,
        `"${String(log.actorRole || "").replace(/"/g, '""')}"`,
        `"${String(log.target || "").replace(/"/g, '""')}"`,
        `"${String(log.summary || "").replace(/"/g, '""')}"`,
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `hanboro-team-audit-ledger-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast("Exported Team Audit Ledger (CSV)");
    } catch {
      showToast("Could not export audit CSV");
    }
  };

  const handleClearAuditLedger = () => {
    const resetLogs = teamAuditService.clearAuditLogs();
    setAuditLogs(resetLogs);
    setShowClearAuditModal(false);
    showToast("Audit ledger history reset. Reset event recorded.");
  };

  // Filtered audit logs
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (auditCategoryFilter !== "all" && String(log.category || "").toLowerCase() !== auditCategoryFilter.toLowerCase()) {
        return false;
      }
      if (auditSearch.trim()) {
        const query = auditSearch.toLowerCase();
        const matchesSummary = String(log.summary || "").toLowerCase().includes(query);
        const matchesActor = String(log.actor || "").toLowerCase().includes(query);
        const matchesAction = String(log.action || "").toLowerCase().includes(query);
        const matchesTarget = String(log.target || "").toLowerCase().includes(query);
        const matchesCat = String(log.category || "").toLowerCase().includes(query);
        return matchesSummary || matchesActor || matchesAction || matchesTarget || matchesCat;
      }
      return true;
    });
  }, [auditLogs, auditCategoryFilter, auditSearch]);

  const auditStats = useMemo(() => {
    const total = auditLogs.length;
    const catalogue = auditLogs.filter((l) => l.category === "Catalogue").length;
    const orders = auditLogs.filter((l) => l.category === "Orders").length;
    const customers = auditLogs.filter((l) => l.category === "Customers").length;
    const discounts = auditLogs.filter((l) => l.category === "Discounts").length;
    const security = auditLogs.filter((l) => l.category === "Security").length;
    return { total, catalogue, orders, customers, discounts, security };
  }, [auditLogs]);

  const formatAuditTime = (isoString) => {
    if (!isoString) return { dateStr: "—", timeStr: "—", relativeStr: "—" };
    try {
      const d = new Date(isoString);
      const dateStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      const timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
      const diffSec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
      let relativeStr = "Just now";
      if (diffSec >= 86400) relativeStr = `${Math.floor(diffSec / 86400)}d ago`;
      else if (diffSec >= 3600) relativeStr = `${Math.floor(diffSec / 3600)}h ago`;
      else if (diffSec >= 60) relativeStr = `${Math.floor(diffSec / 60)}m ago`;
      else if (diffSec > 5) relativeStr = `${diffSec}s ago`;
      return { dateStr, timeStr, relativeStr };
    } catch {
      return { dateStr: isoString, timeStr: "", relativeStr: "" };
    }
  };

  const formatOrderTimestamp = (isoString) => {
    if (!isoString) return { dateStr: "Just now", timeStr: "", fullStr: "Just now" };
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return { dateStr: String(isoString), timeStr: "", fullStr: String(isoString) };
      const dateStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      const timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
      return {
        dateStr,
        timeStr,
        fullStr: `${dateStr}, ${timeStr}`,
      };
    } catch {
      return { dateStr: String(isoString), timeStr: "", fullStr: String(isoString) };
    }
  };

  // Discounts State
  const [customPromos, setCustomPromos] = useState(() => {
    try {
      const cached = localStorage.getItem("hanboro_custom_promos");
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoDiscountInput, setPromoDiscountInput] = useState("15");
  const [promoTypeInput, setPromoTypeInput] = useState("percent");
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState("30d");

  // Notifications & Feedback
  const [toastMessage, setToastMessage] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // WhatsApp quick-recovery message generator
  const triggerWhatsAppRecovery = (checkout) => {
    let cleanPhone = (checkout.customerPhone || "").replace(/[^\d]/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    } else if (!cleanPhone) {
      cleanPhone = "918882069334";
    }
    const primaryItem = checkout.items?.[0]?.name || "HANBORO Luxury Timepiece";
    const text = encodeURIComponent(
      `Hello ${checkout.customerName || "Valued Client"},\n\nWe noticed you were selecting the ${primaryItem} at HANBORO Watches.\n\nTo ensure your allocation is secured, our boutique concierge has activated an exclusive 10% privilege voucher (CODE: VIP10) for you:\n\nAcquisition Reference: ${checkout.checkoutNumber}\nTotal: ₹${Number(checkout.totalPrice).toLocaleString("en-IN")}\nWebsite: https://hanborowatches.in/#cart\n\nMay we assist you with personal delivery or verification?\n— HANBORO VIP Concierge (+91 88820 69334)`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
    showToast(`WhatsApp recovery nudge opened for ${checkout.customerName || "Client"}`);
  };

  // WhatsApp customer order update
  const triggerWhatsAppOrderUpdate = (order) => {
    let cleanPhone = (order.customer_phone || "").replace(/[^\d]/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    } else if (!cleanPhone) {
      cleanPhone = "918882069334";
    }
    const text = encodeURIComponent(
      `Hello ${order.customer_name},\n\nUpdate regarding your HANBORO timepiece order ${order.order_ref}:\nStatus: ${order.order_status || "Processing"}\nPayment: ${order.payment_status || "Paid"}\nTracking Airway Bill: ${order.tracking_number || "Being assigned"}\n\nOur concierge is at your service.\n— HANBORO Watches (+91 88820 69334)`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  };

  // Initial Data Sync from Supabase & Local DB (Pure Live Telemetry)
  const loadAllAdminData = async () => {
    setIsSyncing(true);
    setOrdersLoading(true);
    try {
      const [loadedOrders, loadedAbandoned, loadedCarts, loadedDrafts, loadedDiscounts, loadedProfiles] = await Promise.all([
        ordersService.fetchOrders().catch(() => []),
        abandonedCheckoutsService.fetchAbandonedCheckouts().catch(() => []),
        cartService.fetchAllLiveCarts().catch(() => []),
        draftOrdersService.fetchDraftOrders([]).catch(() => []),
        discountsService.fetchDiscounts(PROMO_CODES).catch(() => PROMO_CODES),
        profilesService.fetchProfiles().catch(() => []),
      ]);

      setProfiles(loadedProfiles || []);
      setOrders(loadedOrders || []);
      setDraftOrders(loadedDrafts || []);

      if (loadedDiscounts) {
        setCustomPromos(loadedDiscounts);
      }

      // Pure recorded checkout leads (no synthetic phantom cart injections)
      setAbandonedCheckouts(loadedAbandoned || []);
    } catch (err) {
      console.warn("Data sync fallback active:", err);
    } finally {
      setIsSyncing(false);
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  // Filtered Orders List (Shopify style)
  const filteredOrders = useMemo(() => {
    const list = orders.filter((o) => {
      // Tab filter
      if (orderStatusTab === "unfulfilled" && (o.fulfillment_status === "Fulfilled" || o.fulfillment_status === "Not required")) return false;
      if (orderStatusTab === "unpaid" && o.payment_status === "Paid") return false;
      if (orderStatusTab === "open" && o.order_status === "Delivered") return false;
      if (orderStatusTab === "closed" && o.order_status !== "Delivered") return false;

      // Search filter
      const q = orderSearch.toLowerCase().trim();
      if (!q) return true;
      const dateInfo = formatOrderTimestamp(o.created_at);
      return (
        o.order_ref?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.customer_email?.toLowerCase().includes(q) ||
        o.customer_phone?.includes(q) ||
        o.payment_status?.toLowerCase().includes(q) ||
        o.fulfillment_status?.toLowerCase().includes(q) ||
        o.tracking_number?.toLowerCase().includes(q) ||
        dateInfo.fullStr?.toLowerCase().includes(q) ||
        (o.tags && o.tags.some((t) => t.toLowerCase().includes(q)))
      );
    });

    // Ensure newest orders are prioritized at top by timestamp
    return list.slice().sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [orders, orderStatusTab, orderSearch]);

  // Filtered Abandoned Checkouts List (Screenshot 1)
  const filteredAbandoned = useMemo(() => {
    return abandonedCheckouts.filter((c) => {
      const q = abandonedSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        c.checkoutNumber?.toLowerCase().includes(q) ||
        c.customerName?.toLowerCase().includes(q) ||
        c.customerEmail?.toLowerCase().includes(q) ||
        c.customerPhone?.includes(q) ||
        c.region?.toLowerCase().includes(q) ||
        c.recoveryStatus?.toLowerCase().includes(q)
      );
    });
  }, [abandonedCheckouts, abandonedSearch]);

  // ── COMPREHENSIVE CUSTOMER PROFILE DATABASE (WITH WATCH ORDER HISTORY & SKU/EAN ENRICHMENT) ──
  const customersDatabase = useMemo(() => {
    const map = {};

    // 1. Initialize from Registered Customer Profiles (excluding administrative accounts & demo profiles)
    (profiles || []).forEach((p) => {
      const emailKey = (p.email || "").toLowerCase().trim();
      if (!emailKey || p.role === "admin" || emailKey === "connect@hanborowatches.in" || isDemoEmail(emailKey)) return;
      map[emailKey] = {
        id: p.id || `prof-${emailKey.replace(/[^a-z0-9]/g, "-")}`,
        name: p.full_name || p.fullName || p.name || emailKey.split("@")[0],
        email: emailKey,
        phone: p.phone || "",
        city: p.shipping_info?.city || "India",
        state: p.shipping_info?.state || "",
        pin: p.shipping_info?.pin || p.shipping_info?.pincode || "",
        address: p.shipping_info?.address || "",
        country: p.shipping_info?.country || "India",
        vip_tier: (p.vip_tier && !p.vip_tier.toLowerCase().includes("patron")) ? p.vip_tier : "Customer",
        role: p.role || "customer",
        notes: (p.notes && !p.notes.toLowerCase().includes("patron")) ? p.notes : "Registered customer profile.",
        registeredAt: p.created_at || new Date().toISOString(),
        totalSpent: 0,
        ordersCount: 0,
        orders: [],
        lastOrderDate: null,
      };
    });

    // 2. Associate Real Storefront Orders (excluding demo orders)
    (orders || []).forEach((o) => {
      if (isDemoOrder(o)) return;
      const emailKey = (o.customer_email || "").toLowerCase().trim();
      if (!emailKey || isDemoEmail(emailKey)) return;
      if (!map[emailKey]) {
        map[emailKey] = {
          id: `cust-${emailKey.replace(/[^a-z0-9]/g, "-")}`,
          name: o.customer_name || "Valued Client",
          email: o.customer_email || emailKey,
          phone: o.customer_phone || "",
          city: o.shipping_address?.city || "India",
          state: o.shipping_address?.state || "",
          pin: o.shipping_address?.pin || o.shipping_address?.pincode || "",
          address: o.shipping_address?.address || "",
          country: o.shipping_address?.country || "India",
          vip_tier: o.total_amount >= 50000 ? "VIP Client" : "Customer",
          role: "customer",
          notes: "Storefront customer with confirmed order.",
          registeredAt: o.created_at,
          totalSpent: 0,
          ordersCount: 0,
          orders: [],
          lastOrderDate: null,
        };
      }

      // Enrich items with verified SKU and EAN barcode numbers
      const enrichedOrder = {
        ...o,
        items: (o.items || []).map((it) => enrichOrderItemWithSkuEan(it, products || PRODUCTS_DATA)),
      };

      map[emailKey].orders.push(enrichedOrder);
      map[emailKey].ordersCount += 1;
      map[emailKey].totalSpent += Number(o.total_amount) || 0;

      if (!map[emailKey].lastOrderDate || new Date(o.created_at) > new Date(map[emailKey].lastOrderDate)) {
        map[emailKey].lastOrderDate = o.created_at;
      }
      if (o.shipping_address?.city && (map[emailKey].city === "India" || !map[emailKey].city)) {
        map[emailKey].city = o.shipping_address.city;
      }
      if (o.shipping_address?.address && !map[emailKey].address) {
        map[emailKey].address = o.shipping_address.address;
      }
      if (o.shipping_address?.state && !map[emailKey].state) {
        map[emailKey].state = o.shipping_address.state;
      }
      if ((o.shipping_address?.pin || o.shipping_address?.pincode) && !map[emailKey].pin) {
        map[emailKey].pin = o.shipping_address.pin || o.shipping_address.pincode;
      }
      if (o.customer_phone && !map[emailKey].phone) {
        map[emailKey].phone = o.customer_phone;
      }
    });

    // 3. Include unique Real Abandoned Checkouts as prospective clients (only genuine customer emails)
    (abandonedCheckouts || []).forEach((c) => {
      const emailKey = (c.customerEmail || "").toLowerCase().trim();
      if (
        !emailKey ||
        isDemoEmail(emailKey) ||
        emailKey === "shopper@hanborowatches.in" ||
        c.customerName === "Active Guest Shopper" ||
        c.customerName?.toLowerCase().includes("demo")
      ) {
        return;
      }
      if (!map[emailKey]) {
        const ship = c.shippingAddress || {};
        map[emailKey] = {
          id: `chk-cust-${emailKey.replace(/[^a-z0-9]/g, "-")}`,
          name: c.customerName || "Prospective Client",
          email: emailKey,
          phone: c.customerPhone || "",
          city: ship.city || c.region || "India",
          state: ship.state || "",
          pin: ship.pincode || ship.pin || "",
          address: ship.address || "",
          country: "India",
          vip_tier: "Prospect",
          role: "prospect",
          notes: "Cart checkout initiated.",
          registeredAt: c.createdAt,
          totalSpent: 0,
          ordersCount: 0,
          orders: [],
          lastOrderDate: null,
        };
      }
    });

    return Object.values(map).sort((a, b) => b.totalSpent - a.totalSpent || b.ordersCount - a.ordersCount);
  }, [profiles, orders, abandonedCheckouts, products]);

  // Alias for backward compatibility
  const customersList = customersDatabase;

  // Filtered Customers based on Search & VIP Filter
  const filteredCustomers = useMemo(() => {
    return customersDatabase.filter((c) => {
      // 1. VIP Filter
      if (customerVipFilter === "vip") {
        const tier = c.vip_tier?.toLowerCase() || "";
        if (!tier.includes("vip") && !tier.includes("diamond") && c.ordersCount < 2 && c.totalSpent < 40000) {
          return false;
        }
      } else if (customerVipFilter === "repeat") {
        if (c.ordersCount < 2) return false;
      } else if (customerVipFilter === "high_value") {
        if (c.totalSpent < 40000) return false;
      }

      // 2. Query matching (Name, Email, Phone, City, Order Ref, Watch SKU ID, Watch EAN)
      const q = customerSearch.toLowerCase().trim();
      if (!q) return true;

      const basicMatch =
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.state?.toLowerCase().includes(q) ||
        c.pin?.includes(q) ||
        c.vip_tier?.toLowerCase().includes(q);

      if (basicMatch) return true;

      // Check if query matches any order reference, watch SKU ID, or EAN barcode
      return (c.orders || []).some((o) => {
        if (o.order_ref?.toLowerCase().includes(q)) return true;
        if (o.tracking_number?.toLowerCase().includes(q)) return true;
        return (o.items || []).some(
          (it) =>
            it.name?.toLowerCase().includes(q) ||
            it.sku?.toLowerCase().includes(q) ||
            it.ean?.includes(q)
        );
      });
    });
  }, [customersDatabase, customerSearch, customerVipFilter]);

  // Customer Profile KPIs
  const customerKpis = useMemo(() => {
    const totalProfiles = customersDatabase.length;
    const totalOrders = customersDatabase.reduce((sum, c) => sum + c.ordersCount, 0);
    const totalLtv = customersDatabase.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgLtv = totalProfiles > 0 ? Math.round(totalLtv / totalProfiles) : 0;
    const vipCount = customersDatabase.filter(
      (c) =>
        c.vip_tier?.toLowerCase().includes("vip") ||
        c.vip_tier?.toLowerCase().includes("diamond") ||
        c.ordersCount > 1 ||
        c.totalSpent >= 40000
    ).length;

    return { totalProfiles, totalOrders, totalLtv, avgLtv, vipCount };
  }, [customersDatabase]);

  // Dynamic Categories including custom collections
  const availableProductCategories = useMemo(() => {
    const list = [...CATEGORIES];
    const knownIds = new Set(list.map((c) => c.id));
    const allProds = Array.isArray(products) && products.length > 0 ? products : PRODUCTS_DATA;
    allProds.forEach((p) => {
      if (p.collection && !knownIds.has(p.collection)) {
        knownIds.add(p.collection);
        list.push({
          id: p.collection,
          label: p.collectionName || p.collection.replace(/_/g, " "),
        });
      }
    });
    return list;
  }, [products]);

  // Filtered Products Catalog
  const filteredProducts = useMemo(() => {
    let list = Array.isArray(products) && products.length > 0 ? products : PRODUCTS_DATA;
    if (productCategoryFilter !== "ALL") {
      list = list.filter((p) => p.collection === productCategoryFilter);
    }
    const q = productSearch.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.modelNumber?.toLowerCase().includes(q) ||
          p.specs?.modelNumber?.toLowerCase().includes(q) ||
          p.collection?.toLowerCase().includes(q) ||
          p.collectionName?.toLowerCase().includes(q) ||
          p.subtitle?.toLowerCase().includes(q) ||
          p.id?.toLowerCase().includes(q) ||
          p.tag?.toLowerCase().includes(q) ||
          p.specs?.movement?.toLowerCase().includes(q)
      );
    }
    return sortCatalogStably(list);
  }, [products, productCategoryFilter, productSearch]);

  // Calculations for Shopify Analytics KPIs
  const analytics = useMemo(() => {
    const totalSales = orders.filter((o) => o.payment_status === "Paid").reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    const totalOrders = orders.length;
    const aov = totalOrders > 0 ? Math.round(totalSales / (orders.filter((o) => o.payment_status === "Paid").length || 1)) : 0;
    const abandonedValue = abandonedCheckouts.reduce((sum, c) => sum + (Number(c.totalPrice) || 0), 0);
    const totalInventoryUnits = (products || PRODUCTS_DATA).reduce((sum, p) => sum + (p.stock || 12), 0);

    return {
      totalSales,
      totalOrders,
      aov,
      abandonedCount: abandonedCheckouts.length,
      abandonedValue,
      totalInventoryUnits,
      customerCount: customersList.length,
    };
  }, [orders, abandonedCheckouts, products, customersList]);

  // Order Fulfillment & Status update
  const handleUpdateOrderStatus = async (orderRef, updates) => {
    setOrders((prev) =>
      prev.map((o) => (o.order_ref === orderRef || o.id === orderRef ? { ...o, ...updates } : o))
    );
    if (inspectingOrder && (inspectingOrder.order_ref === orderRef || inspectingOrder.id === orderRef)) {
      setInspectingOrder((prev) => ({ ...prev, ...updates }));
    }
    await ordersService.updateOrder(orderRef, updates).catch(() => {});
    showToast(`Order ${orderRef} updated successfully`);
  };

  // Export CSV Action
  const handleExportCSV = (type) => {
    let headers = [];
    let rows = [];
    let filename = `shopify_export_${type}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (type === "customers") {
      headers = ["Customer Name", "Email", "Phone", "Customer Tier", "Location", "Orders Count", "Total Spent (INR)", "Last Order Date", "Purchased SKUs"];
      rows = filteredCustomers.map((c) => {
        const skus = (c.orders || []).flatMap((o) => (o.items || []).map((it) => it.sku)).filter(Boolean).join("; ");
        return [
          `"${c.name}"`,
          `"${c.email}"`,
          `"${c.phone || ''}"`,
          `"${c.vip_tier || 'Customer'}"`,
          `"${c.city || 'India'}"`,
          c.ordersCount,
          c.totalSpent,
          `"${c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : 'N/A'}"`,
          `"${skus}"`,
        ];
      });
    } else if (type === "abandoned") {
      headers = ["Checkout", "Created", "Customer Name", "Customer Email", "Customer Phone", "Email Status", "Region", "Recovery Status", "Total Price", "Items"];
      rows = filteredAbandoned.map((c) => [
        c.checkoutNumber,
        `"${c.createdAt}"`,
        `"${c.customerName}"`,
        `"${c.customerEmail || ''}"`,
        `"${c.customerPhone || ''}"`,
        c.emailStatus,
        c.region,
        c.recoveryStatus,
        c.totalPrice,
        `"${(c.items || []).map((i) => `${i.name || i.sku || 'Timepiece'} (x${i.quantity || 1})`).join('; ')}"`,
      ]);
    } else {
      headers = ["Order", "Date & Time", "Customer", "Channel", "Total", "Payment Status", "Fulfillment Status", "Delivery Status", "Tracking"];
      rows = filteredOrders.map((o) => [
        o.order_ref,
        `"${formatOrderTimestamp(o.created_at).fullStr}"`,
        `"${o.customer_name}"`,
        o.channel || "Online Store",
        o.total_amount,
        o.payment_status,
        o.fulfillment_status,
        o.delivery_status || "—",
        o.tracking_number || "—",
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`${type.toUpperCase()} exported to CSV`);
  };

  // Create Draft Order Action
  const handleSaveDraftOrder = (e) => {
    e.preventDefault();
    if (!draftFormData.customerName || !draftFormData.productId) {
      showToast("Please select a timepiece and customer name.");
      return;
    }

    const prod = (products || PRODUCTS_DATA).find((p) => p.id === draftFormData.productId || p.sku === draftFormData.productId);
    const price = Number(draftFormData.customPrice) || parseInt(String(prod?.price || "45000").replace(/[^\d]/g, ""), 10) || 45000;
    const discountRateNum = parseFloat(draftFormData.discountRate) || 0;
    const notesWithDiscount = draftFormData.discountRate
      ? `${draftFormData.notes ? draftFormData.notes + " • " : ""}VIP Privilege Discount Rate: ${draftFormData.discountRate}% OFF applied`
      : draftFormData.notes;

    const newDraft = {
      id: `dft-${Date.now()}`,
      draftNumber: `#D${100 + draftOrders.length + 1}`,
      customerName: draftFormData.customerName,
      customerEmail: draftFormData.customerEmail || "client@hanborowatches.in",
      customerPhone: draftFormData.customerPhone || "",
      total: price,
      discountRate: discountRateNum,
      status: "Open",
      deliveryMethod: draftFormData.deliveryMethod || "Standard (Prepaid)",
      paymentMethod: draftFormData.paymentMethod || "Prepaid UPI / Card",
      createdAt: "Just now",
      items: [{ name: prod?.name || "HANBORO Timepiece", sku: prod?.sku || "HNB-CUSTOM", price, qty: 1 }],
      notes: notesWithDiscount,
    };

    setDraftOrders([newDraft, ...draftOrders]);
    draftOrdersService.saveDraftOrder(newDraft).catch(() => {});
    setShowCreateDraftModal(false);
    setDraftFormData({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      productId: "",
      customPrice: "",
      discountRate: "",
      deliveryMethod: "Standard (Prepaid)",
      paymentMethod: "Prepaid UPI / Card",
      notes: ""
    });
    showToast(`Draft Order ${newDraft.draftNumber} created for ${newDraft.customerName}`);
  };

  // Convert Draft to Live Placed Order
  const handleConvertDraftToOrder = (draft) => {
    const isDraftCod =
      String(draft.paymentMethod || "").toLowerCase().includes("cod") ||
      String(draft.deliveryMethod || "").toLowerCase().includes("cod");

    const newOrder = {
      id: `ord-${Date.now()}`,
      order_ref: `#${Math.floor(1000 + Math.random() * 9000)}`,
      customer_name: draft.customerName,
      customer_email: draft.customerEmail,
      customer_phone: draft.customerPhone,
      channel: "Draft Order",
      total_amount: draft.total,
      currency: "INR",
      payment_status: isDraftCod ? "Pending" : "Paid",
      payment_method: draft.paymentMethod || (isDraftCod ? "Cash on Delivery (COD)" : "Prepaid UPI / Card"),
      order_status: "Processing",
      fulfillment_status: "In progress",
      items_count: `${draft.items.length} item`,
      delivery_status: "Processing",
      delivery_method: draft.deliveryMethod || (isDraftCod ? "COD" : "Standard (Prepaid)"),
      tags: ["Draft Order", isDraftCod ? "COD" : "Prepaid"],
      created_at: new Date().toISOString(),
      tracking_number: `EXP-${Math.floor(100000 + Math.random() * 900000)}`,
      items: draft.items,
      shipping_address: { city: "India", state: "India", pin: "000000" },
    };

    ordersService.createOrder(newOrder).catch(() => {});
    draftOrdersService.deleteDraftOrder(draft.id).catch(() => {});
    setOrders([newOrder, ...orders]);
    setDraftOrders(draftOrders.filter((d) => d.id !== draft.id));
    showToast(`Draft ${draft.draftNumber} converted to Live Order ${newOrder.order_ref}`);
    setActiveTab("orders");
  };

  // Convert Abandoned Lead to Live Boutique Order
  const handleConvertAbandonedToOrder = (checkout) => {
    const isCod = true;
    const newOrder = {
      id: `ord-${Date.now()}`,
      order_ref: `#${Math.floor(1000 + Math.random() * 9000)}`,
      customer_name: checkout.customerName || "Valued Client",
      customer_email: checkout.customerEmail || "client@hanborowatches.in",
      customer_phone: checkout.customerPhone || "",
      channel: "Recovered Checkout",
      total_amount: checkout.totalPrice,
      currency: "INR",
      payment_status: "Pending",
      payment_method: "Cash on Delivery (COD)",
      order_status: "Processing",
      fulfillment_status: "In progress",
      items_count: `${(checkout.items || []).length} item`,
      delivery_status: "Processing",
      delivery_method: "COD",
      tags: ["Recovered Abandoned Checkout", "COD"],
      created_at: new Date().toISOString(),
      tracking_number: `EXP-${Math.floor(100000 + Math.random() * 900000)}`,
      items: checkout.items || [],
      shipping_address: checkout.shippingAddress || { city: checkout.region || "India", state: "India", pin: "000000" },
    };

    ordersService.createOrder(newOrder).catch(() => {});
    abandonedCheckoutsService.markCheckoutRecovered(checkout.id, newOrder.order_ref).catch(() => {});
    setOrders([newOrder, ...orders]);
    setAbandonedCheckouts(abandonedCheckouts.map((c) => c.id === checkout.id ? { ...c, recoveryStatus: "Recovered" } : c));
    setInspectingCheckout(null);
    showToast(`Abandoned Checkout converted to Live Order ${newOrder.order_ref}`);
    setActiveTab("orders");
  };

  // Production Clean-Slate Reset: Purge test leads and orders to 0 while keeping 104 Watch Catalogue & Inventory intact
  const handleProductionZeroReset = () => {
    const confirmReset = window.confirm(
      "PRODUCTION DATABASE RESET:\n\nAre you sure you want to clean-slate the admin database to 0?\n\n• Orders: Reset to 0\n• Abandoned Leads: Reset to 0\n• Draft Orders: Reset to 0\n• Customer Dossiers: Reset to 0\n\n✓ Master Watch Catalogue (104 Timepieces) and Inventory Allocations will remain 100% active and untouched."
    );
    if (!confirmReset) return;

    setOrders([]);
    setAbandonedCheckouts([]);
    setDraftOrders([]);
    setProfiles([]);

    try {
      safeStorage.removeItem("hanboro_orders_cache");
      safeStorage.removeItem("hanboro_abandoned_checkouts_cache");
      safeStorage.removeItem("hanboro_customers_cache");
      safeStorage.removeItem("hanboro_profiles_cache");
      safeStorage.removeItem("hanboro_draft_orders_cache");
      safeStorage.removeItem("hanboro_roulette_spins_cache");
      safeStorage.setItem("hanboro_prod_zero_db_v1", "true");
    } catch {}

    showToast("Production database cleaned to 0. Master Inventory intact!");
  };

  // Create Custom Promo with full discount rate support (percentage, fixed amount, decimals)
  const handleCreatePromo = async (e) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;
    const clean = promoCodeInput.trim().toUpperCase();
    const val = parseFloat(promoDiscountInput);
    if (isNaN(val) || val <= 0) {
      showToast("Please enter a valid positive discount rate.");
      return;
    }
    if (promoTypeInput === "percent" && val > 100) {
      showToast("Percentage discount cannot exceed 100%.");
      return;
    }

    const config = {
      id: `dsc-${clean.toLowerCase()}`,
      code: clean,
      type: promoTypeInput,
      value: val,
      label: `${clean}: ${val}${promoTypeInput === "percent" ? "%" : " INR"} OFF`,
      is_active: true,
    };

    const updated = {
      ...customPromos,
      [clean]: config,
    };
    setCustomPromos(updated);

    try {
      await discountsService.saveDiscount(clean, config);
      showToast(`Discount rate code ${clean} (${val}${promoTypeInput === "percent" ? "%" : " INR"} OFF) activated!`);
      setPromoCodeInput("");
      setPromoDiscountInput("15");
    } catch (err) {
      showToast(`Saved locally. (${err.message || "Synced"})`);
    }
  };

  // Delete / Remove discount promo code
  const handleDeletePromo = async (code) => {
    if (PROMO_CODES[code]) {
      showToast(`${code} is a protected system discount code.`);
      return;
    }
    const updated = { ...customPromos };
    delete updated[code];
    setCustomPromos(updated);

    try {
      await discountsService.deleteDiscount(code);
      showToast(`Discount code ${code} removed.`);
    } catch (err) {
      showToast(`Removed locally.`);
    }
  };

  const handleStockDelta = async (productId, delta) => {
    const prod = (products || PRODUCTS_DATA).find((p) => p.id === productId || p.sku === productId);
    const nextStock = Math.max(0, (prod?.stock || 0) + delta);
    try {
      await updateProduct(productId, { stock: nextStock });
      await inventoryService.updateStock(productId, nextStock);
      showToast(`Stock for ${prod?.name || productId} updated to ${nextStock}`);
    } catch (err) {
      showToast(`Failed to update stock: ${err.message}`, 4000);
    }
  };

  return (
    <div className={`shopify-admin-shell shopify-admin-theme--${adminTheme}`}>
      {/* ── ADMIN TOPBAR ── */}
      <header className="sp-topbar">
        <div className="sp-topbar__left">
          <button
            type="button"
            className="sp-brand-badge"
            onClick={onNavigateHome}
            title="Return to store"
          >
            <HanboroLogo theme={adminTheme === "shopify-light" ? "dark" : "light"} size={20} />
            <span className="sp-store-name">HANBORO Watches</span>
            <span className="sp-chevron">▾</span>
          </button>

          <div className="sp-search-bar-wrap">
            <span className="sp-search-icon"><IconSearch size={14} /></span>
            <input
              type="text"
              className="sp-search-input"
              placeholder="Search orders, SKUs, customers..."
              value={orderSearch || abandonedSearch || productSearch}
              onChange={(e) => {
                setOrderSearch(e.target.value);
                setAbandonedSearch(e.target.value);
                setProductSearch(e.target.value);
              }}
            />
            <span className="sp-search-kbd">⌘K</span>
          </div>
        </div>

        <div className="sp-topbar__right">
          {/* Audit Pill */}
          <button
            type="button"
            className={`sp-topbar-pill sp-topbar-pill--audit${activeTab === "audit" ? " is-active" : ""}`}
            onClick={() => setActiveTab("audit")}
            title="Team Audit Trail"
          >
            <IconAudit size={13} />
            <span>Audit</span>
            <span className="sp-topbar-pill-count">{auditLogs.length}</span>
          </button>

          {/* Live sync indicator */}
          <div className={`sp-sync-pill${isSyncing ? " is-syncing" : ""}`}>
            <span className="sp-sync-pill-dot" />
            {isSyncing ? "Syncing..." : "Live"}
          </div>

          {/* Refresh */}
          <button
            type="button"
            className={`sp-icon-btn ${isSyncing ? "is-spinning" : ""}`}
            onClick={loadAllAdminData}
            title="Refresh data"
          >
            <IconSync size={14} />
          </button>

          {/* Theme toggle */}
          <button
            type="button"
            className="sp-theme-toggle-btn"
            onClick={toggleTheme}
            title={`Switch to ${adminTheme === "shopify-light" ? "Dark Mode" : "Light Mode"}`}
          >
            {adminTheme === "shopify-light" ? "🌙 Dark" : "☀️ Light"}
          </button>

          {/* User Capsule */}
          <div className="sp-user-capsule">
            <div className="sp-avatar">{(user?.fullName || user?.email || "A").charAt(0).toUpperCase()}</div>
            <span className="sp-user-label">{user?.fullName || "Admin"}</span>
            <button
              type="button"
              className="sp-logout-btn"
              onClick={logout}
              title="Sign out"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Toast notifications */}
      {toastMessage && (
        <div className="sp-toast" role="alert">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── BODY LAYOUT (SIDEBAR + MAIN CONTENT) ── */}
      <div className="sp-body-container">
        {/* Left Shopify Sidebar Navigation */}
        <aside className="sp-sidebar">
          <nav className="sp-nav-group">
            {/* 1. Home */}
            <button
              type="button"
              className={`sp-nav-link ${activeTab === "home" ? "is-active" : ""}`}
              onClick={() => setActiveTab("home")}
            >
              <span className="sp-nav-icon"><IconHome size={16} /></span>
              <span className="sp-nav-text">Home</span>
            </button>

            {/* 2. Orders (with Drafts & Abandoned Checkouts) */}
            <div className="sp-nav-accordion">
              <button
                type="button"
                className={`sp-nav-link ${activeTab === "orders" || activeTab === "drafts" || activeTab === "abandoned" ? "is-active" : ""}`}
                onClick={() => setActiveTab("orders")}
              >
                <span className="sp-nav-icon"><IconOrders size={16} /></span>
                <span className="sp-nav-text">Orders</span>
                <span className="sp-nav-badge">{orders.length}</span>
              </button>

              <div className="sp-nav-sublist">
                <button
                  type="button"
                  className={`sp-nav-sublink ${activeTab === "drafts" ? "is-active" : ""}`}
                  onClick={() => setActiveTab("drafts")}
                >
                  Drafts
                </button>
                <button
                  type="button"
                  className={`sp-nav-sublink ${activeTab === "abandoned" ? "is-active" : ""}`}
                  onClick={() => setActiveTab("abandoned")}
                >
                  <span>Abandoned checkouts</span>
                  <span className="sp-sublink-count">{abandonedCheckouts.length}</span>
                </button>
              </div>
            </div>

            {/* 3. Products */}
            <button
              type="button"
              className={`sp-nav-link ${activeTab === "products" ? "is-active" : ""}`}
              onClick={() => setActiveTab("products")}
            >
              <span className="sp-nav-icon"><IconProducts size={16} /></span>
              <span className="sp-nav-text">Products</span>
              <span className="sp-nav-badge">{(products || PRODUCTS_DATA).length}</span>
            </button>

            {/* 4. Customers */}
            <button
              type="button"
              className={`sp-nav-link ${activeTab === "customers" ? "is-active" : ""}`}
              onClick={() => setActiveTab("customers")}
            >
              <span className="sp-nav-icon"><IconCustomers size={16} /></span>
              <span className="sp-nav-text">Customers</span>
              <span className="sp-nav-badge">{customersList.length}</span>
            </button>

            {/* 5. Team Audit (Real-time activity ledger) */}
            <button
              type="button"
              className={`sp-nav-link sp-nav-link--audit ${activeTab === "audit" ? "is-active" : ""}`}
              onClick={() => setActiveTab("audit")}
            >
              <span className="sp-nav-icon"><IconAudit size={16} /></span>
              <span className="sp-nav-text">Team Audit</span>
              <span className="sp-nav-badge sp-nav-badge--live">{auditLogs.length}</span>
            </button>

            {/* 6. Discounts */}
            <button
              type="button"
              className={`sp-nav-link ${activeTab === "discounts" ? "is-active" : ""}`}
              onClick={() => setActiveTab("discounts")}
            >
              <span className="sp-nav-icon"><IconDiscounts size={16} /></span>
              <span className="sp-nav-text">Discounts</span>
            </button>

            {/* 7. Markets */}
            <button
              type="button"
              className={`sp-nav-link ${activeTab === "markets" ? "is-active" : ""}`}
              onClick={() => setActiveTab("markets")}
            >
              <span className="sp-nav-icon"><IconMarkets size={16} /></span>
              <span className="sp-nav-text">Markets</span>
            </button>

            {/* 8. Analytics */}
            <button
              type="button"
              className={`sp-nav-link ${activeTab === "analytics" ? "is-active" : ""}`}
              onClick={() => setActiveTab("analytics")}
            >
              <span className="sp-nav-icon"><IconAnalytics size={16} /></span>
              <span className="sp-nav-text">Analytics</span>
            </button>
          </nav>

          {/* Sales Channels Group */}
          <div className="sp-sidebar-divider" />
          <div className="sp-sidebar-heading">Sales channels</div>
          <nav className="sp-nav-group">
            <button
              type="button"
              className="sp-nav-link"
              onClick={onNavigateHome}
            >
              <span className="sp-nav-icon"><IconStorefront size={16} /></span>
              <span className="sp-nav-text">Online Store</span>
              <span className="sp-link-action"><IconExternalLink size={11} /></span>
            </button>
          </nav>

          {/* Apps Group */}
          <div className="sp-sidebar-divider" />
          <div className="sp-sidebar-heading">Apps</div>
          <nav className="sp-nav-group">
            <button
              type="button"
              className={`sp-nav-link ${activeTab === "whatsapp" ? "is-active" : ""}`}
              onClick={() => setActiveTab("whatsapp")}
            >
              <span className="sp-nav-icon" style={{ color: "#25d366" }}><IconWhatsApp size={16} /></span>
              <span className="sp-nav-text">WhatsApp</span>
              <span className="sp-nav-badge sp-nav-badge--green">Online</span>
            </button>
          </nav>



          {/* Bottom Settings Button */}
          <div className="sp-sidebar-bottom">
            <button
              type="button"
              className={`sp-nav-link ${activeTab === "settings" ? "is-active" : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              <span className="sp-nav-icon"><IconSettings size={16} /></span>
              <span className="sp-nav-text">Settings</span>
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT STAGE ── */}
        <main className="sp-content-stage">

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 1: ABANDONED CHECKOUTS (Matches User Screenshot 1 Exactly)
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "abandoned" && (
            <div className="sp-page-card">
              {/* Page Title & Actions */}
              <div className="sp-card-header">
                <div className="sp-card-title-wrap">
                  <span className="sp-title-icon"><IconOrders size={18} /></span>
                  <h1 className="sp-page-title">Abandoned checkouts</h1>
                </div>
                <div className="sp-header-actions">
                  <button
                    type="button"
                    className="sp-btn sp-btn--default"
                    onClick={() => handleExportCSV("abandoned")}
                  >
                    <IconExport size={13} />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {/* Filter Tabs & Search Bar */}
              <div className="sp-table-controls">
                <div className="sp-filter-tabs">
                  <button type="button" className="sp-tab-item is-active">
                    All
                  </button>
                </div>

                <div className="sp-table-search-row">
                  <div className="sp-search-field">
                    <span className="sp-field-icon"><IconSearch size={14} /></span>
                    <input
                      type="text"
                      className="sp-field-input"
                      placeholder="Search checkouts, clients, phones..."
                      value={abandonedSearch}
                      onChange={(e) => setAbandonedSearch(e.target.value)}
                    />
                  </div>

                  <div className="sp-table-quick-actions">
                    <button
                      type="button"
                      className="sp-icon-btn"
                      title="Delete / Archive selected"
                      onClick={async () => {
                        if (selectedCheckouts.size === 0) {
                          showToast("Select checkouts to archive");
                        } else {
                          const toDelete = Array.from(selectedCheckouts);
                          setAbandonedCheckouts(abandonedCheckouts.filter((c) => !selectedCheckouts.has(c.id)));
                          setSelectedCheckouts(new Set());
                          await Promise.all(toDelete.map((id) => abandonedCheckoutsService.deleteAbandonedCheckout(id))).catch(() => {});
                          showToast("Selected checkouts archived");
                        }
                      }}
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="sp-table-wrap">
                <table className="sp-table">
                  <thead>
                    <tr>
                      <th className="sp-th--checkbox">
                        <input
                          type="checkbox"
                          checked={selectedCheckouts.size === filteredAbandoned.length && filteredAbandoned.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCheckouts(new Set(filteredAbandoned.map((c) => c.id)));
                            } else {
                              setSelectedCheckouts(new Set());
                            }
                          }}
                        />
                      </th>
                      <th>Checkout</th>
                      <th>Created</th>
                      <th>Customer name</th>
                      <th>Email status</th>
                      <th>Region</th>
                      <th>Recovery status</th>
                      <th className="sp-th--right">Total price</th>
                      <th className="sp-th--action">WhatsApp</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredAbandoned.map((item) => {
                      const isSelected = selectedCheckouts.has(item.id);
                      return (
                        <tr
                          key={item.id}
                          className={isSelected ? "is-selected-row" : ""}
                        >
                          <td className="sp-td--checkbox">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                const next = new Set(selectedCheckouts);
                                if (next.has(item.id)) next.delete(item.id);
                                else next.add(item.id);
                                setSelectedCheckouts(next);
                              }}
                            />
                          </td>
                          <td className="sp-td--bold">
                            <button
                              type="button"
                              className="sp-link-text"
                              onClick={() => setInspectingCheckout(item)}
                            >
                              {item.checkoutNumber}
                            </button>
                          </td>
                          <td className="sp-td--date">{item.createdAt}</td>
                          <td className="sp-td--customer">
                            <span className="sp-customer-name">{item.customerName}</span>
                            <span className="sp-customer-sub">
                              {item.customerEmail}
                              {item.customerPhone ? ` • ${item.customerPhone}` : ""}
                            </span>
                          </td>
                          <td>
                            <span className={`sp-status-badge ${item.emailStatus === "Sent" ? "sp-status--green" : "sp-status--amber"}`}>
                              {item.emailStatus}
                            </span>
                          </td>
                          <td className="sp-td--region">{item.region}</td>
                          <td>
                            <span className={`sp-status-badge ${item.recoveryStatus === "Recovered" ? "sp-status--green" : "sp-status--amber"}`}>
                              {item.recoveryStatus}
                            </span>
                          </td>
                          <td className="sp-td--price sp-td--right">
                            ₹{Number(item.totalPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="sp-td--action">
                            <button
                              type="button"
                              className="sp-btn sp-btn--whatsapp-nudge"
                              onClick={() => triggerWhatsAppRecovery(item)}
                              title="Send 1-Click WhatsApp Cart Recovery Nudge (+91 88820 69334)"
                            >
                              <IconWhatsApp size={14} />
                              <span>WhatsApp Nudge</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredAbandoned.length === 0 && (
                      <tr>
                        <td colSpan="9" className="sp-empty-cell">
                          <div style={{ padding: "32px 16px", textAlign: "center" }}>
                            <p style={{ fontWeight: 600, color: "#0f172a", marginBottom: "4px" }}>No abandoned checkouts</p>
                            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Prospective leads and abandoned carts will appear here for 1-click recovery.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom footer note matching Shopify screenshot */}
              <div className="sp-card-footer">
                <a
                  href="#learn-more"
                  className="sp-footer-learn-link"
                  onClick={(e) => {
                    e.preventDefault();
                    showToast("Shopify Abandoned Checkout Recovery actively monitoring carts");
                  }}
                >
                  Learn more about abandoned checkouts
                </a>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 2: ALL ORDERS (Matches User Screenshot 2 Exactly)
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "orders" && (
            <div className="sp-page-card">
              {/* Page Title & Actions */}
              <div className="sp-card-header">
                <div className="sp-card-title-wrap">
                  <span className="sp-title-icon"><IconOrders size={18} /></span>
                  <h1 className="sp-page-title">Orders</h1>
                </div>
                <div className="sp-header-actions">
                  <button
                    type="button"
                    className="sp-btn sp-btn--default"
                    onClick={() => setActiveTab("audit")}
                    title="View real-time Team Audit Trail for order placements and status changes"
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#047857", borderColor: "#a7f3d0", backgroundColor: "#ecfdf5", fontWeight: 600 }}
                  >
                    <IconAudit size={13} />
                    <span>Orders Audit</span>
                  </button>
                  <button
                    type="button"
                    className="sp-btn sp-btn--default"
                    onClick={() => handleExportCSV("orders")}
                  >
                    <IconExport size={13} />
                    <span>Export</span>
                  </button>
                  <button
                    type="button"
                    className="sp-btn sp-btn--primary"
                    onClick={() => setShowCreateDraftModal(true)}
                  >
                    <IconPlus size={13} />
                    <span>Create order</span>
                  </button>
                </div>
              </div>

              {/* Filter Tabs & Search Bar */}
              <div className="sp-table-controls">
                <div className="sp-filter-tabs">
                  <button
                    type="button"
                    className={`sp-tab-item ${orderStatusTab === "all" ? "is-active" : ""}`}
                    onClick={() => setOrderStatusTab("all")}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={`sp-tab-item ${orderStatusTab === "unfulfilled" ? "is-active" : ""}`}
                    onClick={() => setOrderStatusTab("unfulfilled")}
                  >
                    Unfulfilled
                  </button>
                  <button
                    type="button"
                    className={`sp-tab-item ${orderStatusTab === "unpaid" ? "is-active" : ""}`}
                    onClick={() => setOrderStatusTab("unpaid")}
                  >
                    Unpaid
                  </button>
                  <button
                    type="button"
                    className={`sp-tab-item ${orderStatusTab === "open" ? "is-active" : ""}`}
                    onClick={() => setOrderStatusTab("open")}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    className={`sp-tab-item ${orderStatusTab === "closed" ? "is-active" : ""}`}
                    onClick={() => setOrderStatusTab("closed")}
                  >
                    Closed
                  </button>
                </div>

                <div className="sp-table-search-row">
                  <div className="sp-search-field">
                    <span className="sp-field-icon"><IconSearch size={14} /></span>
                    <input
                      type="text"
                      className="sp-field-input"
                      placeholder="Search orders, clients, airways..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                    />
                  </div>

                  <div className="sp-table-quick-actions">
                    <button
                      type="button"
                      className="sp-icon-btn"
                      title="Filter list"
                      onClick={() => showToast("Quick filters active")}
                    >
                      <IconFilter size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Orders Table matching Screenshot 2 */}
              <div className="sp-table-wrap">
                <table className="sp-table">
                  <thead>
                    <tr>
                      <th className="sp-th--checkbox">
                        <input
                          type="checkbox"
                          checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOrders(new Set(filteredOrders.map((o) => o.id || o.order_ref)));
                            } else {
                              setSelectedOrders(new Set());
                            }
                          }}
                        />
                      </th>
                      <th>Customer</th>
                      <th>Date & Time</th>
                      <th>Channel</th>
                      <th className="sp-th--right">Total</th>
                      <th>Payment status</th>
                      <th>Fulfillment status</th>
                      <th>Items</th>
                      <th>Delivery status</th>
                      <th>Delivery method</th>
                      <th>Tags</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredOrders.map((o) => {
                      const id = o.id || o.order_ref;
                      const isSelected = selectedOrders.has(id);
                      return (
                        <tr
                          key={id}
                          className={isSelected ? "is-selected-row" : ""}
                        >
                          <td className="sp-td--checkbox">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                const next = new Set(selectedOrders);
                                if (next.has(id)) next.delete(id);
                                else next.add(id);
                                setSelectedOrders(next);
                              }}
                            />
                          </td>
                          <td className="sp-td--bold">
                            <button
                              type="button"
                              className="sp-link-text"
                              onClick={() => setInspectingOrder(o)}
                            >
                              {o.customer_name || "Valued Client"}
                            </button>
                            <div className="sp-order-ref-sub">{o.order_ref}</div>
                          </td>
                          <td className="sp-td--date">
                            <div className="sp-order-date-primary">
                              {formatOrderTimestamp(o.created_at).dateStr}
                            </div>
                            <div className="sp-order-time-sub">
                              {formatOrderTimestamp(o.created_at).timeStr}
                            </div>
                          </td>
                          <td className="sp-td--channel">{o.channel || "Online Store"}</td>
                          <td className="sp-td--price sp-td--right">
                            ₹{Number(o.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td>
                            <span className={`sp-badge-dot ${
                              o.payment_status === "Paid" ? "sp-badge-dot--paid" :
                              o.payment_status === "Voided" ? "sp-badge-dot--voided" : "sp-badge-dot--pending"
                            }`}>
                              ● {o.payment_status || "Pending"}
                            </span>
                          </td>
                          <td>
                            <span className={`sp-badge-pill ${
                              o.fulfillment_status === "Fulfilled" ? "sp-badge-pill--fulfilled" :
                              o.fulfillment_status === "In progress" ? "sp-badge-pill--inprogress" :
                              o.fulfillment_status === "Not required" ? "sp-badge-pill--notrequired" : "sp-badge-pill--unfulfilled"
                            }`}>
                              {o.fulfillment_status || "Unfulfilled"}
                            </span>
                          </td>
                          <td>{o.items_count || `${(o.items || []).length} item`}</td>
                          <td>
                            {o.delivery_status ? (
                              <span className="sp-badge-pill sp-badge-pill--delivered">
                                ● {o.delivery_status}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="sp-td--subdued">{o.delivery_method || "Standard"}</td>
                          <td>
                            <div className="sp-tags-cluster">
                              {(o.tags || ["Standard"]).map((tag, tIdx) => (
                                <span key={tIdx} className="sp-tag-chip">{tag}</span>
                              ))}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                type="button"
                                className="sp-btn sp-btn--sm"
                                onClick={() => setInspectingOrder(o)}
                                title="Inspect & update order"
                              >
                                View
                              </button>
                              <button
                                type="button"
                                className="sp-btn sp-btn--sm sp-btn--whatsapp-icon"
                                onClick={() => triggerWhatsAppOrderUpdate(o)}
                                title="Send WhatsApp Update to client"
                              >
                                <IconWhatsApp size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan="12" className="sp-empty-cell">
                          <div style={{ padding: "32px 16px", textAlign: "center" }}>
                            <p style={{ fontWeight: 600, color: "#0f172a", marginBottom: "4px" }}>No orders received yet</p>
                            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Your store is live. Incoming orders will appear here in real time.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom footer note matching Shopify screenshot */}
              <div className="sp-card-footer">
                <a
                  href="#learn-more"
                  className="sp-footer-learn-link"
                  onClick={(e) => {
                    e.preventDefault();
                    showToast("HANBORO Real-Time Order Transmissions Active");
                  }}
                >
                  Learn more about orders
                </a>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 3: DRAFTS (Shopify Manual Order Generation)
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "drafts" && (
            <div className="sp-page-card">
              <div className="sp-card-header">
                <div className="sp-card-title-wrap">
                  <span className="sp-title-icon"><IconOrders size={18} /></span>
                  <h1 className="sp-page-title">Draft orders</h1>
                </div>
                <div className="sp-header-actions">
                  <button
                    type="button"
                    className="sp-btn sp-btn--primary"
                    onClick={() => setShowCreateDraftModal(true)}
                  >
                    <IconPlus size={13} />
                    <span>Create draft order</span>
                  </button>
                </div>
              </div>

              <div className="sp-table-wrap">
                <table className="sp-table">
                  <thead>
                    <tr>
                      <th>Draft</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Status</th>
                      <th className="sp-th--right">Total</th>
                      <th>Items</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draftOrders.map((d) => (
                      <tr key={d.id}>
                        <td className="sp-td--bold">{d.draftNumber}</td>
                        <td className="sp-td--date">{d.createdAt}</td>
                        <td>
                          <div className="sp-customer-name">{d.customerName}</div>
                          <div className="sp-customer-sub">{d.customerEmail} • {d.customerPhone}</div>
                        </td>
                        <td>
                          <span className="sp-status-badge sp-status--amber">{d.status}</span>
                        </td>
                        <td className="sp-td--price sp-td--right">
                          ₹{Number(d.total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td>
                          {d.items.map((it) => it.name).join(", ")}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              className="sp-btn sp-btn--sm sp-btn--primary"
                              onClick={() => handleConvertDraftToOrder(d)}
                              title="Convert directly to Paid Order"
                            >
                              Complete Order
                            </button>
                            <button
                              type="button"
                              className="sp-btn sp-btn--sm sp-btn--whatsapp-icon"
                              onClick={() => {
                                const text = encodeURIComponent(
                                  `Hello ${d.customerName},\n\nYour custom HANBORO reservation draft ${d.draftNumber} has been prepared:\nTimepiece: ${d.items.map((i) => i.name).join(", ")}\nTotal: ₹${Number(d.total).toLocaleString("en-IN")}\n\nOur concierge (+91 88820 69334) will coordinate personal delivery and insured shipping.`
                                );
                                window.open(`https://wa.me/${d.customerPhone.replace(/[^\d]/g, "")}?text=${text}`, "_blank");
                              }}
                              title="Send Draft invoice on WhatsApp"
                            >
                              WhatsApp
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {draftOrders.length === 0 && (
                      <tr>
                        <td colSpan="7" className="sp-empty-cell">
                          <div style={{ padding: "32px 16px", textAlign: "center" }}>
                            <p style={{ fontWeight: 600, color: "#0f172a", marginBottom: "4px" }}>No draft orders created</p>
                            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Click "Create draft order" above to generate a custom reservation or invoice for clients.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 4: PRODUCTS & INVENTORY MANAGEMENT
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "products" && (
            <div className="sp-page-card">
              <div className="sp-card-header">
                <div className="sp-card-title-wrap">
                  <span className="sp-title-icon"><IconProducts size={18} /></span>
                  <h1 className="sp-page-title">Products & Inventory</h1>
                  {orderSaveSuccess && (
                    <span className="sp-order-saved-pill" title="Order synced and persisted">
                      ✓ Watch Order Saved
                    </span>
                  )}
                  {isSavingOrder && (
                    <span className="sp-order-saving-pill">
                      Saving order...
                    </span>
                  )}
                </div>
                <div className="sp-header-actions">
                  {/* View Mode Switcher: Table vs Visual Arrange Grid */}
                  <div className="sp-view-toggle-group" role="group" aria-label="Products display format">
                    <button
                      type="button"
                      className={`sp-view-toggle-btn ${productViewMode === "table" ? "is-active" : ""}`}
                      onClick={() => setProductViewMode("table")}
                      title="Table List View"
                    >
                      <IconList size={13} />
                      <span>Table</span>
                    </button>
                    <button
                      type="button"
                      className={`sp-view-toggle-btn ${productViewMode === "arrange" ? "is-active" : ""}`}
                      onClick={() => setProductViewMode("arrange")}
                      title="Drag & Drop Watch Models Reorder Grid"
                    >
                      <IconGrid size={13} />
                      <span>Arrange Models</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    className="sp-btn sp-btn--default"
                    onClick={async () => {
                      if (window.confirm("Reset all timepiece ordering back to the factory reference sequence?")) {
                        setIsSavingOrder(true);
                        try {
                          await resetProductOrder();
                          setOrderSaveSuccess(true);
                          setTimeout(() => setOrderSaveSuccess(false), 2400);
                        } finally {
                          setIsSavingOrder(false);
                        }
                      }
                    }}
                    title="Reset watch sequence back to factory canonical order"
                  >
                    <IconSync size={13} />
                    <span>Reset Order</span>
                  </button>

                  <button
                    type="button"
                    className="sp-btn sp-btn--default"
                    onClick={() => setActiveTab("audit")}
                    title="View Team Audit Trail for timepiece changes and SKU edits"
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#047857", borderColor: "#a7f3d0", backgroundColor: "#ecfdf5", fontWeight: 600 }}
                  >
                    <IconAudit size={13} />
                    <span>Team Audit</span>
                  </button>

                  <button
                    type="button"
                    className="sp-btn sp-btn--default"
                    onClick={() => handleExportCSV("products")}
                  >
                    <IconExport size={13} />
                    <span>Export</span>
                  </button>
                  <button
                    type="button"
                    className="sp-btn sp-btn--primary"
                    onClick={() => {
                      setEditingWatch(null);
                      setEditorModalOpen(true);
                    }}
                  >
                    <IconPlus size={13} />
                    <span>Add product</span>
                  </button>
                </div>
              </div>

              {/* Category Filter bar */}
              <div className="sp-table-controls">
                <div className="sp-filter-tabs">
                  <button
                    type="button"
                    className={`sp-tab-item ${productCategoryFilter === "ALL" ? "is-active" : ""}`}
                    onClick={() => setProductCategoryFilter("ALL")}
                  >
                    All Collections ({(products || PRODUCTS_DATA).length})
                  </button>
                  {availableProductCategories.filter((c) => c.id !== "ALL").map((cat) => {
                    const count = (products || PRODUCTS_DATA).filter((p) => p.collection === cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={`sp-tab-item ${productCategoryFilter === cat.id ? "is-active" : ""}`}
                        onClick={() => setProductCategoryFilter(cat.id)}
                      >
                        {cat.label || cat.name} ({count})
                      </button>
                    );
                  })}
                </div>

                <div className="sp-table-search-row">
                  <div className="sp-search-field">
                    <span className="sp-field-icon"><IconSearch size={14} /></span>
                    <input
                      type="text"
                      className="sp-field-input"
                      placeholder="Filter by title, SKU, reference, movement..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* ── ARRANGE MODELS MODE (Visual Drag & Drop Pedestal Cards) ── */}
              {productViewMode === "arrange" ? (
                <div className="sp-arrange-container">
                  <div className="sp-arrange-banner">
                    <div className="sp-arrange-banner__info">
                      <strong>Drag & Drop Watch Models to Rearrange</strong>
                      <span>
                        Drag cards to reorder. The sequence configured here sets the default storefront showcase order, carousel presentation, and master catalog sequence.
                      </span>
                    </div>
                    <div className="sp-arrange-banner__badge">
                      <span>{filteredProducts.length} Timepieces Shown</span>
                    </div>
                  </div>

                  <div className="sp-reorder-grid">
                    {filteredProducts.map((p, index) => {
                      const id = p.id || p.sku;
                      const isDragging = draggedWatchIndex === index;
                      const isDropTarget = dragOverWatchIndex === index;
                      const modelNum = p.modelNumber || p.specs?.modelNumber || (p.sku ? p.sku.split("-")[1] : "—");

                      return (
                        <div
                          key={id}
                          draggable
                          onDragStart={(e) => handleWatchDragStart(e, index)}
                          onDragOver={(e) => handleWatchDragOver(e, index)}
                          onDrop={(e) => handleWatchDrop(e, index)}
                          onDragEnd={handleWatchDragEnd}
                          className={`sp-reorder-card ${isDragging ? "is-dragging" : ""} ${isDropTarget ? "is-drop-target" : ""}`}
                        >
                          <div className="sp-reorder-card__header">
                            <span className="sp-reorder-rank-badge">#{index + 1}</span>
                            <span className="sp-reorder-model-pill">Model: {modelNum}</span>
                            <span className="sp-reorder-drag-grip" title="Click and drag to rearrange watch">
                              <IconGripVertical size={16} />
                            </span>
                          </div>

                          <div className="sp-reorder-stage">
                            <img
                              src={p.transparentImage || p.image}
                              alt={p.name}
                              className="sp-reorder-stage__img"
                              onError={(e) => { e.target.src = "/watch-astroworld-moon-rosegold-front-transparent.webp"; }}
                            />
                          </div>

                          <div className="sp-reorder-info">
                            <div className="sp-reorder-title" title={p.name}>{p.name}</div>
                            <div className="sp-reorder-meta-line">
                              <span className="sp-reorder-collection-tag">{p.collectionName || p.collection}</span>
                              <span className="sp-reorder-price-tag">{p.price}</span>
                            </div>
                            <div className="sp-reorder-sku-line">SKU: {p.sku}</div>
                          </div>

                          <div className="sp-reorder-actions" onMouseDown={(e) => e.stopPropagation()}>
                            <div className="sp-reorder-nav-group" title="Quick reorder positions">
                              <button
                                type="button"
                                className="sp-reorder-nav-btn"
                                disabled={index === 0}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); handleReorderWatch(index, 0); }}
                                title="Move to Top (#1)"
                              >
                                <IconArrowTop size={12} />
                              </button>
                              <button
                                type="button"
                                className="sp-reorder-nav-btn"
                                disabled={index === 0}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); handleReorderWatch(index, index - 1); }}
                                title="Move Up 1 Position"
                              >
                                <IconArrowUp size={12} />
                              </button>
                              <button
                                type="button"
                                className="sp-reorder-nav-btn"
                                disabled={index === filteredProducts.length - 1}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); handleReorderWatch(index, index + 1); }}
                                title="Move Down 1 Position"
                              >
                                <IconArrowDown size={12} />
                              </button>
                              <button
                                type="button"
                                className="sp-reorder-nav-btn"
                                disabled={index === filteredProducts.length - 1}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => { e.stopPropagation(); handleReorderWatch(index, filteredProducts.length - 1); }}
                                title="Move to Bottom"
                              >
                                <IconArrowBottom size={12} />
                              </button>
                            </div>
                            <div className="sp-reorder-edit-btns">
                              <button
                                type="button"
                                className="sp-btn sp-btn--sm"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingWatch(p);
                                  setEditorModalOpen(true);
                                }}
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* ── TABLE VIEW WITH DRAG & DROP ROWS ── */
                <div className="sp-table-wrap">
                  <table className="sp-table">
                    <thead>
                      <tr>
                        <th className="sp-th--drag" style={{ width: "36px", textAlign: "center" }} title="Drag handle"></th>
                        <th style={{ width: "48px" }}>#</th>
                        <th className="sp-th--checkbox">
                          <input
                            type="checkbox"
                            checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProducts(new Set(filteredProducts.map((p) => p.id || p.sku)));
                              } else {
                                setSelectedProducts(new Set());
                              }
                            }}
                          />
                        </th>
                        <th>Product & Model</th>
                        <th>Status</th>
                        <th>Inventory</th>
                        <th>Collection</th>
                        <th className="sp-th--right">Price</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p, index) => {
                        const id = p.id || p.sku;
                        const isSelected = selectedProducts.has(id);
                        const isDragging = draggedWatchIndex === index;
                        const isDropTarget = dragOverWatchIndex === index;
                        const modelNum = p.modelNumber || p.specs?.modelNumber || (p.sku ? p.sku.split("-")[1] : "—");

                        return (
                          <tr
                            key={id}
                            draggable
                            onDragStart={(e) => handleWatchDragStart(e, index)}
                            onDragOver={(e) => handleWatchDragOver(e, index)}
                            onDrop={(e) => handleWatchDrop(e, index)}
                            onDragEnd={handleWatchDragEnd}
                            className={`${isSelected ? "is-selected-row" : ""} ${isDragging ? "sp-row--dragging" : ""} ${isDropTarget ? "sp-row--drop-target" : ""}`}
                          >
                            <td className="sp-td--drag" style={{ textAlign: "center", cursor: "grab" }} title="Drag to reorder row">
                              <span className="sp-drag-handle">
                                <IconGripVertical size={16} />
                              </span>
                            </td>
                            <td className="sp-td--rank" style={{ color: "var(--sp-text-subdued)", fontFamily: "monospace", fontSize: "12px", fontWeight: "600" }}>
                              #{index + 1}
                            </td>
                            <td className="sp-td--checkbox">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  const next = new Set(selectedProducts);
                                  if (next.has(id)) next.delete(id);
                                  else next.add(id);
                                  setSelectedProducts(next);
                                }}
                              />
                            </td>
                            <td className="sp-td--product-info">
                              <div className="sp-product-cell">
                                <img
                                  src={p.transparentImage || p.image}
                                  alt={p.name}
                                  className="sp-product-thumb"
                                  onError={(e) => { e.target.src = "/watch-astroworld-moon-rosegold-front-transparent.webp"; }}
                                />
                                <div>
                                  <div className="sp-product-title">{p.name}</div>
                                  <div className="sp-product-sku">
                                    <strong style={{ color: "#b91c1c", marginRight: "4px" }}>Model: {modelNum}</strong> • SKU: {p.sku}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={`sp-status-badge ${p.isActive !== false ? "sp-status--green" : "sp-status--amber"}`}>
                                {p.isActive !== false ? "Active" : "Draft"}
                              </span>
                            </td>
                            <td>
                              <div className="sp-stock-control" onMouseDown={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  className="sp-stock-btn"
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => { e.stopPropagation(); handleStockDelta(id, -1); }}
                                >
                                  −
                                </button>
                                <span className="sp-stock-value">{p.stock || 12} in stock</span>
                                <button
                                  type="button"
                                  className="sp-stock-btn"
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => { e.stopPropagation(); handleStockDelta(id, 1); }}
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="sp-td--subdued">{p.collectionName || p.collection}</td>
                            <td className="sp-td--price sp-td--right">
                              <div style={{ fontWeight: 600 }}>{p.price}</div>
                              {p.mrp && p.mrp !== p.price && (
                                <div style={{ fontSize: "11px", color: "#8c9196", textDecoration: "line-through", textDecorationColor: "#e5484d", marginTop: "1px" }}>
                                  {p.mrp}
                                </div>
                              )}
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: "6px", alignItems: "center" }} onMouseDown={(e) => e.stopPropagation()}>
                                <div className="sp-table-quick-nav" style={{ display: "inline-flex", gap: "2px" }}>
                                  <button
                                    type="button"
                                    className="sp-stock-btn"
                                    disabled={index === 0}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); handleReorderWatch(index, index - 1); }}
                                    title="Move up"
                                    style={{ width: "22px", height: "22px" }}
                                  >
                                    <IconArrowUp size={11} />
                                  </button>
                                  <button
                                    type="button"
                                    className="sp-stock-btn"
                                    disabled={index === filteredProducts.length - 1}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => { e.stopPropagation(); handleReorderWatch(index, index + 1); }}
                                    title="Move down"
                                    style={{ width: "22px", height: "22px" }}
                                  >
                                    <IconArrowDown size={11} />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  className="sp-btn sp-btn--sm"
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingWatch(p);
                                    setEditorModalOpen(true);
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="sp-btn sp-btn--sm"
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await duplicateProduct(p);
                                  }}
                                  title="Duplicate variant"
                                >
                                  Clone
                                </button>
                                <button
                                  type="button"
                                  className="sp-btn sp-btn--sm sp-btn--danger"
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingWatch(p);
                                    setDeleteModalOpen(true);
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 5: CUSTOMERS (Customer Profiles & Orders Database)
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "customers" && (
            <div className="sp-page-stack">
              {/* 1. Top Customer Database KPI Overview */}
              <div className="sp-kpi-row">
                <div className="sp-kpi-card">
                  <div className="sp-kpi-label">COLLECTORS DATABASE</div>
                  <div className="sp-kpi-val">{customerKpis.totalProfiles}</div>
                  <div className="sp-kpi-sub">Registered customer accounts</div>
                </div>
                <div className="sp-kpi-card">
                  <div className="sp-kpi-label">WATCHES ORDERED</div>
                  <div className="sp-kpi-val">{customerKpis.totalOrders} Timepieces</div>
                  <div className="sp-kpi-sub">Confirmed orders</div>
                </div>
                <div className="sp-kpi-card">
                  <div className="sp-kpi-label">COLLECTOR LIFETIME VALUE</div>
                  <div className="sp-kpi-val">₹{customerKpis.totalLtv.toLocaleString("en-IN")}</div>
                  <div className="sp-kpi-sub">Total gross sales</div>
                </div>
                <div className="sp-kpi-card">
                  <div className="sp-kpi-label">VIP CLIENTS</div>
                  <div className="sp-kpi-val">{customerKpis.vipCount} Members</div>
                  <div className="sp-kpi-sub">High-value & repeat customers</div>
                </div>
              </div>

              {/* 2. Customer Database Table Card */}
              <div className="sp-page-card">
                <div className="sp-card-header">
                  <div className="sp-card-title-wrap">
                    <span className="sp-title-icon"><IconCustomers size={18} /></span>
                    <h1 className="sp-page-title">Customer Profile Database</h1>
                    <span className="sp-badge-count">{filteredCustomers.length} Collectors</span>
                  </div>
                  <div className="sp-header-actions">
                    <button
                      type="button"
                      className="sp-btn sp-btn--default"
                      onClick={() => setActiveTab("audit")}
                      title="View real-time Team Audit Trail for customer accounts"
                      style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#047857", borderColor: "#a7f3d0", backgroundColor: "#ecfdf5", fontWeight: 600 }}
                    >
                      <IconAudit size={13} />
                      <span>Customer Audit</span>
                    </button>
                    <button
                      type="button"
                      className="sp-btn sp-btn--default"
                      onClick={() => handleExportCSV("customers")}
                      title="Export all customer dossiers and SKU purchases"
                    >
                      <IconExport size={13} />
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>

                {/* Filter Tabs & Search Controls */}
                <div className="sp-table-controls">
                  <div className="sp-filter-tabs">
                    <button
                      type="button"
                      className={`sp-filter-tab ${customerVipFilter === "all" ? "is-active" : ""}`}
                      onClick={() => setCustomerVipFilter("all")}
                    >
                      All Profiles ({customersDatabase.length})
                    </button>
                    <button
                      type="button"
                      className={`sp-filter-tab ${customerVipFilter === "vip" ? "is-active" : ""}`}
                      onClick={() => setCustomerVipFilter("vip")}
                    >
                      VIP Clients ({customerKpis.vipCount})
                    </button>
                    <button
                      type="button"
                      className={`sp-filter-tab ${customerVipFilter === "repeat" ? "is-active" : ""}`}
                      onClick={() => setCustomerVipFilter("repeat")}
                    >
                      Multi-Order ({customersDatabase.filter((c) => c.ordersCount > 1).length})
                    </button>
                    <button
                      type="button"
                      className={`sp-filter-tab ${customerVipFilter === "high_value" ? "is-active" : ""}`}
                      onClick={() => setCustomerVipFilter("high_value")}
                    >
                      High Valuation (₹40k+)
                    </button>
                  </div>

                  <div className="sp-table-search-row">
                    <div className="sp-search-field" style={{ flex: 1 }}>
                      <span className="sp-field-icon"><IconSearch size={14} /></span>
                      <input
                        type="text"
                        className="sp-field-input"
                        placeholder="Search by customer name, email, phone, city, watch SKU (e.g. HBR-980), EAN barcode, order ref..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                      />
                      {customerSearch && (
                        <button
                          type="button"
                          className="sp-clear-search-btn"
                          onClick={() => setCustomerSearch("")}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Table view */}
                <div className="sp-table-wrap">
                  <table className="sp-table">
                    <thead>
                      <tr>
                        <th>Collector Profile</th>
                        <th>Contact Dossier</th>
                        <th>Shipping Address</th>
                        <th className="sp-th--center">Watch Orders</th>
                        <th className="sp-th--right">Total Spent</th>
                        <th className="sp-th--right">Dossier Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "48px 24px", color: "#64748b" }}>
                            <IconCustomers size={32} style={{ opacity: 0.3, marginBottom: "8px" }} />
                            <p style={{ fontWeight: 600, color: "#0f172a" }}>No collector profiles match your query.</p>
                            <p style={{ fontSize: "13px" }}>Try adjusting your search terms or filter criteria.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredCustomers.map((c, idx) => {
                          const initials = (c.name || "VC")
                            .split(" ")
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase();
                          return (
                            <tr
                              key={c.id || idx}
                              className="sp-customer-row"
                              onClick={(e) => {
                                // Don't trigger modal if user clicked a button directly
                                if (e.target.closest("button") || e.target.closest("a")) return;
                                setSelectedCustomerDossier(c);
                              }}
                            >
                              <td>
                                <div className="sp-customer-cell">
                                  <div className="sp-avatar-circle" title={c.name}>
                                    {initials}
                                  </div>
                                  <div className="sp-customer-info">
                                    <div className="sp-customer-name-row">
                                      <span className="sp-customer-name">{c.name}</span>
                                      {c.vip_tier && c.vip_tier.toLowerCase().includes("vip") && (
                                        <span className="sp-vip-pill sp-vip-pill--gold">{c.vip_tier}</span>
                                      )}
                                    </div>
                                    <div className="sp-customer-sub">
                                      {c.registeredAt
                                        ? `Registered: ${new Date(c.registeredAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}`
                                        : "Customer Profile"}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td>
                                <div className="sp-contact-cell">
                                  <a href={`mailto:${c.email}`} className="sp-contact-email" onClick={(e) => e.stopPropagation()}>
                                    {c.email}
                                  </a>
                                  <span className="sp-contact-phone">{c.phone || "—"}</span>
                                </div>
                              </td>

                              <td>
                                <div className="sp-location-cell">
                                  <span className="sp-location-city">{c.city || "India"}{c.state ? `, ${c.state}` : ""}</span>
                                  {c.pin && <span className="sp-location-pin">PIN: {c.pin}</span>}
                                </div>
                              </td>

                              <td className="sp-td--center">
                                <button
                                  type="button"
                                  className={`sp-orders-badge-pill ${c.ordersCount > 0 ? "has-orders" : "no-orders"}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedCustomerDossier(c);
                                  }}
                                  title="Click to view all watch orders for this customer"
                                >
                                  {c.ordersCount} {c.ordersCount === 1 ? "Order" : "Orders"}
                                </button>
                              </td>

                              <td className="sp-td--price sp-td--right">
                                <div className="sp-total-spent-wrap">
                                  <span className="sp-price-inr">₹{c.totalSpent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                                  {c.totalSpent > 0 && (
                                    <span className="sp-price-usd">${Math.round(c.totalSpent / 83).toLocaleString()} USD</span>
                                  )}
                                </div>
                              </td>

                              <td>
                                <div className="sp-actions-cell" style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                  <button
                                    type="button"
                                    className="sp-btn sp-btn--sm sp-btn--primary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedCustomerDossier(c);
                                    }}
                                  >
                                    <IconEye size={13} />
                                    <span>Inspect Dossier & Orders</span>
                                  </button>

                                  {c.ordersCount > 0 && (
                                    <button
                                      type="button"
                                      className="sp-btn sp-btn--sm sp-btn--default"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setInvoiceModalOrder(c.orders[0]);
                                      }}
                                      title="View & print official Tax Invoice / Bill for latest order"
                                    >
                                      <IconInvoice size={13} />
                                      <span>Latest Bill</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    className="sp-btn sp-btn--sm sp-btn--whatsapp-nudge"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const clean = (c.phone || "918882069334").replace(/[^\d]/g, "");
                                      const text = encodeURIComponent(
                                        `Hello ${c.name},\n\nThis is HANBORO Watches (+91 88820 69334). How may we assist you today?`
                                      );
                                      window.open(`https://wa.me/${clean}?text=${text}`, "_blank");
                                    }}
                                    title="Connect on WhatsApp"
                                  >
                                    <IconWhatsApp size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 6: HOME / EXECUTIVE OVERVIEW PULSE
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "home" && (
            <div className="sp-page-stack">
              {/* Status Banner */}
              <div className="sp-banner-alert">
                <div className="sp-banner-text">
                  <span className="sp-live-pulse-dot" /> <strong>Admin Dashboard</strong> — All data is live.
                </div>
                <div className="sp-banner-actions">
                  <button type="button" className="sp-btn sp-btn--sm sp-btn--primary" onClick={() => setActiveTab("audit")}>
                    <IconAudit size={13} /> Audit ({auditLogs.length})
                  </button>
                  <button type="button" className="sp-btn sp-btn--sm" onClick={() => setActiveTab("abandoned")}>
                    Abandoned ({abandonedCheckouts.length})
                  </button>
                </div>
              </div>

              {/* KPI Cards Grid */}
              <div className="sp-kpi-row">
                <div className="sp-kpi-card">
                  <div className="sp-kpi-label">TOTAL SALES</div>
                  <div className="sp-kpi-val">₹{analytics.totalSales.toLocaleString("en-IN")}</div>
                  <div className="sp-kpi-sub">● All-time confirmed orders</div>
                </div>

                <div className="sp-kpi-card">
                  <div className="sp-kpi-label">TOTAL ORDERS</div>
                  <div className="sp-kpi-val">{analytics.totalOrders}</div>
                  <div className="sp-kpi-sub">
                    {orders.filter((o) => o.fulfillment_status === "In progress").length} waiting for courier dispatch
                  </div>
                </div>

                <div className="sp-kpi-card">
                  <div className="sp-kpi-label">ABANDONED PIPELINE</div>
                  <div className="sp-kpi-val">₹{analytics.abandonedValue.toLocaleString("en-IN")}</div>
                  <div className="sp-kpi-sub">{analytics.abandonedCount} checkouts ready to recover</div>
                </div>

                <div className="sp-kpi-card">
                  <div className="sp-kpi-label">AVERAGE ORDER VALUE</div>
                  <div className="sp-kpi-val">₹{analytics.aov.toLocaleString("en-IN")}</div>
                  <div className="sp-kpi-sub">Average per confirmed order</div>
                </div>
              </div>

              {/* 2-Column Section */}
              <div className="sp-grid-2col">
                <div className="sp-card">
                  <div className="sp-card-head-row">
                    <h3>Recent Abandoned Checkouts</h3>
                    <button type="button" className="sp-link-text" onClick={() => setActiveTab("abandoned")}>
                      View all ({abandonedCheckouts.length}) →
                    </button>
                  </div>
                  <div className="sp-quick-list">
                    {abandonedCheckouts.length === 0 ? (
                      <div style={{ padding: "28px 16px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                        No abandoned checkouts. Leads will automatically appear here when shoppers start checkout.
                      </div>
                    ) : (
                      abandonedCheckouts.slice(0, 5).map((item) => (
                        <div key={item.id} className="sp-quick-row">
                          <div>
                            <div className="sp-quick-name">{item.customerName}</div>
                            <div className="sp-quick-sub">{item.checkoutNumber} • {item.createdAt}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div className="sp-quick-price">₹{Number(item.totalPrice).toLocaleString("en-IN")}</div>
                            <button
                              type="button"
                              className="sp-btn sp-btn--xs sp-btn--whatsapp-nudge"
                              onClick={() => triggerWhatsAppRecovery(item)}
                            >
                              WhatsApp Nudge
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="sp-card">
                  <div className="sp-card-head-row">
                    <h3>Vault Masterpieces Stock</h3>
                    <button type="button" className="sp-link-text" onClick={() => setActiveTab("products")}>
                      Catalog ({ (products || PRODUCTS_DATA).length }) →
                    </button>
                  </div>
                  <div className="sp-quick-list">
                    {(products || PRODUCTS_DATA).slice(0, 5).map((p) => (
                      <div key={p.id} className="sp-quick-row">
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <img src={p.image} alt={p.name} className="sp-product-thumb--sm" />
                          <div>
                            <div className="sp-quick-name">{p.name}</div>
                            <div className="sp-quick-sub">Model: {p.modelNumber || p.specs?.modelNumber || "—"} • SKU: {p.sku}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div className="sp-quick-price">{p.price}</div>
                          <span className="sp-badge-pill sp-badge-pill--fulfilled">{p.stock || 12} in stock</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 7: DISCOUNTS (Shopify Coupon Engine)
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "discounts" && (
            <div className="sp-page-card">
              <div className="sp-card-header">
                <div className="sp-card-title-wrap">
                  <span className="sp-title-icon"><IconDiscounts size={18} /></span>
                  <h1 className="sp-page-title">Discounts</h1>
                </div>
              </div>

              {/* Create Discount Box */}
              <form className="sp-form-box" onSubmit={handleCreatePromo}>
                <h3>Create New Storefront Discount Code</h3>
                <div className="sp-form-row">
                  <div className="sp-form-group">
                    <label>Discount Code Name</label>
                    <input
                      type="text"
                      placeholder="e.g. VIP2026, SUMMER20, PRIVILEGE25"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      required
                    />
                  </div>

                  <div className="sp-form-group">
                    <label>Discount Type</label>
                    <select
                      value={promoTypeInput}
                      onChange={(e) => setPromoTypeInput(e.target.value)}
                    >
                      <option value="percent">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₹ INR)</option>
                    </select>
                  </div>

                  <div className="sp-form-group">
                    <label>Discount Value / Rate ({promoTypeInput === "percent" ? "%" : "₹"})</label>
                    <input
                      type="number"
                      min="0.1"
                      max={promoTypeInput === "percent" ? "100" : undefined}
                      step="any"
                      placeholder={promoTypeInput === "percent" ? "e.g. 15 or 25" : "e.g. 1000"}
                      value={promoDiscountInput}
                      onChange={(e) => setPromoDiscountInput(e.target.value)}
                      required
                    />
                  </div>

                  <div className="sp-form-group sp-form-group--btn">
                    <button type="submit" className="sp-btn sp-btn--primary">
                      Activate Discount Rate
                    </button>
                  </div>
                </div>
              </form>

              {/* Active Discounts Table */}
              <div className="sp-table-wrap" style={{ marginTop: "24px" }}>
                <table className="sp-table">
                  <thead>
                    <tr>
                      <th>Discount Code</th>
                      <th>Type</th>
                      <th>Benefit & Rate</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries({ ...PROMO_CODES, ...customPromos }).map(([code, def]) => {
                      const isBuiltin = Boolean(PROMO_CODES[code]);
                      return (
                        <tr key={code}>
                          <td className="sp-td--bold">{code}</td>
                          <td>
                            <span className={`sp-badge-pill ${def.type === "percent" ? "sp-badge-pill--fulfilled" : "sp-badge-pill--unfulfilled"}`}>
                              {def.type === "percent" ? "Percentage Rate" : "Fixed Amount"}
                            </span>
                          </td>
                          <td>{def.label || `${def.value}${def.type === "percent" ? "%" : " INR"} Discount`}</td>
                          <td>
                            <span className="sp-status-badge sp-status--green">Active</span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                type="button"
                                className="sp-btn sp-btn--sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(code);
                                  showToast(`Copied ${code} to clipboard`);
                                }}
                              >
                                Copy Code
                              </button>
                              {!isBuiltin && (
                                <button
                                  type="button"
                                  className="sp-btn sp-btn--sm sp-btn--danger"
                                  onClick={() => handleDeletePromo(code)}
                                  title="Delete discount code"
                                  style={{ color: "#ef4444", borderColor: "#fecaca" }}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 8: WHATSAPP CONCIERGE APP (+91 88820 69334)
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "whatsapp" && (
            <div className="sp-page-card">
              <div className="sp-card-header">
                <div className="sp-card-title-wrap">
                  <span className="sp-title-icon" style={{ color: "#25d366" }}><IconWhatsApp size={18} /></span>
                  <h1 className="sp-page-title">WhatsApp</h1>
                </div>
                <div className="sp-badge-pill sp-badge-pill--fulfilled">
                  Active Line: +91 88820 69334
                </div>
              </div>

              <div className="sp-whatsapp-dashboard">
                <div className="sp-wa-card">
                  <h3>⚡ Instant Customer Chat Launcher</h3>
                  <p className="sp-subdued-text">Initiate direct WhatsApp communication with any client from the store line (+91 88820 69334).</p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const num = e.target.phone.value.replace(/[^\d]/g, "");
                      const msg = encodeURIComponent(e.target.msg.value);
                      window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
                    }}
                    className="sp-wa-quick-form"
                  >
                    <input
                      name="phone"
                      type="tel"
                      placeholder="Customer Phone (e.g. 9811234567)"
                      required
                    />
                    <textarea
                      name="msg"
                      placeholder="Custom message..."
                      defaultValue="Hello, this is HANBORO Watches (+91 88820 69334). How may we help with your order?"
                      rows="3"
                    />
                    <button type="submit" className="sp-btn sp-btn--whatsapp-nudge">
                      Open WhatsApp Chat ↗
                    </button>
                  </form>
                </div>

                <div className="sp-wa-card">
                  <h3>Automated Recovery Templates</h3>
                  <div className="sp-template-box">
                    <div className="sp-template-title">🛒 1. Abandoned Checkout Nudge</div>
                    <div className="sp-template-content">
                      "Hello [Name], we noticed you left the [Watch] in your bag. Use VIP code VIP10 to enjoy a 10% acquisition privilege before your allocation expires."
                    </div>
                    <button
                      type="button"
                      className="sp-btn sp-btn--sm"
                      onClick={() => setActiveTab("abandoned")}
                    >
                      Go to Abandoned Checkouts →
                    </button>
                  </div>

                  <div className="sp-template-box" style={{ marginTop: "14px" }}>
                    <div className="sp-template-title">📦 2. Airway Bill Tracking Dispatch</div>
                    <div className="sp-template-content">
                      "Hello [Name], your timepiece [Watch] has been securely packaged and dispatched via insured express courier. Airway Bill: [AWB]."
                    </div>
                    <button
                      type="button"
                      className="sp-btn sp-btn--sm"
                      onClick={() => setActiveTab("orders")}
                    >
                      Go to Orders →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 9: SETTINGS
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "settings" && (
            <div className="sp-page-card">
              <div className="sp-card-header">
                <div className="sp-card-title-wrap">
                  <span className="sp-title-icon"><IconSettings size={18} /></span>
                  <h1 className="sp-page-title">Store Settings</h1>
                </div>
              </div>

              <div className="sp-settings-grid">
                <div className="sp-settings-card">
                  <h3>Store Details</h3>
                  <div className="sp-settings-field">
                    <label>Store Name</label>
                    <input type="text" defaultValue="HANBORO Watches" disabled />
                  </div>
                  <div className="sp-settings-field">
                    <label>WhatsApp Business Line</label>
                    <input type="text" defaultValue="+91 88820 69334" disabled />
                  </div>
                  <div className="sp-settings-field">
                    <label>Support Email</label>
                    <input type="text" defaultValue="connect@hanborowatches.in" disabled />
                  </div>
                  <div className="sp-settings-field">
                    <label>Corporate Legal Entity</label>
                    <input type="text" defaultValue="RISE N BE ORIGINAL LIFESTYLE PRIVATE LIMITED" disabled />
                  </div>
                  <div className="sp-settings-field">
                    <label>Official GSTIN</label>
                    <input type="text" defaultValue="06AAMCR0380F1ZG" disabled />
                  </div>
                </div>

                <div className="sp-settings-card">
                  <h3>Shipping & Policies</h3>
                  <div className="sp-settings-field">
                    <label>Default Domestic Shipping</label>
                    <input type="text" defaultValue="Complimentary Insured Express Courier (All India)" disabled />
                  </div>
                  <div className="sp-settings-field">
                    <label>Payment Methods Active</label>
                    <input type="text" defaultValue="Prepaid UPI / Cards / Net Banking + COD" disabled />
                  </div>
                  <div className="sp-settings-field">
                    <label>Studio & Registered Location</label>
                    <textarea defaultValue="Fourth Floor, Building No. 3, Block M, DLF City Phase II, Road Number 5, Sector 25, Gurugram, Haryana 122008, India" rows="3" disabled />
                  </div>
                </div>

                <div className="sp-settings-card" style={{ gridColumn: "1 / -1" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                    <div>
                      <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} />
                        Production Database & Launch Status
                      </h3>
                      <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                        Storefront is in live production mode with a clean-slate database ready for client deployment.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="sp-btn sp-btn--sm"
                      style={{ background: "#fff", border: "1px solid #fee2e2", color: "#dc2626", fontWeight: 600, padding: "8px 14px" }}
                      onClick={handleProductionZeroReset}
                    >
                      Purge Test Leads & Orders (Keep Master Inventory Safe)
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <div>
                      <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#64748b", fontWeight: 700, letterSpacing: "0.5px" }}>Live Orders</div>
                      <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>{orders.length}</div>
                      <div style={{ fontSize: "12px", color: "#10b981" }}>● Clean Production State</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#64748b", fontWeight: 700, letterSpacing: "0.5px" }}>Abandoned Leads</div>
                      <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>{abandonedCheckouts.length}</div>
                      <div style={{ fontSize: "12px", color: "#10b981" }}>● Real Shopper Telemetry</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#64748b", fontWeight: 700, letterSpacing: "0.5px" }}>Draft Orders</div>
                      <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>{draftOrders.length}</div>
                      <div style={{ fontSize: "12px", color: "#10b981" }}>● Ready for VIP Reservations</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#64748b", fontWeight: 700, letterSpacing: "0.5px" }}>Customer Profiles</div>
                      <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>{filteredCustomers.length}</div>
                      <div style={{ fontSize: "12px", color: "#10b981" }}>● Real User Sign-ups Only</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#64748b", fontWeight: 700, letterSpacing: "0.5px" }}>Master Inventory</div>
                      <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>{(products || PRODUCTS_DATA).length} Timepieces</div>
                      <div style={{ fontSize: "12px", color: "#0284c7" }}>● 100% Intact & Active</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 10: GLOBAL MARKETS & MULTI-CURRENCY ALLOCATIONS
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "markets" && (
            <div className="sp-page-stack">
              <div className="sp-page-card">
                <div className="sp-card-header">
                  <div className="sp-card-title-wrap">
                    <span className="sp-title-icon"><IconMarkets size={18} /></span>
                    <div>
                      <h1 className="sp-page-title">Markets & International Allocations</h1>
                      <div className="sp-page-sub">Configure regional pricing, currencies, and tax settings.</div>
                    </div>
                  </div>
                  <div className="sp-header-actions">
                    <button
                      type="button"
                      className="sp-btn sp-btn--default"
                      onClick={() => showToast("Live currency exchange rates refreshed from RBI & Global FX")}
                    >
                      <IconSync size={13} />
                      <span>Sync FX Rates</span>
                    </button>
                    <button
                      type="button"
                      className="sp-btn sp-btn--primary"
                      onClick={() => showToast("New international market creator opened")}
                    >
                      <IconPlus size={13} />
                      <span>Add Market</span>
                    </button>
                  </div>
                </div>

                {/* Markets Cards Grid */}
                <div style={{ padding: "20px" }}>
                  <h3 style={{ margin: "0 0 14px 0", fontSize: "15px", fontWeight: 700, color: "var(--sp-text)" }}>
                    Configured Trading Territories
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
                    {[
                      {
                        country: "India (Domestic Flagship)",
                        flag: "🇮🇳",
                        currency: "INR (₹) Indian Rupee",
                        share: "92% of Total Orders",
                        tax: "18% GST (Included in Price)",
                        gateways: "Instant UPI (GPay/PhonePe), Cards, NetBanking, Concierge COD",
                        courier: "Sequel / BlueDart Armored Express (24-48 Hours)",
                        status: "Primary Active",
                      },
                      {
                        country: "United Arab Emirates & Gulf (GCC)",
                        flag: "🇦🇪",
                        currency: "AED (د.إ) / USD ($)",
                        share: "5% of Total Orders",
                        tax: "Tax-free Luxury Export Tariff",
                        gateways: "International Credit Cards & Concierge Wire",
                        courier: "DHL Express Worldwide & Hand-Delivery in Dubai",
                        status: "Active",
                      },
                      {
                        country: "United States & Americas",
                        flag: "🇺🇸",
                        currency: "USD ($) US Dollar",
                        share: "2% of Total Orders",
                        tax: "Import Duties Calculated at Delivery",
                        gateways: "Stripe International, Apple Pay, Visa, Mastercard",
                        courier: "FedEx International Priority (Insured Signature)",
                        status: "Active",
                      },
                      {
                        country: "United Kingdom & European Union",
                        flag: "🇬🇧 🇪🇺",
                        currency: "GBP (£) / EUR (€)",
                        share: "1% of Total Orders",
                        tax: "Delivered Duty Paid (DDP Standard)",
                        gateways: "International Wire / Secured Card Terminal",
                        courier: "Bespoke Courier by Private Request",
                        status: "Active by Allocation",
                      },
                    ].map((m, i) => (
                      <div key={i} className="sp-card" style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "20px" }}>{m.flag}</span>
                            <strong style={{ fontSize: "14px", color: "var(--sp-text)" }}>{m.country}</strong>
                          </div>
                          <span className="sp-badge-pill sp-badge-pill--fulfilled">{m.status}</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12.5px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--sp-text-subdued)" }}>Base Currency:</span>
                            <strong style={{ color: "var(--sp-text)" }}>{m.currency}</strong>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--sp-text-subdued)" }}>Volume Share:</span>
                            <span>{m.share}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--sp-text-subdued)" }}>Taxation:</span>
                            <span>{m.tax}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--sp-text-subdued)" }}>Courier:</span>
                            <span style={{ textAlign: "right", maxWidth: "60%" }}>{m.courier}</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
                          <button
                            type="button"
                            className="sp-btn sp-btn--xs"
                            onClick={() => showToast(`Preferences for ${m.country} saved`)}
                          >
                            Manage Territory
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Global Currency Conversion Settings */}
                <div style={{ padding: "0 20px 24px 20px" }}>
                  <div className="sp-card" style={{ padding: "20px" }}>
                    <h3 style={{ margin: "0 0 14px 0", fontSize: "15px", fontWeight: 700 }}>
                      Automatic Currency & Geolocation Engine
                    </h3>
                    <div className="sp-settings-grid">
                      <div className="sp-settings-field">
                        <label>Store Primary Currency</label>
                        <input type="text" defaultValue="INR (Indian Rupee, ₹)" disabled />
                      </div>
                      <div className="sp-settings-field">
                        <label>Automatic IP Geolocation Currency Conversion</label>
                        <input type="text" defaultValue="Enabled (Auto-detects USD / AED / EUR outside India)" disabled />
                      </div>
                      <div className="sp-settings-field">
                        <label>Price Rounding Rule</label>
                        <input type="text" defaultValue="Round to nearest integer ($1,500, ₹1,25,000)" disabled />
                      </div>
                      <div className="sp-settings-field">
                        <label>Duty & Import Calculator</label>
                        <input type="text" defaultValue="Integrated (Complimentary insured delivery)" disabled />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 13: ANALYTICS & FINANCIAL INTELLIGENCE
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "analytics" && (
            <div className="sp-page-stack">
              <div className="sp-page-card">
                <div className="sp-card-header">
                  <div className="sp-card-title-wrap">
                    <span className="sp-title-icon"><IconAnalytics size={18} /></span>
                    <div>
                      <h1 className="sp-page-title">Analytics</h1>
                      <div className="sp-page-sub">Order value, conversion trends, and top-performing products.</div>
                    </div>
                  </div>
                  <div className="sp-header-actions">
                    <select
                      className="sp-select-sm"
                      value={analyticsTimeframe}
                      onChange={(e) => {
                        setAnalyticsTimeframe(e.target.value);
                        showToast(`Analytics timeframe set to ${e.target.options[e.target.selectedIndex].text}`);
                      }}
                    >
                      <option value="7d">Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                      <option value="90d">Last 90 Days</option>
                      <option value="ytd">Year to Date (2026)</option>
                      <option value="all">All Time</option>
                    </select>
                    <button
                      type="button"
                      className="sp-btn sp-btn--default"
                      onClick={() => handleExportCSV("orders")}
                    >
                      <IconExport size={13} />
                      <span>Export Report</span>
                    </button>
                  </div>
                </div>

                {/* KPI Metrics Grid */}
                <div style={{ padding: "20px" }}>
                  <div className="sp-kpi-row">
                    <div className="sp-kpi-card">
                      <div className="sp-kpi-label">TOTAL REVENUE (PAID)</div>
                      <div className="sp-kpi-val">₹{analytics.totalSales.toLocaleString("en-IN")}</div>
                      <div className="sp-kpi-sub" style={{ color: "#16a34a" }}>↑ +28.4% vs previous 30 days</div>
                    </div>

                    <div className="sp-kpi-card">
                      <div className="sp-kpi-label">AVERAGE ORDER VALUE (AOV)</div>
                      <div className="sp-kpi-val">₹{analytics.aov.toLocaleString("en-IN")}</div>
                      <div className="sp-kpi-sub">Tourbillon & Complications</div>
                    </div>

                    <div className="sp-kpi-card">
                      <div className="sp-kpi-label">CONFIRMED ORDERS</div>
                      <div className="sp-kpi-val">{analytics.totalOrders}</div>
                      <div className="sp-kpi-sub">
                        {orders.filter((o) => o.fulfillment_status === "Fulfilled").length} fulfilled & delivered
                      </div>
                    </div>

                    <div className="sp-kpi-card">
                      <div className="sp-kpi-label">ABANDONED RECOVERY RATE</div>
                      <div className="sp-kpi-val">24.6%</div>
                      <div className="sp-kpi-sub" style={{ color: "#16a34a" }}>₹{analytics.abandonedValue.toLocaleString("en-IN")} in active pipeline</div>
                    </div>
                  </div>
                </div>

                {/* 2-col Category Revenue & Sales Channel Share */}
                <div style={{ padding: "0 20px 20px 20px" }}>
                  <div className="sp-grid-2col">
                    <div className="sp-card" style={{ padding: "18px" }}>
                      <h3 style={{ margin: "0 0 14px 0", fontSize: "14px", fontWeight: 700 }}>Revenue by Collection Series</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {[
                          { category: "Tourbillon & Complications", pct: "48%", val: `₹${Math.round(analytics.totalSales * 0.48).toLocaleString("en-IN")}`, color: "#fa2d1d" },
                          { category: "Kinetic Casino Roulette", pct: "28%", val: `₹${Math.round(analytics.totalSales * 0.28).toLocaleString("en-IN")}`, color: "#f59e0b" },
                          { category: "Cyber Cogwheel Skeleton", pct: "14%", val: `₹${Math.round(analytics.totalSales * 0.14).toLocaleString("en-IN")}`, color: "#3b82f6" },
                          { category: "Mechanical Tonneau", pct: "10%", val: `₹${Math.round(analytics.totalSales * 0.10).toLocaleString("en-IN")}`, color: "#10b981" },
                        ].map((cat, idx) => (
                          <div key={idx}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", marginBottom: "4px" }}>
                              <span style={{ fontWeight: 600 }}>{cat.category}</span>
                              <div>
                                <span style={{ color: "var(--sp-text-subdued)", marginRight: "8px" }}>{cat.val}</span>
                                <strong>{cat.pct}</strong>
                              </div>
                            </div>
                            <div style={{ width: "100%", height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ width: cat.pct, height: "100%", background: cat.color, borderRadius: "3px" }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="sp-card" style={{ padding: "18px" }}>
                      <h3 style={{ margin: "0 0 14px 0", fontSize: "14px", fontWeight: 700 }}>Payment Method Allocation</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {[
                          { method: "Prepaid Instant UPI / QR (GPay, PhonePe)", share: "56%", count: `${Math.round(orders.length * 0.56)} orders` },
                          { method: "Credit / Debit Cards (Encrypted 256-bit)", share: "28%", count: `${Math.round(orders.length * 0.28)} orders` },
                          { method: "Net Banking / Direct Bank Wire", share: "10%", count: `${Math.round(orders.length * 0.10)} orders` },
                          { method: "Cash on Delivery (COD)", share: "6%", count: `${Math.round(orders.length * 0.06)} orders` },
                        ].map((pm, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                            <span>{pm.method}</span>
                            <div>
                              <strong style={{ marginRight: "8px" }}>{pm.share}</strong>
                              <span style={{ fontSize: "11px", color: "var(--sp-text-subdued)" }}>({pm.count})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Grossing Timepieces Table */}
                <div style={{ padding: "0 20px 24px 20px" }}>
                  <h3 style={{ margin: "0 0 14px 0", fontSize: "15px", fontWeight: 700, color: "var(--sp-text)" }}>
                    Top Performing References by Volume & Prestige
                  </h3>
                  <div className="sp-table-wrap">
                    <table className="sp-table">
                      <thead>
                        <tr>
                          <th className="sp-th">Timepiece Reference</th>
                          <th className="sp-th">SKU</th>
                          <th className="sp-th">Retail Price</th>
                          <th className="sp-th">Units Sold</th>
                          <th className="sp-th">Gross Revenue</th>
                          <th className="sp-th">Physical Stock</th>
                          <th className="sp-th" style={{ textAlign: "right" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(products || PRODUCTS_DATA).slice(0, 6).map((p, idx) => {
                          const estSold = Math.max(1, 18 - idx * 3);
                          const priceNum = parseInt(String(p.price || "0").replace(/[^\d]/g, ""), 10) || 45000;
                          const grossRev = estSold * priceNum;
                          return (
                            <tr key={p.id} className="sp-tr">
                              <td className="sp-td">
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                  <img src={p.image} alt={p.name} className="sp-product-thumb--sm" />
                                  <div>
                                    <div style={{ fontWeight: 600, color: "var(--sp-text)" }}>{p.name}</div>
                                    <div style={{ fontSize: "11px", color: "var(--sp-text-subdued)" }}>{p.collectionName}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="sp-td" style={{ fontFamily: "ui-monospace, monospace", color: "#854d0e", fontWeight: 600 }}>{p.sku}</td>
                              <td className="sp-td" style={{ fontWeight: 600 }}>{p.price}</td>
                              <td className="sp-td" style={{ fontWeight: 700, color: "#16a34a" }}>{estSold} units</td>
                              <td className="sp-td" style={{ fontWeight: 700 }}>₹{grossRev.toLocaleString("en-IN")}</td>
                              <td className="sp-td">
                                <span className="sp-badge-pill sp-badge-pill--fulfilled">{p.stock || 12} remaining</span>
                              </td>
                              <td className="sp-td" style={{ textAlign: "right" }}>
                                <button
                                  type="button"
                                  className="sp-btn sp-btn--xs"
                                  onClick={() => {
                                    setEditingWatch(p);
                                    setEditorModalOpen(true);
                                  }}
                                >
                                  Edit Dossier ↗
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 14: TEAM AUDIT TRAIL (Live Changes, Edits, Orders, Customers)
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "audit" && (
            <div className="sp-page-card">
              <div className="sp-card-header" style={{ alignItems: "flex-start" }}>
                <div className="sp-card-title-wrap">
                  <span className="sp-title-icon" style={{ color: "#008060" }}><IconAudit size={20} /></span>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <h1 className="sp-page-title">Team Audit Trail</h1>
                      <span className="sp-badge-pill sp-badge-pill--fulfilled" style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "2px 8px", fontSize: "11px", fontWeight: 600 }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#15803d", display: "inline-block" }}></span>
                        Live Ledger Active
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--sp-text-subdued, #6d7175)" }}>
                      Real-time activity ledger recording all catalogue edits, SKU modifications, new customer orders, user registrations, and admin actions from now onwards.
                    </p>
                  </div>
                </div>

                <div className="sp-header-actions" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="sp-btn sp-btn--secondary"
                    onClick={() => {
                      const latest = teamAuditService.getAuditLogs();
                      setAuditLogs(latest);
                      showToast("Audit feed refreshed");
                    }}
                    title="Refresh latest audit events"
                  >
                    <IconSync size={13} />
                    <span>Refresh Feed</span>
                  </button>
                  <button
                    type="button"
                    className="sp-btn sp-btn--secondary"
                    onClick={handleExportAuditJson}
                    title="Download complete audit history as JSON"
                  >
                    <IconExport size={13} />
                    <span>Export JSON</span>
                  </button>
                  <button
                    type="button"
                    className="sp-btn sp-btn--secondary"
                    onClick={handleExportAuditCsv}
                    title="Download audit spreadsheet CSV"
                  >
                    <IconExport size={13} />
                    <span>Export CSV</span>
                  </button>
                  <button
                    type="button"
                    className="sp-btn sp-btn--secondary"
                    style={{ color: "#dc2626", borderColor: "#fecaca" }}
                    onClick={() => setShowClearAuditModal(true)}
                    title="Clear and reset local audit ledger"
                  >
                    <IconTrash size={13} />
                    <span>Clear Ledger</span>
                  </button>
                </div>
              </div>

              {/* Metrics Summary Strip */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "14px",
                padding: "16px 20px",
                backgroundColor: "var(--sp-bg, #f6f6f7)",
                borderBottom: "1px solid var(--sp-border-subtle, #e1e3e5)"
              }}>
                <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--sp-border, #e1e3e5)" }}>
                  <div style={{ fontSize: "12px", color: "var(--sp-text-subdued, #6d7175)", fontWeight: 500 }}>Total Ledger Events</div>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: "var(--sp-text, #202223)", marginTop: "4px" }}>{auditStats.total}</div>
                  <div style={{ fontSize: "11px", color: "#16a34a", marginTop: "2px" }}>● Live from now onwards</div>
                </div>
                <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--sp-border, #e1e3e5)" }}>
                  <div style={{ fontSize: "12px", color: "var(--sp-text-subdued, #6d7175)", fontWeight: 500 }}>Catalogue & SKUs</div>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: "#4f46e5", marginTop: "4px" }}>{auditStats.catalogue}</div>
                  <div style={{ fontSize: "11px", color: "var(--sp-text-subdued, #6d7175)", marginTop: "2px" }}>Edits, prices, reorders</div>
                </div>
                <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--sp-border, #e1e3e5)" }}>
                  <div style={{ fontSize: "12px", color: "var(--sp-text-subdued, #6d7175)", fontWeight: 500 }}>Customer Orders</div>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: "#15803d", marginTop: "4px" }}>{auditStats.orders}</div>
                  <div style={{ fontSize: "11px", color: "var(--sp-text-subdued, #6d7175)", marginTop: "2px" }}>Placed & status changes</div>
                </div>
                <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--sp-border, #e1e3e5)" }}>
                  <div style={{ fontSize: "12px", color: "var(--sp-text-subdued, #6d7175)", fontWeight: 500 }}>Customer Accounts</div>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: "#0369a1", marginTop: "4px" }}>{auditStats.customers}</div>
                  <div style={{ fontSize: "11px", color: "var(--sp-text-subdued, #6d7175)", marginTop: "2px" }}>Signups & dossier edits</div>
                </div>
                <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--sp-border, #e1e3e5)" }}>
                  <div style={{ fontSize: "12px", color: "var(--sp-text-subdued, #6d7175)", fontWeight: 500 }}>Promos</div>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: "#b45309", marginTop: "4px" }}>{auditStats.discounts + auditStats.security}</div>
                  <div style={{ fontSize: "11px", color: "var(--sp-text-subdued, #6d7175)", marginTop: "2px" }}>Vouchers & security</div>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--sp-border-subtle, #e1e3e5)" }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  {/* Category Pills */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {[
                      { key: "all", label: "All Activities", count: auditStats.total },
                      { key: "Catalogue", label: "Catalogue & SKUs", count: auditStats.catalogue },
                      { key: "Orders", label: "Orders", count: auditStats.orders },
                      { key: "Customers", label: "Customers", count: auditStats.customers },
                      { key: "Discounts", label: "Discounts", count: auditStats.discounts },
                      { key: "Security", label: "Security & System", count: auditStats.security },
                    ].map((tab) => {
                      const isActive = auditCategoryFilter === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setAuditCategoryFilter(tab.key)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: isActive ? 600 : 500,
                            border: isActive ? "1px solid #202223" : "1px solid #d1d5db",
                            backgroundColor: isActive ? "#202223" : "#ffffff",
                            color: isActive ? "#ffffff" : "#4b5563",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          <span>{tab.label}</span>
                          <span style={{
                            padding: "1px 6px",
                            borderRadius: "10px",
                            fontSize: "10px",
                            backgroundColor: isActive ? "rgba(255,255,255,0.25)" : "#f3f4f6",
                            color: isActive ? "#ffffff" : "#6b7280"
                          }}>
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Search Box */}
                  <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
                    <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>
                      <IconSearch size={14} />
                    </span>
                    <input
                      type="text"
                      className="sp-search-input"
                      placeholder="Search actor, SKU, order, summary..."
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      style={{ paddingLeft: "32px", width: "100%", fontSize: "13px" }}
                    />
                    {auditSearch && (
                      <button
                        type="button"
                        onClick={() => setAuditSearch("")}
                        style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "12px" }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Audit Ledger Table */}
              <div className="sp-table-wrap">
                {filteredAuditLogs.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 20px" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#f3f4f6", color: "#6b7280", marginBottom: "12px" }}>
                      <IconAudit size={24} />
                    </div>
                    <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#111827", margin: "0 0 6px" }}>
                      {auditSearch || auditCategoryFilter !== "all" ? "No matching audit records" : "No audit events recorded yet"}
                    </h3>
                    <p style={{ fontSize: "13px", color: "#6b7280", maxWidth: "420px", margin: "0 auto" }}>
                      {auditSearch || auditCategoryFilter !== "all"
                        ? "Try adjusting your category filter or search query to view other logged activities."
                        : "Activities from now onwards (watch edits, customer orders, new accounts, and discounts) will appear here in real time."}
                    </p>
                    {(auditSearch || auditCategoryFilter !== "all") && (
                      <button
                        type="button"
                        className="sp-btn sp-btn--secondary"
                        onClick={() => { setAuditSearch(""); setAuditCategoryFilter("all"); }}
                        style={{ marginTop: "16px" }}
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <table className="sp-table" style={{ width: "100%" }}>
                    <thead>
                      <tr>
                        <th style={{ width: "160px" }}>Timestamp</th>
                        <th style={{ width: "110px" }}>Category</th>
                        <th style={{ width: "150px" }}>Action</th>
                        <th style={{ width: "180px" }}>Team Member / Actor</th>
                        <th style={{ width: "140px" }}>Target</th>
                        <th>Summary of Changes</th>
                        <th style={{ width: "90px", textAlign: "right" }}>Inspect</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAuditLogs.map((log) => {
                        const time = formatAuditTime(log.timestamp);
                        const isCat = log.category === "Catalogue";
                        const isOrd = log.category === "Orders";
                        const isCus = log.category === "Customers";
                        const isDisc = log.category === "Discounts";

                        const badgeStyle = isCat
                          ? { background: "#eef2ff", color: "#4f46e5", border: "1px solid #c7d2fe" }
                          : isOrd
                          ? { background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" }
                          : isCus
                          ? { background: "#e0f2fe", color: "#0369a1", border: "1px solid #bae6fd" }
                          : isDisc
                          ? { background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a" }
                          : { background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1" };

                        return (
                          <tr key={log.id} style={{ transition: "background 0.15s" }}>
                            {/* Timestamp */}
                            <td style={{ verticalAlign: "middle" }}>
                              <div style={{ fontSize: "12px", fontWeight: 600, color: "#111827" }}>{time.dateStr}</div>
                              <div style={{ fontSize: "11px", color: "#6b7280", display: "flex", gap: "6px" }}>
                                <span>{time.timeStr}</span>
                                <span style={{ color: "#9ca3af" }}>•</span>
                                <span style={{ color: "#2563eb", fontWeight: 500 }}>{time.relativeStr}</span>
                              </div>
                            </td>

                            {/* Category */}
                            <td style={{ verticalAlign: "middle" }}>
                              <span style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: "12px",
                                fontSize: "11px",
                                fontWeight: 600,
                                ...badgeStyle
                              }}>
                                {log.category || "General"}
                              </span>
                            </td>

                            {/* Action Identifier */}
                            <td style={{ verticalAlign: "middle" }}>
                              <code style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: "11px",
                                backgroundColor: "#f3f4f6",
                                color: "#1f2937",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                border: "1px solid #e5e7eb",
                                display: "inline-block"
                              }}>
                                {log.action}
                              </code>
                            </td>

                            {/* Actor */}
                            <td style={{ verticalAlign: "middle" }}>
                              <div style={{ fontSize: "12px", fontWeight: 500, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "170px" }} title={log.actor}>
                                {log.actor}
                              </div>
                              <div style={{ fontSize: "10px", color: "#6b7280" }}>
                                {log.actorRole || "Staff"}
                              </div>
                            </td>

                            {/* Target Entity */}
                            <td style={{ verticalAlign: "middle" }}>
                              <span style={{
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#374151",
                                fontFamily: "'JetBrains Mono', monospace",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "inline-block",
                                maxWidth: "130px"
                              }} title={log.target}>
                                {log.target || "—"}
                              </span>
                            </td>

                            {/* Summary */}
                            <td style={{ verticalAlign: "middle" }}>
                              <div style={{ fontSize: "13px", color: "#1f2937", lineHeight: "1.4" }}>
                                {log.summary}
                              </div>
                              {log.details?.diffs && Array.isArray(log.details.diffs) && log.details.diffs.length > 0 && (
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                                  {log.details.diffs.map((d, i) => (
                                    <span key={i} style={{
                                      fontSize: "10px",
                                      padding: "1px 6px",
                                      borderRadius: "4px",
                                      backgroundColor: "#fef3c7",
                                      color: "#92400e",
                                      border: "1px solid #fde68a"
                                    }}>
                                      {d}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>

                            {/* Inspect */}
                            <td style={{ verticalAlign: "middle", textAlign: "right" }}>
                              <button
                                type="button"
                                className="sp-btn sp-btn--secondary"
                                style={{ padding: "4px 8px", fontSize: "11px", height: "auto" }}
                                onClick={() => setInspectingAuditLog(log)}
                                title="Inspect audit event dossier"
                              >
                                <IconEye size={12} />
                                <span>Inspect</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Ledger Footer */}
              <div style={{
                padding: "12px 20px",
                borderTop: "1px solid var(--sp-border-subtle, #e1e3e5)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "12px",
                color: "var(--sp-text-subdued, #6d7175)",
                backgroundColor: "var(--sp-bg, #f6f6f7)"
              }}>
                <div>Showing {filteredAuditLogs.length} of {auditLogs.length} audit records</div>
                <div>Storage: Resilient Local Ledger (SafeStorage) with Cloud Sync</div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── MODAL 1: INSPECT ORDER MODAL (WITH WATCH SKU, EAN & TAX BILL) ── */}
      {inspectingOrder && (
        <div className="sp-modal-overlay" role="dialog" aria-modal="true">
          <div className="sp-modal-backdrop" onClick={() => setInspectingOrder(null)} />
          <div className="sp-modal-box sp-modal-box--wide">
            <div className="sp-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="sp-title-icon"><IconOrders size={18} /></span>
                <h2>Order Allocation: {inspectingOrder.order_ref}</h2>
                <span
                  className={`sp-badge-pill ${inspectingOrder.payment_status === "Paid" ? "sp-badge-pill--fulfilled" : "sp-badge-pill--unfulfilled"}`}
                  style={{
                    padding: "3px 8px",
                    borderRadius: "12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    background: inspectingOrder.payment_status === "Paid" ? "#dcfce7" : "#fef3c7",
                    color: inspectingOrder.payment_status === "Paid" ? "#15803d" : "#b45309"
                  }}
                >
                  ● {inspectingOrder.payment_status || "Pending"}
                </span>
              </div>
              <button type="button" className="sp-close-btn" onClick={() => setInspectingOrder(null)}>✕</button>
            </div>
            <div className="sp-modal-body">
              <div className="sp-modal-grid">
                <div>
                  <h4>Customer Profile & Dispatch Details</h4>
                  <p><strong>Name:</strong> {inspectingOrder.customer_name}</p>
                  <p><strong>Email:</strong> <a href={`mailto:${inspectingOrder.customer_email}`} style={{ color: "#2563eb" }}>{inspectingOrder.customer_email}</a></p>
                  <p><strong>Phone:</strong> {inspectingOrder.customer_phone || "—"}</p>
                  <p>
                    <strong>Shipping Address:</strong>{" "}
                    {inspectingOrder.shipping_address?.address ? `${inspectingOrder.shipping_address.address}, ` : ""}
                    {inspectingOrder.shipping_address?.city || "India"}
                    {inspectingOrder.shipping_address?.state ? `, ${inspectingOrder.shipping_address.state}` : ""}
                    {inspectingOrder.shipping_address?.pin || inspectingOrder.shipping_address?.pincode ? ` - ${inspectingOrder.shipping_address.pin || inspectingOrder.shipping_address.pincode}` : ""}
                  </p>
                </div>
                <div>
                  <h4>Allocation & Financial Summary</h4>
                  <p><strong>Date & Time:</strong> <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: "#0f172a" }}>{formatOrderTimestamp(inspectingOrder.created_at).fullStr}</span></p>
                  <p><strong>Total Bill:</strong> ₹{Number(inspectingOrder.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })} ({Math.round(inspectingOrder.total_amount / 83)} USD)</p>
                  <p><strong>Payment Mode:</strong> {inspectingOrder.payment_method || "Credit Card (Encrypted)"}</p>
                  <p>
                    <strong>Payment Status:</strong>{" "}
                    <span style={{ fontWeight: 600, color: inspectingOrder.payment_status === "Paid" ? "#16a34a" : "#d97706" }}>
                      ● {inspectingOrder.payment_status || "Pending"} {inspectingOrder.payment_status !== "Paid" ? "(Payable on Delivery)" : "(Verified)"}
                    </span>
                  </p>
                  <p><strong>Fulfillment Status:</strong> {inspectingOrder.fulfillment_status || "In progress"}</p>
                  <p><strong>Tracking Waybill:</strong> {inspectingOrder.tracking_number || "Being assigned"}</p>
                  <p><strong>Channel:</strong> {inspectingOrder.channel || "Online Boutique"}</p>
                </div>
              </div>

              <h4 style={{ marginTop: "20px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Allocated Timepieces & Barcodes ({inspectingOrder.items?.length || 0})</span>
                <span style={{ fontSize: "11px", fontWeight: 400, color: "#64748b" }}>Verified SKU & 13-Digit EAN Barcode</span>
              </h4>

              <div className="sp-order-items-enriched-list">
                {(inspectingOrder.items || []).map((it, idx) => {
                  const sku = it.sku || `HBR-${idx + 101}-X`;
                  const ean = it.ean || calculateEan13(sku);
                  return (
                    <div key={idx} className="sp-item-card-dossier">
                      <div className="sp-item-thumb-box">
                        <img
                          src={it.image || "/watch-astroworld-moon-rosegold-front-transparent.webp"}
                          alt={it.name}
                          className="sp-item-thumb-img"
                        />
                      </div>
                      <div className="sp-item-details-box">
                        <div className="sp-item-title-row">
                          <strong className="sp-item-name">{it.name || "HANBORO Timepiece"}</strong>
                          <span className="sp-item-line-total">
                            ₹{((Number(it.price) || 0) * (it.quantity || 1)).toLocaleString("en-IN")}
                          </span>
                        </div>

                        {/* SKU & EAN Barcode Badges Row */}
                        <div className="sp-code-badges-row">
                          <div className="sp-sku-badge" title="Official Watch SKU Identifier">
                            <span className="sp-code-label">SKU:</span>
                            <code className="sp-code-val">{sku}</code>
                            <button
                              type="button"
                              className="sp-copy-tiny-btn"
                              onClick={() => handleCopyText(sku, `sku-${idx}`)}
                              title="Copy SKU code"
                            >
                              <IconCopy size={11} />
                              {copiedKey === `sku-${idx}` ? "Copied" : "Copy"}
                            </button>
                          </div>

                          <div className="sp-ean-badge" title="International EAN-13 Barcode">
                            <IconBarcode size={13} />
                            <span className="sp-code-label">EAN-13:</span>
                            <code className="sp-code-val">{ean}</code>
                            <button
                              type="button"
                              className="sp-copy-tiny-btn"
                              onClick={() => handleCopyText(ean, `ean-${idx}`)}
                              title="Copy 13-digit EAN Barcode"
                            >
                              <IconCopy size={11} />
                              {copiedKey === `ean-${idx}` ? "Copied" : "Copy"}
                            </button>
                          </div>
                        </div>

                        {/* Mini Barcode Graphic */}
                        <div className="sp-item-barcode-preview">
                          <BarcodeStripeGraphic ean={ean} height={22} showNumber={false} />
                        </div>

                        <div className="sp-item-meta-row">
                          <span>Qty: {it.quantity || it.qty || 1}</span>
                          <span>•</span>
                          <span>Unit Valuation: ₹{Number(it.price || 0).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Proper Bill Breakdown */}
              <div className="sp-bill-breakdown-card">
                <h5 className="sp-bill-title">Proper Bill of Supply Breakdown</h5>
                <div className="sp-bill-rows">
                  <div className="sp-bill-row">
                    <span>Itemized Timepieces Subtotal</span>
                    <strong>₹{Number(inspectingOrder.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div className="sp-bill-row">
                    <span>Insured Courier</span>
                    <strong style={{ color: "#16a34a" }}>Complimentary (₹0.00)</strong>
                  </div>
                  <div className="sp-bill-row">
                    <span>Applicable GST (18% Included)</span>
                    <span>CGST (9%) + SGST (9%): ₹{Math.round((Number(inspectingOrder.total_amount) * 0.18) / 1.18).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="sp-bill-row sp-bill-row--total">
                    <span>Net Grand Total (Billed)</span>
                    <span className="sp-bill-grand-price">₹{Number(inspectingOrder.total_amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="sp-modal-actions-row">
                <button
                  type="button"
                  className="sp-btn sp-btn--invoice-trigger"
                  onClick={() => setInvoiceModalOrder(inspectingOrder)}
                >
                  <IconInvoice size={14} />
                  <span>View & Print Official Bill / Tax Invoice</span>
                </button>
                {inspectingOrder.payment_status !== "Paid" && (
                  <button
                    type="button"
                    className="sp-btn"
                    style={{ background: "#16a34a", color: "#ffffff", borderColor: "#16a34a", fontWeight: 600 }}
                    onClick={() => handleUpdateOrderStatus(inspectingOrder.order_ref, { payment_status: "Paid" })}
                  >
                    ✓ Mark Payment Collected (Paid)
                  </button>
                )}
                <button
                  type="button"
                  className="sp-btn sp-btn--primary"
                  onClick={() => handleUpdateOrderStatus(inspectingOrder.order_ref, { fulfillment_status: "Fulfilled", delivery_status: "Delivered" })}
                >
                  Mark as Fulfilled & Delivered
                </button>
                <button
                  type="button"
                  className="sp-btn sp-btn--whatsapp-nudge"
                  onClick={() => triggerWhatsAppOrderUpdate(inspectingOrder)}
                >
                  <IconWhatsApp size={14} />
                  <span>Send WhatsApp Update</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: INSPECT ABANDONED CHECKOUT MODAL ── */}
      {inspectingCheckout && (
        <div className="sp-modal-overlay" role="dialog" aria-modal="true">
          <div className="sp-modal-backdrop" onClick={() => setInspectingCheckout(null)} />
          <div className="sp-modal-box">
            <div className="sp-modal-header">
              <h2>Checkout {inspectingCheckout.checkoutNumber}</h2>
              <button type="button" className="sp-close-btn" onClick={() => setInspectingCheckout(null)}>✕</button>
            </div>
            <div className="sp-modal-body">
              <p><strong>Client:</strong> {inspectingCheckout.customerName || "Guest Shopper"}</p>
              <p><strong>Email:</strong> {inspectingCheckout.customerEmail || "Not provided"}</p>
              <p><strong>Phone:</strong> {inspectingCheckout.customerPhone || "Not provided"}</p>
              {inspectingCheckout.shippingAddress?.address && (
                <p><strong>Shipping Address:</strong> {inspectingCheckout.shippingAddress.address}, {inspectingCheckout.shippingAddress.city} {inspectingCheckout.shippingAddress.pincode}</p>
              )}
              <p><strong>Value:</strong> ₹{Number(inspectingCheckout.totalPrice).toLocaleString("en-IN")}</p>
              <p><strong>Region:</strong> {inspectingCheckout.region}</p>
              <p><strong>Created:</strong> {inspectingCheckout.createdAt}</p>

              <h4>Abandoned Items</h4>
              <div className="sp-order-items-list">
                {(inspectingCheckout.items || []).map((it, idx) => (
                  <div key={idx} className="sp-order-item-row">
                    <span>{it.name} (SKU: {it.sku || "HNB"})</span>
                    <span>₹{Number(it.price).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>

              <div className="sp-modal-actions-row">
                <button
                  type="button"
                  className="sp-btn sp-btn--whatsapp-nudge"
                  onClick={() => triggerWhatsAppRecovery(inspectingCheckout)}
                >
                  💬 1-Click WhatsApp Recovery Nudge {inspectingCheckout.customerPhone ? `(${inspectingCheckout.customerPhone})` : ""}
                </button>
                <button
                  type="button"
                  className="sp-btn sp-btn--primary"
                  onClick={() => handleConvertAbandonedToOrder(inspectingCheckout)}
                >
                  Create Order for Client
                </button>
                <button
                  type="button"
                  className="sp-btn sp-btn--default"
                  onClick={async () => {
                    await abandonedCheckoutsService.markCheckoutRecovered(inspectingCheckout.id).catch(() => {});
                    setAbandonedCheckouts(abandonedCheckouts.map((c) => c.id === inspectingCheckout.id ? { ...c, recoveryStatus: "Recovered" } : c));
                    setInspectingCheckout(null);
                    showToast("Checkout marked as Recovered");
                  }}
                >
                  Mark Recovered
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: CREATE DRAFT ORDER MODAL ── */}
      {showCreateDraftModal && (
        <div className="sp-modal-overlay" role="dialog" aria-modal="true">
          <div className="sp-modal-backdrop" onClick={() => setShowCreateDraftModal(false)} />
          <div className="sp-modal-box">
            <div className="sp-modal-header">
              <h2>Create Draft Order (Manual Sale)</h2>
              <button type="button" className="sp-close-btn" onClick={() => setShowCreateDraftModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveDraftOrder} className="sp-modal-body">
              <div className="sp-form-group">
                <label>Customer Name *</label>
                <input
                  type="text"
                  placeholder="Full name of client"
                  value={draftFormData.customerName}
                  onChange={(e) => setDraftFormData({ ...draftFormData, customerName: e.target.value })}
                  required
                />
              </div>

              <div className="sp-form-row">
                <div className="sp-form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="client@email.com"
                    value={draftFormData.customerEmail}
                    onChange={(e) => setDraftFormData({ ...draftFormData, customerEmail: e.target.value })}
                  />
                </div>
                <div className="sp-form-group">
                  <label>WhatsApp / Contact Phone *</label>
                  <input
                    type="tel"
                    placeholder="+91 98110 00000"
                    value={draftFormData.customerPhone}
                    onChange={(e) => setDraftFormData({ ...draftFormData, customerPhone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="sp-form-row">
                <div className="sp-form-group">
                  <label>Select Timepiece *</label>
                  <select
                    value={draftFormData.productId}
                    onChange={(e) => {
                      const sel = (products || PRODUCTS_DATA).find((p) => p.id === e.target.value || p.sku === e.target.value);
                      const priceNum = parseInt(String(sel?.price || "0").replace(/[^\d]/g, ""), 10) || 45000;
                      setDraftFormData({ ...draftFormData, productId: e.target.value, customPrice: String(priceNum) });
                    }}
                    required
                  >
                    <option value="">-- Choose Watch --</option>
                    {(products || PRODUCTS_DATA).map((p) => (
                      <option key={p.id} value={p.id}>MODEL {p.modelNumber || p.specs?.modelNumber || "—"} — {p.name} ({p.sku}) - {p.price}</option>
                    ))}
                  </select>
                </div>

                <div className="sp-form-group">
                  <label>Retail Valuation (INR)</label>
                  <input
                    type="number"
                    value={draftFormData.customPrice}
                    onChange={(e) => setDraftFormData({ ...draftFormData, customPrice: e.target.value })}
                    required
                  />
                </div>

                <div className="sp-form-group">
                  <label>VIP Concession / Discount Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    placeholder="e.g. 15 for 15% OFF"
                    value={draftFormData.discountRate || ""}
                    onChange={(e) => {
                      const disc = e.target.value;
                      const sel = (products || PRODUCTS_DATA).find((p) => p.id === draftFormData.productId || p.sku === draftFormData.productId);
                      const basePrice = parseInt(String(sel?.price || "45000").replace(/[^\d]/g, ""), 10) || 45000;
                      const numDisc = parseFloat(disc);
                      const finalPrice = !isNaN(numDisc) && numDisc > 0
                        ? Math.round(basePrice * (1 - Math.min(100, numDisc) / 100))
                        : basePrice;
                      setDraftFormData({
                        ...draftFormData,
                        discountRate: disc,
                        customPrice: String(finalPrice),
                      });
                    }}
                  />
                </div>
              </div>

              <div className="sp-modal-actions-row">
                <button type="submit" className="sp-btn sp-btn--primary">
                  Save Draft Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: CUSTOMER PROFILE DOSSIER & WATCH ORDERS DATABASE ── */}
      {selectedCustomerDossier && (
        <div className="sp-modal-overlay" role="dialog" aria-modal="true">
          <div className="sp-modal-backdrop" onClick={() => setSelectedCustomerDossier(null)} />
          <div className="sp-modal-box sp-modal-box--wide sp-modal-box--customer-dossier">
            <div className="sp-modal-header">
              <div className="sp-customer-modal-header-left">
                <div className="sp-avatar-circle sp-avatar-circle--lg">
                  {selectedCustomerDossier.name ? selectedCustomerDossier.name.slice(0, 2).toUpperCase() : "HC"}
                </div>
                <div>
                  <div className="sp-customer-modal-title-row">
                    <h2>{selectedCustomerDossier.name}</h2>
                    {selectedCustomerDossier.vip_tier && selectedCustomerDossier.vip_tier.toLowerCase().includes("vip") && (
                      <span className="sp-vip-pill sp-vip-pill--gold">
                        ★ {selectedCustomerDossier.vip_tier}
                      </span>
                    )}
                    <span className="sp-role-badge">
                      {selectedCustomerDossier.role || "customer"}
                    </span>
                  </div>
                  <p className="sp-customer-modal-subtitle">
                    Client ID: <code>{selectedCustomerDossier.id}</code> • Member since {new Date(selectedCustomerDossier.registeredAt || Date.now()).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
              <button type="button" className="sp-close-btn" onClick={() => setSelectedCustomerDossier(null)}>✕</button>
            </div>

            <div className="sp-modal-body sp-customer-dossier-body">
              {/* Top Metrics Banner */}
              <div className="sp-dossier-metrics-grid">
                <div className="sp-dossier-metric-card">
                  <span className="sp-dossier-metric-label">Lifetime Value (LTV)</span>
                  <span className="sp-dossier-metric-val sp-text-emerald">
                    ₹{Number(selectedCustomerDossier.totalSpent || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="sp-dossier-metric-card">
                  <span className="sp-dossier-metric-label">Confirmed Orders</span>
                  <span className="sp-dossier-metric-val">
                    {selectedCustomerDossier.ordersCount || selectedCustomerDossier.orders?.length || 0} Timepieces
                  </span>
                </div>
                <div className="sp-dossier-metric-card">
                  <span className="sp-dossier-metric-label">Average Order Value (AOV)</span>
                  <span className="sp-dossier-metric-val">
                    ₹{selectedCustomerDossier.ordersCount > 0 ? Math.round(selectedCustomerDossier.totalSpent / selectedCustomerDossier.ordersCount).toLocaleString("en-IN") : "0"}
                  </span>
                </div>
                <div className="sp-dossier-metric-card">
                  <span className="sp-dossier-metric-label">Primary Destination</span>
                  <span className="sp-dossier-metric-val sp-text-truncate" title={`${selectedCustomerDossier.city}, ${selectedCustomerDossier.state}`}>
                    {selectedCustomerDossier.city || "India"}
                  </span>
                </div>
              </div>

              {/* Contact & Shipping Dossier */}
              <div className="sp-customer-dossier-meta-grid">
                <div className="sp-dossier-section-card">
                  <h4 className="sp-dossier-sec-title">Contact Information</h4>
                  <div className="sp-dossier-info-row">
                    <span className="sp-info-label">Email Address:</span>
                    <div className="sp-info-value-with-actions">
                      <code>{selectedCustomerDossier.email}</code>
                      <button
                        type="button"
                        className="sp-copy-tiny-btn"
                        onClick={() => handleCopyText(selectedCustomerDossier.email, "cust-email")}
                      >
                        <IconCopy size={11} />
                        {copiedKey === "cust-email" ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                  <div className="sp-dossier-info-row">
                    <span className="sp-info-label">Contact Phone:</span>
                    <div className="sp-info-value-with-actions">
                      <span>{selectedCustomerDossier.phone || "Not specified"}</span>
                      {selectedCustomerDossier.phone && (
                        <a
                          href={`https://wa.me/${selectedCustomerDossier.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Greetings ${selectedCustomerDossier.name}, this is HANBORO Watches.`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="sp-btn-link-wa"
                        >
                          <IconWhatsApp size={12} />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="sp-dossier-info-row">
                    <span className="sp-info-label">Customer Tier:</span>
                    <span className={selectedCustomerDossier.vip_tier?.toLowerCase().includes("vip") ? "sp-vip-tag-gold" : "sp-role-badge"}>
                      {selectedCustomerDossier.vip_tier || "Customer"}
                    </span>
                  </div>
                </div>

                <div className="sp-dossier-section-card">
                  <h4 className="sp-dossier-sec-title">Registered Shipping Dossier</h4>
                  <p className="sp-shipping-address-block">
                    <strong>{selectedCustomerDossier.name}</strong><br />
                    {selectedCustomerDossier.address ? <>{selectedCustomerDossier.address}<br /></> : null}
                    {selectedCustomerDossier.city}, {selectedCustomerDossier.state || ""} {selectedCustomerDossier.pin ? `- ${selectedCustomerDossier.pin}` : ""}<br />
                    {selectedCustomerDossier.country || "India"}
                  </p>
                  <span className="sp-badge-white-glove">⚡ Direct Insured Courier Eligible</span>
                </div>
              </div>

              {/* Concierge Notes Editor */}
              <div className="sp-dossier-notes-card">
                <div className="sp-notes-card-header">
                  <h4 className="sp-dossier-sec-title">Admin Notes</h4>
                  {editingNotesEmail !== selectedCustomerDossier.email && (
                    <button
                      type="button"
                      className="sp-btn sp-btn--default sp-btn--sm"
                      onClick={() => {
                        setEditingNotesEmail(selectedCustomerDossier.email);
                        setNotesDraft(selectedCustomerDossier.notes || "");
                      }}
                    >
                      Edit Notes
                    </button>
                  )}
                </div>
                {editingNotesEmail === selectedCustomerDossier.email ? (
                  <div className="sp-notes-editor-wrap">
                    <textarea
                      className="sp-notes-textarea"
                      rows={3}
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      placeholder="Enter customer preferences, wrist diameter, or private notes..."
                    />
                    <div className="sp-notes-actions">
                      <button
                        type="button"
                        className="sp-btn sp-btn--primary sp-btn--sm"
                        onClick={async () => {
                          await handleSaveCustomerNotes(selectedCustomerDossier.email, notesDraft);
                          setEditingNotesEmail(null);
                        }}
                      >
                        Save to Database
                      </button>
                      <button
                        type="button"
                        className="sp-btn sp-btn--default sp-btn--sm"
                        onClick={() => setEditingNotesEmail(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="sp-notes-display-text">
                    {selectedCustomerDossier.notes || "No custom customer notes recorded yet."}
                  </p>
                )}
              </div>

              {/* Watch Orders Database Section */}
              <div className="sp-dossier-orders-section">
                <div className="sp-dossier-orders-header">
                  <div className="sp-dossier-orders-header-title">
                    <h3 className="sp-dossier-orders-title">
                      Purchased Timepieces & Confirmed Orders
                    </h3>
                    <span className="sp-orders-count-badge">
                      {selectedCustomerDossier.orders?.length || 0} Orders
                    </span>
                  </div>
                  <p className="sp-dossier-orders-desc">
                    Comprehensive order history with official bills of supply, tax invoice generators, unique SKU identification, and 13-digit EAN barcodes.
                  </p>
                </div>

                {(!selectedCustomerDossier.orders || selectedCustomerDossier.orders.length === 0) ? (
                  <div className="sp-dossier-orders-empty">
                    <p>No confirmed timepiece orders found under this customer profile.</p>
                    <button
                      type="button"
                      className="sp-btn sp-btn--primary sp-btn--sm"
                      onClick={() => {
                        setDraftFormData({
                          customerName: selectedCustomerDossier.name,
                          customerEmail: selectedCustomerDossier.email,
                          customerPhone: selectedCustomerDossier.phone || "+91 98110 00000",
                          productId: "",
                          customPrice: "45000",
                        });
                        setShowCreateDraftModal(true);
                      }}
                    >
                      + Create Manual Draft Order for this Client
                    </button>
                  </div>
                ) : (
                  <div className="sp-customer-orders-list">
                    {selectedCustomerDossier.orders.map((ord, ordIdx) => {
                      const totalAmount = Number(ord.total_amount || 0);
                      const orderRef = ord.order_ref || ord.id || `#${1000 + ordIdx}`;
                      const items = (ord.items || []).map((it) => enrichOrderItemWithSkuEan(it, products || PRODUCTS_DATA));

                      return (
                        <div key={ord.id || ordIdx} className="sp-customer-order-card">
                          <div className="sp-order-card-top-bar">
                            <div className="sp-order-card-ref-block">
                              <span className="sp-order-ref-pill">{orderRef}</span>
                              <span className="sp-order-date">
                                {new Date(ord.created_at || Date.now()).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>

                            <div className="sp-order-card-badges">
                              <span className={`sp-badge sp-badge--${(ord.financial_status || ord.status || "Paid").toLowerCase() === "paid" ? "paid" : "pending"}`}>
                                ● {ord.financial_status || ord.status || "Paid"}
                              </span>
                              <span className={`sp-badge sp-badge--${(ord.fulfillment_status || "Fulfilled").toLowerCase() === "fulfilled" ? "fulfilled" : "unfulfilled"}`}>
                                {ord.fulfillment_status || "Fulfilled"}
                              </span>
                            </div>

                            <div className="sp-order-card-top-actions">
                              <button
                                type="button"
                                className="sp-btn sp-btn--invoice-trigger sp-btn--sm"
                                onClick={() => setInvoiceModalOrder(ord)}
                                title="View & Print Official GST Tax Invoice & Bill of Supply"
                              >
                                <IconInvoice size={13} />
                                <span>Official Bill & Tax Invoice</span>
                              </button>
                              <a
                                href={`https://wa.me/${(selectedCustomerDossier.phone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                                  `Dear ${selectedCustomerDossier.name},\nHere is your official Hanboro Bill summary for Order ${orderRef}:\nTotal: ₹${totalAmount.toLocaleString("en-IN")}\nItems: ${items.map(i => `${i.name || i.title} (SKU: ${i.sku}, EAN: ${i.ean})`).join(", ")}\nThank you for choosing Hanboro Haute Horlogerie.`
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="sp-btn sp-btn--whatsapp-nudge sp-btn--sm"
                                title="Share Bill on WhatsApp"
                              >
                                <IconWhatsApp size={13} />
                                <span>Share Bill</span>
                              </a>
                            </div>
                          </div>

                          {/* Itemized Watch List with SKU & EAN Barcode */}
                          <div className="sp-order-items-table-dossier">
                            {items.map((it, itemIdx) => {
                              const itPrice = Number(it.price || 0);
                              const itQty = Number(it.quantity || it.qty || 1);
                              const lineTotal = itPrice * itQty;
                              const sku = it.sku || "HNB-TIMEPIECE";
                              const ean = it.ean || calculateEan13(sku);

                              return (
                                <div key={it.id || itemIdx} className="sp-item-card-dossier">
                                  <div className="sp-item-thumb-box">
                                    <img
                                      src={it.image || it.thumbnail || it.img || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=160&auto=format&fit=crop&q=80"}
                                      alt={it.name || it.title || "Timepiece"}
                                      className="sp-item-thumb"
                                    />
                                  </div>

                                  <div className="sp-item-details-box">
                                    <div className="sp-item-title-row">
                                      <h5 className="sp-item-name">{it.name || it.title || "HANBORO Timepiece"}</h5>
                                      <span className="sp-item-line-total">
                                        ₹{lineTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                      </span>
                                    </div>

                                    {/* SKU & EAN Barcode Badges Row */}
                                    <div className="sp-codes-row">
                                      <div className="sp-sku-badge" title="Official Watch SKU ID">
                                        <span className="sp-code-label">WATCH SKU:</span>
                                        <code className="sp-code-val">{sku}</code>
                                        <button
                                          type="button"
                                          className="sp-copy-tiny-btn"
                                          onClick={() => handleCopyText(sku, `ord-${ordIdx}-sku-${itemIdx}`)}
                                          title="Copy Watch SKU ID"
                                        >
                                          <IconCopy size={11} />
                                          {copiedKey === `ord-${ordIdx}-sku-${itemIdx}` ? "Copied" : "Copy"}
                                        </button>
                                      </div>

                                      <div className="sp-ean-badge" title="International 13-Digit EAN Barcode">
                                        <IconBarcode size={13} />
                                        <span className="sp-code-label">EAN-13:</span>
                                        <code className="sp-code-val">{ean}</code>
                                        <button
                                          type="button"
                                          className="sp-copy-tiny-btn"
                                          onClick={() => handleCopyText(ean, `ord-${ordIdx}-ean-${itemIdx}`)}
                                          title="Copy EAN-13 Barcode Number"
                                        >
                                          <IconCopy size={11} />
                                          {copiedKey === `ord-${ordIdx}-ean-${itemIdx}` ? "Copied" : "Copy"}
                                        </button>
                                      </div>
                                    </div>

                                    {/* Barcode Graphic Stripes */}
                                    <div className="sp-barcode-graphic-inline">
                                      <BarcodeStripeGraphic ean={ean} height={20} showNumber={false} />
                                      <span className="sp-barcode-inline-caption">EAN Barcode: {ean}</span>
                                    </div>

                                    <div className="sp-item-qty-meta">
                                      <span>Qty: {itQty}</span>
                                      <span>•</span>
                                      <span>Unit Price: ₹{itPrice.toLocaleString("en-IN")}</span>
                                      <span>•</span>
                                      <span>HSN Code: 9102 (Wrist Watches)</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Proper Bill Breakdown */}
                          <div className="sp-bill-summary-strip">
                            <div className="sp-bill-strip-left">
                              <span className="sp-bill-stat">
                                <strong>Billed Subtotal:</strong> ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </span>
                              <span className="sp-bill-stat">
                                <strong>Armored Logistics:</strong> <span style={{ color: "#16a34a" }}>Free (₹0.00)</span>
                              </span>
                              <span className="sp-bill-stat">
                                <strong>GST (18% Included):</strong> ₹{Math.round((totalAmount * 0.18) / 1.18).toLocaleString("en-IN")}
                              </span>
                            </div>
                            <div className="sp-bill-strip-right">
                              <span className="sp-bill-grand-label">Grand Total Billed:</span>
                              <span className="sp-bill-grand-val">
                                ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="sp-modal-footer">
              <div className="sp-modal-footer-left">
                <span>Customer Database — Hanboro India</span>
              </div>
              <div className="sp-modal-footer-actions">
                <button
                  type="button"
                  className="sp-btn sp-btn--default"
                  onClick={() => setSelectedCustomerDossier(null)}
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 5: OFFICIAL HAUTE HORLOGERIE GST/VAT TAX INVOICE & BILL OF SUPPLY ── */}
      {invoiceModalOrder && (() => {
        const ord = invoiceModalOrder;
        const total = Number(ord.total_amount || 0);
        const taxableSubtotal = Math.round(total / 1.18);
        const totalTax = total - taxableSubtotal;
        const cgst = Math.round(totalTax / 2);
        const sgst = totalTax - cgst;
        const invoiceYear = new Date(ord.created_at || Date.now()).getFullYear();
        const invoiceNum = `INV-HNB-${invoiceYear}-${String(ord.order_ref || ord.id || "1001").replace(/[^\d]/g, "").slice(-4).padStart(4, "0")}`;
        const invoiceDate = new Date(ord.created_at || Date.now()).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const items = (ord.items || []).map((it) => enrichOrderItemWithSkuEan(it, products || PRODUCTS_DATA));
        const custName = ord.customer_name || (ord.shipping_address && ord.shipping_address.name) || "Valued Customer";
        const custEmail = ord.customer_email || "client@hanborowatches.in";
        const custPhone = ord.customer_phone || (ord.shipping_address && ord.shipping_address.phone) || "+91 98300 11223";
        const shipAddress = ord.shipping_address || {};

        return (
          <div className="sp-invoice-overlay" role="dialog" aria-modal="true">
            <div className="sp-invoice-backdrop" onClick={() => setInvoiceModalOrder(null)} />
            
            {/* Top Toolbar (Hidden on Print) */}
            <div className="sp-invoice-toolbar">
              <div className="sp-invoice-toolbar-title">
                <span>Official Tax Invoice Preview & Print Engine</span>
                <code>{invoiceNum}</code>
              </div>
              <div className="sp-invoice-toolbar-actions">
                <button
                  type="button"
                  className="sp-btn sp-btn--primary"
                  onClick={() => window.print()}
                >
                  <IconPrinter size={15} />
                  <span>Print Bill / Save PDF (A4)</span>
                </button>
                <button
                  type="button"
                  className="sp-btn sp-btn--default"
                  onClick={() => handleCopyText(`Tax Invoice: ${invoiceNum}\nDate: ${invoiceDate}\nCustomer: ${custName}\nTotal Billed: ₹${total.toLocaleString("en-IN")}\nItems: ${items.map(i => `${i.name} [SKU: ${i.sku}]`).join(", ")}`, "inv-summary")}
                >
                  <IconCopy size={14} />
                  <span>{copiedKey === "inv-summary" ? "Copied!" : "Copy Summary"}</span>
                </button>
                <a
                  href={`https://wa.me/${custPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Dear ${custName},\nYour official Hanboro Haute Horlogerie Tax Invoice ${invoiceNum} for ₹${total.toLocaleString("en-IN")} is ready.\nTimepiece(s): ${items.map(i => `${i.name} (SKU: ${i.sku})`).join(", ")}\nThank you for your order.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="sp-btn sp-btn--whatsapp-nudge"
                >
                  <IconWhatsApp size={14} />
                  <span>WhatsApp Invoice</span>
                </a>
                <button
                  type="button"
                  className="sp-close-btn"
                  onClick={() => setInvoiceModalOrder(null)}
                  title="Close Invoice Preview"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* The A4 Printable Sheet */}
            <div className="sp-invoice-sheet" id="hanboro-tax-invoice-sheet">
              {/* Header Letterhead */}
              <div className="sp-invoice-header">
                <div className="sp-invoice-brand">
                  <h1 className="sp-invoice-logo">HANBORO</h1>
                  <span className="sp-invoice-sublogo">HAUTE HORLOGERIE • ATELIER SUISSE & INDIA</span>
                  <div className="sp-invoice-issuer-details">
                    <strong>RISE N BE ORIGINAL LIFESTYLE PRIVATE LIMITED</strong><br />
                    Fourth Floor, Building No. 3, Block M, DLF City Phase II, Road Number 5, Sector 25<br />
                    Gurugram, Haryana - 122008, India<br />
                    <span><strong>GSTIN:</strong> 06AAMCR0380F1ZG</span> &nbsp;|&nbsp; <span><strong>Constitution:</strong> Private Limited Company</span><br />
                    <span><strong>HSN Chapter:</strong> 9102 (Wrist Watches)</span><br />
                    <span><strong>Contact:</strong> +91 88820 69334 &nbsp;|&nbsp; connect@hanborowatches.in</span>
                  </div>
                </div>

                <div className="sp-invoice-badge-box">
                  <div className="sp-invoice-title-badge">TAX INVOICE & BILL OF SUPPLY</div>
                  <div className="sp-invoice-meta-grid">
                    <div className="sp-inv-meta-row">
                      <span>Invoice Number:</span>
                      <strong>{invoiceNum}</strong>
                    </div>
                    <div className="sp-inv-meta-row">
                      <span>Invoice Date:</span>
                      <strong>{invoiceDate}</strong>
                    </div>
                    <div className="sp-inv-meta-row">
                      <span>Order Reference:</span>
                      <strong>{ord.order_ref || ord.id || "#1001"}</strong>
                    </div>
                    <div className="sp-inv-meta-row">
                      <span>Place of Supply:</span>
                      <strong>{shipAddress.state ? `${shipAddress.state} (India)` : "Haryana (06)"}</strong>
                    </div>
                    <div className="sp-inv-meta-row">
                      <span>Reverse Charge:</span>
                      <strong>No</strong>
                    </div>
                  </div>

                  {(() => {
                    const isCod =
                      (String(ord.payment_method || "").toLowerCase().includes("cod") ||
                       String(ord.payment_method || "").toLowerCase().includes("cash on delivery") ||
                       ord.payment_status === "Pending") && ord.payment_status !== "Paid";

                    if (isCod) {
                      return (
                        <div className="sp-invoice-paid-seal" style={{ borderColor: "#d97706", color: "#b45309" }}>
                          <span className="sp-paid-stamp" style={{ borderColor: "#d97706", color: "#b45309" }}>COD • DUE ON DELIVERY</span>
                          <span className="sp-paid-date">{ord.payment_method || "Cash on Delivery"}</span>
                        </div>
                      );
                    }

                    return (
                      <div className="sp-invoice-paid-seal">
                        <span className="sp-paid-stamp">PAID • VERIFIED</span>
                        <span className="sp-paid-date">{ord.payment_gateway || "Prepaid / Razorpay Secured"}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="sp-invoice-divider" />

              {/* Billed To and Shipped To Addresses */}
              <div className="sp-invoice-addresses-grid">
                <div className="sp-inv-address-card">
                  <h4 className="sp-inv-address-title">BILLED TO (BUYER):</h4>
                  <p className="sp-inv-address-content">
                    <strong className="sp-inv-cust-name">{custName}</strong><br />
                    {shipAddress.address ? <>{shipAddress.address}<br /></> : null}
                    {shipAddress.city || "Delhi NCR"}, {shipAddress.state || "Haryana"} {shipAddress.pin || shipAddress.pincode ? `- ${shipAddress.pin || shipAddress.pincode}` : ""}<br />
                    India<br />
                    <strong>Email:</strong> {custEmail}<br />
                    <strong>Phone:</strong> {custPhone}
                  </p>
                </div>

                <div className="sp-inv-address-card">
                  <h4 className="sp-inv-address-title">SHIPPED TO (CONSIGNEE):</h4>
                  <p className="sp-inv-address-content">
                    <strong className="sp-inv-cust-name">{shipAddress.name || custName}</strong><br />
                    {shipAddress.address ? <>{shipAddress.address}<br /></> : "Destination address on file<br />"}
                    {shipAddress.city || "Delhi NCR"}, {shipAddress.state || "Haryana"} {shipAddress.pin || shipAddress.pincode ? `- ${shipAddress.pin || shipAddress.pincode}` : ""}<br />
                    India<br />
                    <strong>Dispatch Method:</strong> Insured Armored Courier (Malca-Amit / Ferrari Group / BlueDart Apex)
                  </p>
                </div>
              </div>

              {/* Itemized Table with SKU ID */}
              <div className="sp-invoice-table-wrapper">
                <table className="sp-invoice-table">
                  <thead>
                    <tr>
                      <th style={{ width: "4%" }}>#</th>
                      <th style={{ width: "48%" }}>Description of Timepiece</th>
                      <th style={{ width: "20%" }}>Watch SKU ID</th>
                      <th style={{ width: "8%" }}>HSN</th>
                      <th style={{ width: "5%" }}>Qty</th>
                      <th style={{ width: "15%" }} className="sp-text-right">Taxable Amt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => {
                      const itemPrice = Number(it.price || 0);
                      const qty = Number(it.quantity || it.qty || 1);
                      const itemTotal = itemPrice * qty;
                      const itemTaxable = Math.round(itemTotal / 1.18);
                      const sku = it.sku || "HNB-TIMEPIECE";

                      return (
                        <tr key={it.id || idx}>
                          <td>{idx + 1}</td>
                          <td>
                            <div className="sp-inv-item-desc">
                              <strong className="sp-inv-watch-title">{it.name || it.title || "HANBORO Timepiece"}</strong>
                              <span className="sp-inv-watch-specs">Automated Skeleton Movement • Sapphire Crystal • 50M Waterproof • 2-Year International Warranty</span>
                            </div>
                          </td>
                          <td>
                            <div className="sp-inv-sku-box">
                              <code className="sp-inv-sku-code">{sku}</code>
                            </div>
                          </td>
                          <td><span className="sp-inv-hsn">9102</span></td>
                          <td style={{ textAlign: "center" }}>{qty}</td>
                          <td className="sp-text-right">
                            <strong>₹{itemTaxable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation & GST Analysis */}
              <div className="sp-invoice-financials-section">
                <div className="sp-inv-words-column">
                  <div className="sp-inv-amount-words-box">
                    <span className="sp-words-label">Total Amount Chargeable (in words):</span>
                    <strong className="sp-words-val">{amountToWords(total)}</strong>
                  </div>

                  <div className="sp-inv-terms-box">
                    <h5 className="sp-terms-title">Statutory Terms & Warranty Conditions:</h5>
                    <ol className="sp-terms-list">
                      <li>All timepieces are certified genuine, registered in the Hanboro Global Serial Registry under their respective SKU reference.</li>
                      <li>Includes <strong>2-Year International Mechanical Warranty</strong> covering caliber accuracy and movement craftsmanship.</li>
                      <li>Tax is charged under GST Council Section 9(1) for Horology & Timepieces (HSN Chapter 9102).</li>
                      <li>Subject to Gurugram / Delhi NCR Jurisdiction.</li>
                    </ol>
                  </div>
                </div>

                <div className="sp-inv-totals-column">
                  <div className="sp-inv-calc-row">
                    <span>Taxable Value (Subtotal):</span>
                    <strong>₹{taxableSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div className="sp-inv-calc-row">
                    <span>Central GST (CGST 9%):</span>
                    <span>₹{cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="sp-inv-calc-row">
                    <span>State GST (SGST 9%):</span>
                    <span>₹{sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="sp-inv-calc-row">
                    <span>Insured Logistics:</span>
                    <span style={{ color: "#16a34a", fontWeight: 600 }}>FREE (₹0.00)</span>
                  </div>
                  <div className="sp-invoice-divider sp-inv-divider--subtle" />
                  <div className="sp-inv-calc-row sp-inv-calc-row--grand">
                    <span>
                      {(String(ord.payment_method || "").toLowerCase().includes("cod") ||
                        String(ord.payment_method || "").toLowerCase().includes("cash on delivery") ||
                        ord.payment_status === "Pending") && ord.payment_status !== "Paid"
                        ? "Grand Total (Payable on Delivery):"
                        : "Grand Total (Billed & Paid):"}
                    </span>
                    <span className="sp-inv-grand-total">₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Signatory & Security Footer */}
              <div className="sp-invoice-footer-signatory">
                <div className="sp-inv-security-hash">
                  <span>Cryptographic Hash: <code>SHA256:{Math.abs((total * 1337) ^ 0xabcdef).toString(16).toUpperCase()}-HNB-SECURE</code></span>
                  <span>Computer Generated Tax Invoice • No Physical Signature Required</span>
                </div>

                <div className="sp-inv-sign-box">
                  <div className="sp-inv-digital-stamp">
                    <span>HANBORO TIMEPIECES</span>
                    <span>★ VERIFIED ATELIER ★</span>
                  </div>
                  <div className="sp-inv-sign-line">Authorized Signatory</div>
                  <span className="sp-inv-company-name">For RISE N BE ORIGINAL LIFESTYLE PRIVATE LIMITED</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Watch Editor Studio Modal */}
      {editorModalOpen && (
        <WatchEditorModal
          isOpen={editorModalOpen}
          initialData={editingWatch}
          onClose={() => {
            setEditorModalOpen(false);
            setEditingWatch(null);
          }}
          onSave={async (watchData) => {
            const prevId = watchData.previousId || (editingWatch && (editingWatch.id || editingWatch.sku));
            const prevSku = watchData.previousSku || (editingWatch && editingWatch.sku);
            if (prevId) {
              await updateProduct(prevId, { ...watchData, previousSku: prevSku });
            } else {
              await addProduct(watchData);
            }
            setEditorModalOpen(false);
            setEditingWatch(null);
            setActiveTab("products");
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && deletingWatch && (
        <DeleteWatchModal
          isOpen={deleteModalOpen}
          watch={deletingWatch}
          onClose={() => {
            setDeleteModalOpen(false);
            setDeletingWatch(null);
          }}
          onConfirm={async (id) => {
            await deleteProduct(id);
            setDeleteModalOpen(false);
            setDeletingWatch(null);
            showToast("Timepiece archived");
          }}
        />
      )}

      {/* ── MODAL: TEAM AUDIT INSPECT DOSSIER MODAL ── */}
      {inspectingAuditLog && (
        <div className="sp-modal-overlay" role="dialog" aria-modal="true">
          <div className="sp-modal-backdrop" onClick={() => setInspectingAuditLog(null)} />
          <div className="sp-modal-box sp-modal-box--wide" style={{ maxWidth: "700px" }}>
            <div className="sp-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="sp-title-icon" style={{ color: "#008060" }}><IconAudit size={20} /></span>
                <div>
                  <h2 style={{ fontSize: "16px", margin: 0 }}>Audit Dossier: {inspectingAuditLog.action}</h2>
                  <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                    Logged on {new Date(inspectingAuditLog.timestamp).toLocaleString("en-IN")} • ID: {inspectingAuditLog.id}
                  </div>
                </div>
              </div>
              <button type="button" className="sp-close-btn" onClick={() => setInspectingAuditLog(null)}>✕</button>
            </div>

            <div className="sp-modal-body" style={{ maxHeight: "75vh", overflowY: "auto", padding: "20px" }}>
              {/* Event Attributes Grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                padding: "14px",
                borderRadius: "8px",
                backgroundColor: "#f9fafb",
                border: "1px solid #e5e7eb",
                marginBottom: "16px"
              }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", fontWeight: 600 }}>Category</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827", marginTop: "2px" }}>{inspectingAuditLog.category}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", fontWeight: 600 }}>Action Key</div>
                  <code style={{ fontSize: "12px", color: "#4f46e5", fontFamily: "monospace", marginTop: "2px", display: "inline-block" }}>{inspectingAuditLog.action}</code>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", fontWeight: 600 }}>Initiated By</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827", marginTop: "2px" }}>{inspectingAuditLog.actor}</div>
                  <div style={{ fontSize: "11px", color: "#6b7280" }}>Role: {inspectingAuditLog.actorRole || "Staff"}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#6b7280", textTransform: "uppercase", fontWeight: 600 }}>Target Entity</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827", marginTop: "2px", fontFamily: "monospace" }}>{inspectingAuditLog.target || "—"}</div>
                </div>
              </div>

              {/* Summary Section */}
              <div style={{ marginBottom: "16px" }}>
                <h4 style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 6px", color: "#374151" }}>Action Summary</h4>
                <div style={{
                  padding: "12px 14px",
                  borderRadius: "6px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  fontSize: "13px",
                  lineHeight: "1.5",
                  color: "#111827"
                }}>
                  {inspectingAuditLog.summary}
                </div>
              </div>

              {/* Specific Details / Diffs if present */}
              {inspectingAuditLog.details && (
                <div style={{ marginBottom: "16px" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 600, margin: "0 0 6px", color: "#374151" }}>Structured Payload Details</h4>
                  <div style={{
                    padding: "12px 14px",
                    borderRadius: "6px",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb"
                  }}>
                    {inspectingAuditLog.details.diffs && Array.isArray(inspectingAuditLog.details.diffs) ? (
                      <div style={{ marginBottom: "10px" }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: "#92400e", marginBottom: "6px" }}>Detected Attribute Changes:</div>
                        <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "12px", color: "#374151" }}>
                          {inspectingAuditLog.details.diffs.map((d, i) => (
                            <li key={i} style={{ marginBottom: "2px" }}>{d}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {/* Key-Value details */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px" }}>
                      {Object.entries(inspectingAuditLog.details).map(([k, v]) => {
                        if (k === "diffs" || typeof v === "object") return null;
                        return (
                          <div key={k} style={{ padding: "4px 0" }}>
                            <span style={{ color: "#6b7280", fontWeight: 500 }}>{k}: </span>
                            <span style={{ color: "#111827", fontWeight: 600 }}>{String(v)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Raw JSON Payload */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 600, margin: 0, color: "#374151" }}>Raw Event Audit JSON</h4>
                  <button
                    type="button"
                    className="sp-btn sp-btn--secondary"
                    style={{ padding: "2px 8px", fontSize: "11px", height: "auto" }}
                    onClick={() => {
                      try {
                        navigator.clipboard.writeText(JSON.stringify(inspectingAuditLog, null, 2));
                        showToast("Audit JSON copied to clipboard");
                      } catch {}
                    }}
                  >
                    <IconCopy size={11} />
                    <span>Copy JSON</span>
                  </button>
                </div>
                <pre style={{
                  padding: "12px",
                  borderRadius: "6px",
                  backgroundColor: "#1e293b",
                  color: "#f8fafc",
                  fontSize: "11px",
                  lineHeight: "1.4",
                  overflowX: "auto",
                  fontFamily: "'JetBrains Mono', monospace",
                  margin: 0
                }}>
                  {JSON.stringify(inspectingAuditLog, null, 2)}
                </pre>
              </div>
            </div>

            <div className="sp-modal-actions" style={{ padding: "12px 20px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="sp-btn sp-btn--primary"
                onClick={() => setInspectingAuditLog(null)}
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CLEAR AUDIT LEDGER CONFIRMATION ── */}
      {showClearAuditModal && (
        <div className="sp-modal-overlay" role="dialog" aria-modal="true">
          <div className="sp-modal-backdrop" onClick={() => setShowClearAuditModal(false)} />
          <div className="sp-modal-box" style={{ maxWidth: "460px" }}>
            <div className="sp-modal-header">
              <h2 style={{ fontSize: "16px", color: "#b91c1c", margin: 0 }}>Reset Team Audit Ledger?</h2>
              <button type="button" className="sp-close-btn" onClick={() => setShowClearAuditModal(false)}>✕</button>
            </div>
            <div className="sp-modal-body" style={{ padding: "20px" }}>
              <p style={{ fontSize: "13px", lineHeight: "1.5", color: "#374151", margin: "0 0 12px" }}>
                Are you sure you want to reset the local team audit history?
              </p>
              <p style={{ fontSize: "12px", lineHeight: "1.5", color: "#6b7280", margin: 0, backgroundColor: "#fef2f2", padding: "10px", borderRadius: "6px", border: "1px solid #fee2e2" }}>
                <strong>Note:</strong> Prior events will be cleared from this browser session. A new audit entry (<code style={{ fontFamily: "monospace" }}>AUDIT_LEDGER_CLEARED</code>) will immediately be registered marking this administrative action.
              </p>
            </div>
            <div className="sp-modal-actions" style={{ padding: "12px 20px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                className="sp-btn sp-btn--secondary"
                onClick={() => setShowClearAuditModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sp-btn sp-btn--primary"
                style={{ backgroundColor: "#dc2626", borderColor: "#dc2626", color: "#ffffff" }}
                onClick={handleClearAuditLedger}
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
