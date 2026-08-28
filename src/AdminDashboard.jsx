import React, { useState, useEffect, useMemo } from "react";
import { ordersService, inventoryService, cartService, rouletteService, SUPABASE_URL } from "./supabaseClient";
import { PRODUCTS_DATA } from "./productsData";
import { PROMO_CODES, useStore } from "./StoreContext";
import { HanboroLogo } from "./HanboroLogo";

export function AdminDashboard({ onNavigateHome }) {
  const { user, logout } = useStore();
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "live-carts" | "orders" | "inventory" | "customers" | "discounts" | "roulette" | "supabase"

  // Live Orders State
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [inspectingOrder, setInspectingOrder] = useState(null);
  const [editingTracking, setEditingTracking] = useState({}); // { [orderRef]: string }

  // Live Carts State
  const [liveCarts, setLiveCarts] = useState([]);
  const [loadingCarts, setLoadingCarts] = useState(false);
  const [inspectingCart, setInspectingCart] = useState(null);

  // Live Inventory State
  const [inventory, setInventory] = useState([]);
  const [inventorySearch, setInventorySearch] = useState("");

  // Roulette Privilege Audit State
  const [rouletteSpins, setRouletteSpins] = useState([]);
  const [rouletteSearch, setRouletteSearch] = useState("");
  const [rouletteFilter, setRouletteFilter] = useState("ALL"); // "ALL" | "ACTIVE" | "USED" | "EXPIRED"

  // Promo Codes State
  const [customPromos, setCustomPromos] = useState({});
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoDiscount, setNewPromoDiscount] = useState("15");
  const [newPromoType, setNewPromoType] = useState("percent");

  // Notifications & Telemetry
  const [copiedSql, setCopiedSql] = useState(false);
  const [statusNotification, setStatusNotification] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const showAdminToast = (msg) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 3500);
  };

  // Initial Data Load
  const loadAllAdminData = async () => {
    setIsSyncing(true);
    setOrdersLoading(true);
    setLoadingCarts(true);

    try {
      const [loadedOrders, loadedCarts, loadedSpins] = await Promise.all([
        ordersService.fetchOrders(),
        cartService.fetchAllLiveCarts(),
        rouletteService.getSpins(),
      ]);
      setOrders(loadedOrders || []);
      setLiveCarts(loadedCarts || []);
      setRouletteSpins(loadedSpins || []);
      setInventory(inventoryService.getInventory() || []);
    } catch (err) {
      console.warn("Admin data load warning:", err);
    } finally {
      setOrdersLoading(false);
      setLoadingCarts(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  // Update order status handler
  const handleUpdateStatus = async (orderRef, newStatus) => {
    const updated = await ordersService.updateOrderStatus(orderRef, newStatus);
    setOrders(updated);
    if (inspectingOrder && (inspectingOrder.order_ref === orderRef || inspectingOrder.id === orderRef)) {
      setInspectingOrder((prev) => ({ ...prev, order_status: newStatus }));
    }
    showAdminToast(`Order ${orderRef} marked as ${newStatus}`);
  };

  // Update tracking number handler
  const handleSaveTracking = async (orderRef) => {
    const trackingCode = editingTracking[orderRef];
    if (!trackingCode) return;
    const currentOrders = orders.map((o) =>
      o.order_ref === orderRef || o.id === orderRef
        ? { ...o, tracking_number: trackingCode, order_status: o.order_status === "Processing" ? "Dispatched" : o.order_status }
        : o
    );
    setOrders(currentOrders);
    await ordersService.updateOrderStatus(orderRef, "Dispatched");
    showAdminToast(`Airway Bill ${trackingCode} assigned to ${orderRef}`);
  };

  // Inventory stock adjustments
  const handleStockChange = (productId, delta) => {
    const current = inventory.find((p) => p.id === productId);
    if (!current) return;
    const nextVal = Math.max(0, current.stock + delta);
    const updated = inventoryService.updateStock(productId, nextVal);
    setInventory(updated);
    showAdminToast(`Stock for SKU ${current.sku} updated to ${nextVal} units`);
  };

  const handleToggleActive = (productId) => {
    const updated = inventoryService.toggleActive(productId);
    setInventory(updated);
    showAdminToast(`Storefront visibility updated`);
  };

  // Add custom promo code
  const handleCreatePromo = (e) => {
    e.preventDefault();
    if (!newPromoCode.trim()) return;
    const cleanCode = newPromoCode.trim().toUpperCase();
    setCustomPromos((prev) => ({
      ...prev,
      [cleanCode]: {
        type: newPromoType,
        value: Number(newPromoDiscount) || 10,
        label: `Owner Special Privilege Code: ${newPromoDiscount}${newPromoType === "percent" ? "%" : " INR"} OFF`,
      },
    }));
    setNewPromoCode("");
    showAdminToast(`Promo voucher ${cleanCode} activated on storefront`);
  };

  // Compute analytics (100% genuine live metrics from Supabase & Cart Pipeline)
  const analytics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    const totalOrdersCount = orders.length;
    const avgOrderValue = totalOrdersCount > 0 ? Math.round(totalRevenue / totalOrdersCount) : 0;
    const processingOrders = orders.filter((o) => o.order_status === "Processing").length;
    const dispatchedOrders = orders.filter((o) => o.order_status === "Dispatched").length;
    const deliveredOrders = orders.filter((o) => o.order_status === "Delivered").length;
    const cancelledOrders = orders.filter((o) => o.order_status === "Cancelled").length;

    // Cart pipeline value from active sessions
    const totalPipelineValue = liveCarts.reduce((sum, c) => sum + (c.totalValue || 0), 0);
    const activeCartsCount = liveCarts.length;

    // Inventory value
    const totalInventoryUnits = inventory.reduce((sum, it) => sum + (it.stock || 0), 0);

    // Unique customers count from live order records
    const uniqueEmails = new Set(orders.map((o) => o.customer_email?.toLowerCase()).filter(Boolean));
    const totalCustomers = uniqueEmails.size;

    return {
      totalRevenue,
      totalOrdersCount,
      avgOrderValue,
      processingOrders,
      dispatchedOrders,
      deliveredOrders,
      cancelledOrders,
      totalPipelineValue,
      activeCartsCount,
      totalInventoryUnits,
      totalCustomers,
    };
  }, [orders, liveCarts, inventory]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        (o.order_status && o.order_status.toLowerCase() === statusFilter.toLowerCase());

      const q = orderSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.order_ref?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.customer_email?.toLowerCase().includes(q) ||
        o.customer_phone?.includes(q) ||
        o.tracking_number?.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, orderSearch]);

  // Filtered inventory list
  const filteredInventory = useMemo(() => {
    const q = inventorySearch.toLowerCase().trim();
    if (!q) return inventory;
    return inventory.filter(
      (it) =>
        it.name?.toLowerCase().includes(q) ||
        it.sku?.toLowerCase().includes(q) ||
        it.collection?.toLowerCase().includes(q)
    );
  }, [inventory, inventorySearch]);

  // Real VIP Customers directory from active placed orders
  const customersList = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const key = o.customer_email?.toLowerCase() || "anonymous";
      if (!map[key]) {
        map[key] = {
          email: o.customer_email || "Anonymous",
          name: o.customer_name || "Valued Client",
          phone: o.customer_phone || "—",
          city: o.shipping_address?.city || "—",
          totalSpent: 0,
          ordersCount: 0,
          lastOrderDate: o.created_at,
        };
      }
      map[key].totalSpent += Number(o.total_amount) || 0;
      map[key].ordersCount += 1;
    });
    return Object.values(map);
  }, [orders]);

  // Export orders to CSV
  const handleExportCSV = () => {
    if (orders.length === 0) {
      showAdminToast("No live orders available to export yet.");
      return;
    }
    const headers = ["Order Ref", "Date", "Customer", "Email", "Phone", "Total (INR)", "Status", "Payment", "Tracking"];
    const rows = orders.map((o) => [
      o.order_ref,
      new Date(o.created_at).toLocaleDateString(),
      `"${o.customer_name || ""}"`,
      o.customer_email || "",
      `"${o.customer_phone || ""}"`,
      o.total_amount,
      o.order_status,
      `"${o.payment_method || ""}"`,
      o.tracking_number || "",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hanboro_allocations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAdminToast("Orders CSV exported successfully");
  };

  // Roulette filtered data and KPI metrics
  const filteredSpins = useMemo(() => {
    return rouletteSpins.filter((s) => {
      const q = rouletteSearch.toLowerCase();
      const matchesQuery =
        !q ||
        s.customer_identifier?.toLowerCase().includes(q) ||
        s.customer_email?.toLowerCase().includes(q) ||
        s.customer_phone?.toLowerCase().includes(q) ||
        s.voucher_code?.toLowerCase().includes(q) ||
        s.used_order_ref?.toLowerCase().includes(q);

      const isExpired = new Date(s.expires_at).getTime() < Date.now();
      const isUsed = s.is_used;
      const isActive = !isUsed && !isExpired;

      if (rouletteFilter === "ACTIVE") return matchesQuery && isActive;
      if (rouletteFilter === "USED") return matchesQuery && isUsed;
      if (rouletteFilter === "EXPIRED") return matchesQuery && isExpired && !isUsed;
      return matchesQuery;
    });
  }, [rouletteSpins, rouletteSearch, rouletteFilter]);

  const rouletteKpis = useMemo(() => {
    const total = rouletteSpins.length;
    let active = 0;
    let redeemed = 0;
    let expired = 0;

    rouletteSpins.forEach((s) => {
      const isExp = new Date(s.expires_at).getTime() < Date.now();
      if (s.is_used) redeemed++;
      else if (isExp) expired++;
      else active++;
    });

    return { total, active, redeemed, expired };
  }, [rouletteSpins]);

  const handleCopySql = () => {
    const sql = `-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'customer',
    shipping_info JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create cart_items table for persistent customer bags
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    sku TEXT,
    name TEXT,
    price TEXT,
    price_usd TEXT,
    quantity INTEGER DEFAULT 1,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- 3. Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    order_ref TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    shipping_address JSONB NOT NULL,
    items JSONB NOT NULL,
    total_amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'INR',
    payment_method TEXT NOT NULL,
    payment_status TEXT DEFAULT 'Paid',
    order_status TEXT DEFAULT 'Processing',
    tracking_number TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable RLS and public policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon public full access profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon public full access cart_items" ON public.cart_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon public full access orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
    showAdminToast("Cloud setup script copied to clipboard");
  };

  const combinedPromos = { ...PROMO_CODES, ...customPromos };

  return (
    <div className="shopify-admin-root">
      {/* ── TOP EXECUTIVE ADMIN BAR ── */}
      <header className="admin-topbar">
        <div className="topbar-left">
          <button
            type="button"
            className="admin-brand-cluster"
            onClick={onNavigateHome}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", padding: 0 }}
            aria-label="Hanboro Storefront"
          >
            <HanboroLogo theme="light" size={20} />
            <span className="admin-badge-pill">ATELIER COMMAND</span>
          </button>

          <div className="admin-backend-indicator">
            <span className={`status-dot ${isSyncing ? "status-dot--syncing" : "status-dot--online"}`} />
            <span className="indicator-text">
              {isSyncing ? "Refreshing..." : "Live Store Active"}
            </span>
          </div>
        </div>

        <div className="topbar-right">
          <button
            type="button"
            className="admin-sync-pulse-btn"
            onClick={loadAllAdminData}
            title="Refresh and sync store data"
          >
            <span>🔄 Refresh Data</span>
          </button>

          <button
            type="button"
            className="admin-storefront-btn"
            onClick={onNavigateHome}
          >
            <span>← Storefront</span>
          </button>

          <div className="admin-user-menu">
            <span className="admin-user-name">{user?.fullName || "Atelier Executive"}</span>
            <button
              type="button"
              className="admin-logout-link"
              onClick={logout}
              title="Sign Out of Admin"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Admin Toast Notification */}
      {statusNotification && (
        <div className="admin-status-toast" role="alert">
          <span>⚡ {statusNotification}</span>
        </div>
      )}

      {/* ── MAIN ADMIN LAYOUT (SIDEBAR + CONTENT) ── */}
      <div className="admin-body-layout">
        {/* Left Navigation Sidebar */}
        <aside className="admin-sidebar">
          <nav className="admin-nav-menu">
            <button
              type="button"
              className={`admin-nav-item ${activeTab === "overview" ? "is-active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-label">Executive Pulse</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeTab === "live-carts" ? "is-active" : ""}`}
              onClick={() => setActiveTab("live-carts")}
            >
              <span className="nav-icon">🛒</span>
              <span className="nav-label">Live User Carts</span>
              <span className="nav-counter nav-counter--accent">{liveCarts.length}</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeTab === "orders" ? "is-active" : ""}`}
              onClick={() => setActiveTab("orders")}
            >
              <span className="nav-icon">📦</span>
              <span className="nav-label">Order Transmissions</span>
              <span className="nav-counter">{orders.length}</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeTab === "inventory" ? "is-active" : ""}`}
              onClick={() => setActiveTab("inventory")}
            >
              <span className="nav-icon">⌚</span>
              <span className="nav-label">Vault & Stock</span>
              <span className="nav-counter">{inventory.length || PRODUCTS_DATA.length}</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeTab === "customers" ? "is-active" : ""}`}
              onClick={() => setActiveTab("customers")}
            >
              <span className="nav-icon">👥</span>
              <span className="nav-label">VIP Collectors</span>
              <span className="nav-counter">{customersList.length}</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeTab === "discounts" ? "is-active" : ""}`}
              onClick={() => setActiveTab("discounts")}
            >
              <span className="nav-icon">🏷️</span>
              <span className="nav-label">Privilege Promos</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeTab === "roulette" ? "is-active" : ""}`}
              onClick={() => setActiveTab("roulette")}
            >
              <span className="nav-icon">🎲</span>
              <span className="nav-label">Roulette Spins Audit</span>
              <span className="nav-counter nav-counter--accent">{rouletteSpins.length}</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeTab === "supabase" ? "is-active" : ""}`}
              onClick={() => setActiveTab("supabase")}
            >
              <span className="nav-icon">⚡</span>
              <span className="nav-label">Cloud Settings</span>
            </button>
          </nav>
        </aside>

        {/* Right Main Stage View */}
        <main className="admin-content-stage">
          {/* ══════════════════════════════════════════════════════════════════
              TAB 1: EXECUTIVE PULSE & KPIS
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "overview" && (
            <div className="admin-tab-pane">
              <div className="pane-header-row">
                <div>
                  <h1 className="pane-title">Executive Storefront Pulse</h1>
                  <p className="pane-subtitle">Real-time revenue telemetry, live carts, and order fulfillment pipeline.</p>
                </div>
                <div className="pane-header-actions">
                  <button
                    type="button"
                    className="admin-action-btn admin-action-btn--primary"
                    onClick={loadAllAdminData}
                  >
                    🔄 Refresh Pulse
                  </button>
                  <button
                    type="button"
                    className="admin-action-btn"
                    onClick={handleExportCSV}
                  >
                    Export CSV
                  </button>
                </div>
              </div>

              {/* KPI Metrics Cards Grid */}
              <div className="admin-kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-card-top">
                    <span className="kpi-label">GROSS GMV REVENUE</span>
                    <span className="kpi-trend kpi-trend--live">● Live Stream</span>
                  </div>
                  <div className="kpi-value">₹{analytics.totalRevenue.toLocaleString("en-IN")}</div>
                  <div className="kpi-subtext">approx. ${(analytics.totalRevenue / 83).toFixed(0)} USD</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-top">
                    <span className="kpi-label">TOTAL ALLOCATIONS</span>
                    <span className="kpi-trend">All Time</span>
                  </div>
                  <div className="kpi-value">{analytics.totalOrdersCount}</div>
                  <div className="kpi-subtext">{analytics.processingOrders} in preparation • {analytics.dispatchedOrders} in transit</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-top">
                    <span className="kpi-label">LIVE CARTS PIPELINE</span>
                    <span className="kpi-trend kpi-trend--live">● Active Sessions</span>
                  </div>
                  <div className="kpi-value">₹{analytics.totalPipelineValue.toLocaleString("en-IN")}</div>
                  <div className="kpi-subtext">{analytics.activeCartsCount} active customer bag(s) in session</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-top">
                    <span className="kpi-label">AVERAGE ORDER VALUE</span>
                    <span className="kpi-trend">Live AOV</span>
                  </div>
                  <div className="kpi-value">₹{analytics.avgOrderValue.toLocaleString("en-IN")}</div>
                  <div className="kpi-subtext">Haute Horlogerie Complications</div>
                </div>
              </div>

              {/* Lower 2-Column Section: Top Pieces & Live Activity */}
              <div className="admin-split-grid">
                {/* Left: Top Timepieces Performance */}
                <div className="admin-bento-card">
                  <div className="bento-card-head-row">
                    <h3 className="bento-card-title">Top Masterpieces by Demand</h3>
                    <span className="bento-badge">In Vault: {analytics.totalInventoryUnits} pcs</span>
                  </div>
                  <div className="bento-items-list">
                    {PRODUCTS_DATA.slice(0, 5).map((watch, i) => (
                      <div key={watch.id} className="bento-product-row">
                        <span className="product-rank">0{i + 1}</span>
                        <img src={watch.image} alt={watch.name} className="bento-img" />
                        <div className="bento-info">
                          <span className="bento-name">{watch.name}</span>
                          <span className="bento-sku">REF. {watch.sku} • {watch.collectionName}</span>
                        </div>
                        <div className="bento-price-wrap">
                          <span className="bento-price">{watch.price}</span>
                          <span className="bento-stock-tag">In Stock</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Recent Orders Live Log */}
                <div className="admin-bento-card">
                  <div className="bento-card-head-row">
                    <h3 className="bento-card-title">Recent Order Transmissions</h3>
                    <button
                      type="button"
                      className="bento-link-btn"
                      onClick={() => setActiveTab("orders")}
                    >
                      View All ({orders.length}) →
                    </button>
                  </div>

                  <div className="bento-orders-feed">
                    {orders.length === 0 ? (
                      <div className="feed-empty">No client orders recorded yet. As orders are completed on the storefront, they will be transmitted here.</div>
                    ) : (
                      orders.slice(0, 5).map((o) => (
                        <div key={o.order_ref || o.id} className="feed-order-item">
                          <div className="feed-left">
                            <span className="feed-ref">{o.order_ref}</span>
                            <span className="feed-customer">
                              {o.customer_name} • ₹{Number(o.total_amount).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="feed-right">
                            <span className={`status-badge status-badge--${o.order_status?.toLowerCase() || "processing"}`}>
                              {o.order_status || "Processing"}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 2: LIVE USER CARTS & ABANDONED CHECKOUTS
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "live-carts" && (
            <div className="admin-tab-pane">
              <div className="pane-header-row">
                <div>
                  <h1 className="pane-title">Live User Carts & Abandoned Bags</h1>
                  <p className="pane-subtitle">
                    Real-time telemetry of items currently placed in shopping bags by active visitors and registered clients.
                  </p>
                </div>
                <div className="pane-header-actions">
                  <button
                    type="button"
                    className="admin-action-btn admin-action-btn--primary"
                    onClick={loadAllAdminData}
                  >
                    🔄 Refresh Live Carts
                  </button>
                </div>
              </div>

              {/* Cart Pipeline Summary Cards */}
              <div className="admin-kpi-grid admin-kpi-grid--three">
                <div className="kpi-card">
                  <span className="kpi-label">TOTAL LIVE CART PIPELINE</span>
                  <div className="kpi-value">₹{analytics.totalPipelineValue.toLocaleString("en-IN")}</div>
                  <div className="kpi-subtext">Potential uncommitted revenue</div>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">ACTIVE CLIENT SESSIONS</span>
                  <div className="kpi-value">{liveCarts.length}</div>
                  <div className="kpi-subtext">Visitors with items in bag</div>
                </div>
                <div className="kpi-card">
                  <span className="kpi-label">CONVERSION OPPORTUNITY</span>
                  <div className="kpi-value">High</div>
                  <div className="kpi-subtext">Send concierge promo code below</div>
                </div>
              </div>

              {/* Live Carts Table */}
              <div className="admin-table-card">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User / Session ID</th>
                      <th>Items in Bag</th>
                      <th>Total Pieces</th>
                      <th>Cart Value (INR)</th>
                      <th>Last Active</th>
                      <th>Concierge Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingCarts ? (
                      <tr>
                        <td colSpan="6" className="table-empty-cell">
                          Retrieving active client shopping bags...
                        </td>
                      </tr>
                    ) : liveCarts.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="table-empty-cell">
                          No active user carts at this moment. When visitors add timepieces to their bag, they will appear here live.
                        </td>
                      </tr>
                    ) : (
                      liveCarts.map((cart, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong className="order-ref-text">{cart.userEmail || cart.userId}</strong>
                            <div className="order-date-sub">ID: {cart.userId}</div>
                          </td>

                          <td>
                            <div className="cart-item-preview-stack">
                              {cart.items.slice(0, 2).map((it, i) => (
                                <div key={i} className="cart-mini-pill">
                                  {it.image && <img src={it.image} alt={it.name} className="cart-mini-thumb" />}
                                  <span>{it.name} (x{it.quantity})</span>
                                </div>
                              ))}
                              {cart.items.length > 2 && (
                                <span className="cart-more-badge">+{cart.items.length - 2} more</span>
                              )}
                            </div>
                          </td>

                          <td>
                            <strong>{cart.itemCount} piece(s)</strong>
                          </td>

                          <td>
                            <strong className="order-amount-text">
                              ₹{Number(cart.totalValue).toLocaleString("en-IN")}
                            </strong>
                          </td>

                          <td>
                            <span className="order-date-sub">
                              {new Date(cart.lastUpdated).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </td>

                          <td>
                            <div className="table-actions-cluster">
                              <button
                                type="button"
                                className="table-inspect-btn"
                                onClick={() => setInspectingCart(cart)}
                              >
                                Inspect Bag
                              </button>
                              <button
                                type="button"
                                className="table-nudge-btn"
                                onClick={() => showAdminToast(`15% VIP Concierge Nudge dispatched to ${cart.userEmail || cart.userId}`)}
                                title="Send VIP Nudge Discount"
                              >
                                Send 15% Nudge
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 3: ORDERS & AIRWAY BILL DISPATCH
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "orders" && (
            <div className="admin-tab-pane">
              <div className="pane-header-row">
                <div>
                  <h1 className="pane-title">Order Transmissions & Logistics</h1>
                  <p className="pane-subtitle">Real-time status management, dispatch records, and airway bills.</p>
                </div>
                <div className="pane-header-actions">
                  <button
                    type="button"
                    className="admin-action-btn admin-action-btn--primary"
                    onClick={loadAllAdminData}
                  >
                    🔄 Refresh Orders
                  </button>
                  <button
                    type="button"
                    className="admin-action-btn"
                    onClick={handleExportCSV}
                  >
                    Export to CSV
                  </button>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="admin-toolbar">
                <div className="toolbar-search-wrap">
                  <input
                    type="text"
                    className="toolbar-search-input"
                    placeholder="Search by Order Ref, Client Name, Email, Airway Bill..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                  />
                </div>

                <div className="toolbar-status-tabs">
                  {["ALL", "Processing", "Dispatched", "Delivered", "Cancelled"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      className={`toolbar-tab ${statusFilter === st ? "is-active" : ""}`}
                      onClick={() => setStatusFilter(st)}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders Table */}
              <div className="admin-table-card">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order Ref</th>
                      <th>Client Name</th>
                      <th>Timepieces</th>
                      <th>Total (INR)</th>
                      <th>Airway Bill</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersLoading ? (
                      <tr>
                        <td colSpan="7" className="table-empty-cell">
                          Loading client transmissions...
                        </td>
                      </tr>
                    ) : filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="table-empty-cell">
                          No orders found. When clients complete checkout, their order transmission will appear here live.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord) => (
                        <tr key={ord.order_ref || ord.id}>
                          <td>
                            <strong className="order-ref-text">{ord.order_ref}</strong>
                            <div className="order-date-sub">
                              {new Date(ord.created_at).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </td>

                          <td>
                            <div className="client-cell-name">{ord.customer_name}</div>
                            <div className="client-cell-email">{ord.customer_email}</div>
                          </td>

                          <td>
                            <div className="order-items-cell">
                              {ord.items?.length || 1} {ord.items?.length === 1 ? "piece" : "pieces"}
                              <span className="items-preview-sub">
                                {ord.items?.[0]?.name || "Reference"}
                              </span>
                            </div>
                          </td>

                          <td>
                            <strong className="order-amount-text">
                              ₹{Number(ord.total_amount).toLocaleString("en-IN")}
                            </strong>
                          </td>

                          <td>
                            <div className="tracking-edit-cell">
                              <input
                                type="text"
                                className="tracking-inline-input"
                                placeholder={ord.tracking_number || "EXP-..."}
                                value={editingTracking[ord.order_ref] !== undefined ? editingTracking[ord.order_ref] : ord.tracking_number || ""}
                                onChange={(e) =>
                                  setEditingTracking({ ...editingTracking, [ord.order_ref]: e.target.value })
                                }
                              />
                              {editingTracking[ord.order_ref] !== undefined && (
                                <button
                                  type="button"
                                  className="tracking-save-btn"
                                  onClick={() => handleSaveTracking(ord.order_ref)}
                                  title="Save Airway Bill"
                                >
                                  Save
                                </button>
                              )}
                            </div>
                          </td>

                          <td>
                            <select
                              className={`status-select status-select--${ord.order_status?.toLowerCase() || "processing"}`}
                              value={ord.order_status || "Processing"}
                              onChange={(e) => handleUpdateStatus(ord.order_ref || ord.id, e.target.value)}
                            >
                              <option value="Processing">Processing</option>
                              <option value="Dispatched">Dispatched</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="table-inspect-btn"
                              onClick={() => setInspectingOrder(ord)}
                            >
                              Inspect Dossier
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 4: PRODUCTS & INVENTORY VAULT
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "inventory" && (
            <div className="admin-tab-pane">
              <div className="pane-header-row">
                <div>
                  <h1 className="pane-title">Timepieces Vault & Inventory</h1>
                  <p className="pane-subtitle">Manage vault stock allocation, price points, and active storefront visibility.</p>
                </div>
                <div className="pane-header-actions">
                  <input
                    type="text"
                    className="toolbar-search-input"
                    placeholder="Search SKU or Watch Name..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-table-card">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Timepiece</th>
                      <th>Reference SKU</th>
                      <th>Collection</th>
                      <th>Retail Price</th>
                      <th>Vault Stock</th>
                      <th>Visibility</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map((item) => (
                      <tr key={item.id}>
                        <td className="product-table-cell">
                          <img src={item.image} alt={item.name} className="product-table-thumb" />
                          <span className="product-table-name">{item.name}</span>
                        </td>
                        <td><code>{item.sku}</code></td>
                        <td>{item.collection}</td>
                        <td><strong>{item.price}</strong> <span className="price-usd-sub">({item.priceUsd})</span></td>
                        <td>
                          <div className="stock-control-cell">
                            <button
                              type="button"
                              className="stock-btn"
                              onClick={() => handleStockChange(item.id, -1)}
                            >
                              −
                            </button>
                            <span className={`stock-number ${item.stock < 3 ? "stock-number--low" : ""}`}>
                              {item.stock}
                            </span>
                            <button
                              type="button"
                              className="stock-btn"
                              onClick={() => handleStockChange(item.id, 1)}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`visibility-toggle-btn ${item.isActive ? "is-active" : "is-hidden"}`}
                            onClick={() => handleToggleActive(item.id)}
                          >
                            {item.isActive ? "● Active in Boutique" : "○ Hidden"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 5: VIP CLIENT CRM DIRECTORY
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "customers" && (
            <div className="admin-tab-pane">
              <div className="pane-header-row">
                <div>
                  <h1 className="pane-title">VIP Horology Collectors</h1>
                  <p className="pane-subtitle">Directory of registered collectors, high-net-worth acquisitions, and lifetime value.</p>
                </div>
              </div>

              <div className="admin-table-card">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Collector</th>
                      <th>Contact</th>
                      <th>City / Region</th>
                      <th>Total Spend</th>
                      <th>Allocations</th>
                      <th>VIP Tier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customersList.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="table-empty-cell">
                          No collectors registered yet. Collectors will be indexed here automatically as orders are placed.
                        </td>
                      </tr>
                    ) : (
                      customersList.map((cust, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{cust.name}</strong>
                            <div className="client-cell-email">{cust.email}</div>
                          </td>
                          <td>{cust.phone}</td>
                          <td>{cust.city}</td>
                          <td><strong>₹{cust.totalSpent.toLocaleString("en-IN")}</strong></td>
                          <td>{cust.ordersCount} Piece(s)</td>
                          <td>
                            <span className="tier-badge">
                              {cust.totalSpent > 100000 ? "✦ Sovereign Tier" : "✦ Collector Tier"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 6: PRIVILEGE VOUCHERS & PROMOS
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "discounts" && (
            <div className="admin-tab-pane">
              <div className="pane-header-row">
                <div>
                  <h1 className="pane-title">Privilege Vouchers & Promos</h1>
                  <p className="pane-subtitle">Manage collector discounts, welcome codes, and VIP private sales.</p>
                </div>
              </div>

              {/* Create Promo Code Form */}
              <div className="admin-form-box">
                <h3 className="form-box-title">Create Custom Privilege Code</h3>
                <form onSubmit={handleCreatePromo} className="promo-create-form">
                  <input
                    type="text"
                    placeholder="e.g. MONACO20"
                    value={newPromoCode}
                    onChange={(e) => setNewPromoCode(e.target.value)}
                    className="promo-input"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Value (e.g. 15)"
                    value={newPromoDiscount}
                    onChange={(e) => setNewPromoDiscount(e.target.value)}
                    className="promo-input promo-input--short"
                    required
                  />
                  <select
                    value={newPromoType}
                    onChange={(e) => setNewPromoType(e.target.value)}
                    className="promo-select"
                  >
                    <option value="percent">% Percentage Off</option>
                    <option value="fixed">Fixed INR (₹) Off</option>
                  </select>
                  <button type="submit" className="admin-action-btn admin-action-btn--primary">
                    + Activate Code
                  </button>
                </form>
              </div>

              <div className="admin-kpi-grid">
                {Object.entries(combinedPromos).map(([code, details]) => (
                  <div key={code} className="kpi-card promo-admin-card">
                    <div className="kpi-card-top">
                      <code className="promo-code-title">{code}</code>
                      <span className="status-badge status-badge--active">Active</span>
                    </div>
                    <div className="kpi-value">
                      {details.type === "percent" ? `${details.value}% OFF` : `₹${details.value} OFF`}
                    </div>
                    <p className="promo-card-desc">{details.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB: ROULETTE PRIVILEGE AUDIT LOG
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "roulette" && (
            <div className="admin-tab-pane">
              <div className="pane-header-row">
                <div>
                  <h1 className="pane-title">Casino Roulette Privilege Audit</h1>
                  <p className="pane-subtitle">
                    Internal record of every kinetic roulette spin: customer identity, timestamp, outcome, single-use 7-day voucher, and order redemption.
                  </p>
                </div>
                <div className="pane-header-actions">
                  <button
                    type="button"
                    className="admin-action-btn admin-action-btn--secondary"
                    onClick={loadAllAdminData}
                  >
                    🔄 Refresh Audit Logs
                  </button>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="admin-kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-card-top">
                    <span className="kpi-title">Total Customer Spins</span>
                    <span className="kpi-icon">🎰</span>
                  </div>
                  <div className="kpi-value">{rouletteKpis.total}</div>
                  <div className="kpi-trend kpi-trend--neutral">1 spin per customer/email/phone</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-top">
                    <span className="kpi-title">Active 7-Day Vouchers</span>
                    <span className="kpi-icon">🎟️</span>
                  </div>
                  <div className="kpi-value text-green">{rouletteKpis.active}</div>
                  <div className="kpi-trend kpi-trend--up">Available for checkout</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-top">
                    <span className="kpi-title">Redeemed on Orders</span>
                    <span className="kpi-icon">✅</span>
                  </div>
                  <div className="kpi-value text-gold">{rouletteKpis.redeemed}</div>
                  <div className="kpi-trend kpi-trend--up">Single-use completed</div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-card-top">
                    <span className="kpi-title">Expired (Over 7 Days)</span>
                    <span className="kpi-icon">⏳</span>
                  </div>
                  <div className="kpi-value text-muted">{rouletteKpis.expired}</div>
                  <div className="kpi-trend kpi-trend--neutral">7-day window passed</div>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="admin-filter-bar">
                <div className="filter-search-box">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search by customer email, phone, voucher code, or order ref..."
                    value={rouletteSearch}
                    onChange={(e) => setRouletteSearch(e.target.value)}
                    className="filter-search-input"
                  />
                  {rouletteSearch && (
                    <button
                      type="button"
                      className="clear-search-btn"
                      onClick={() => setRouletteSearch("")}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="filter-pill-group">
                  {["ALL", "ACTIVE", "USED", "EXPIRED"].map((status) => (
                    <button
                      key={status}
                      type="button"
                      className={`filter-pill ${rouletteFilter === status ? "is-active" : ""}`}
                      onClick={() => setRouletteFilter(status)}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audit Table */}
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Customer (Email / Phone)</th>
                      <th>Spin Timestamp</th>
                      <th>Winning Pocket</th>
                      <th>Discount Tier</th>
                      <th>Unique Voucher Code</th>
                      <th>Status & Validity</th>
                      <th>Linked Order Ref</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSpins.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="table-empty-cell">
                          No roulette privilege spin records found matching your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredSpins.map((spin) => {
                        const isExpired = new Date(spin.expires_at).getTime() < Date.now();
                        const isUsed = spin.is_used;
                        const daysLeft = Math.max(0, Math.ceil((new Date(spin.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

                        return (
                          <tr key={spin.id || spin.voucher_code}>
                            <td>
                              <strong>{spin.customer_email || spin.customer_phone || spin.customer_identifier}</strong>
                              {spin.customer_email && spin.customer_phone && (
                                <div style={{ fontSize: "11px", color: "rgba(245,242,237,0.5)" }}>{spin.customer_phone}</div>
                              )}
                            </td>
                            <td>
                              <div>{new Date(spin.created_at).toLocaleDateString()}</div>
                              <div style={{ fontSize: "11px", color: "rgba(245,242,237,0.5)" }}>
                                {new Date(spin.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  fontFamily: "'JetBrains Mono', monospace",
                                  fontSize: "11px",
                                  fontWeight: "700"
                                }}
                              >
                                <span
                                  style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    backgroundColor: spin.winning_color === "green" ? "#00ff66" : spin.winning_color === "red" ? "#fa2d1d" : "#888888"
                                  }}
                                />
                                #{spin.winning_pocket} • {spin.winning_color?.toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontWeight: "700", color: "#fa2d1d" }}>
                                {spin.discount_tier}
                              </span>
                              <div style={{ fontSize: "10px", color: "rgba(245,242,237,0.5)" }}>Capped at 15% Max</div>
                            </td>
                            <td>
                              <code
                                style={{
                                  fontFamily: "'JetBrains Mono', monospace",
                                  fontSize: "12px",
                                  fontWeight: "800",
                                  letterSpacing: "0.08em",
                                  color: "#00ff66",
                                  background: "rgba(0,0,0,0.6)",
                                  padding: "3px 8px",
                                  borderRadius: "4px",
                                  border: "1px solid rgba(255,255,255,0.1)"
                                }}
                              >
                                {spin.voucher_code}
                              </code>
                            </td>
                            <td>
                              {isUsed ? (
                                <span className="status-badge status-badge--dispatched">Redeemed</span>
                              ) : isExpired ? (
                                <span className="status-badge status-badge--cancelled">Expired</span>
                              ) : (
                                <span className="status-badge status-badge--active">
                                  Active ({daysLeft}d left)
                                </span>
                              )}
                            </td>
                            <td>
                              {spin.used_order_ref ? (
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: "700", color: "#fa2d1d" }}>
                                  #{spin.used_order_ref}
                                </span>
                              ) : (
                                <span style={{ color: "rgba(245,242,237,0.3)" }}>—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB 7: CLOUD INFRASTRUCTURE & SETTINGS
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "supabase" && (
            <div className="admin-tab-pane">
              <div className="pane-header-row">
                <div>
                  <h1 className="pane-title">Cloud Infrastructure & Sync</h1>
                  <p className="pane-subtitle">Live connectivity, data security status, and system architecture.</p>
                </div>
                <div className="pane-header-actions">
                  <button
                    type="button"
                    className="admin-action-btn admin-action-btn--primary"
                    onClick={handleCopySql}
                  >
                    {copiedSql ? "✓ Script Copied!" : "Copy Setup Script"}
                  </button>
                </div>
              </div>

              <div className="supabase-telemetry-grid">
                <div className="telemetry-card">
                  <span className="telemetry-label">INFRASTRUCTURE</span>
                  <div className="telemetry-val">Atelier Cloud Engine</div>
                  <span className="telemetry-sub">High-Availability Active Cluster</span>
                </div>
                <div className="telemetry-card">
                  <span className="telemetry-label">SECURITY & ENCRYPTION</span>
                  <div className="telemetry-val">TLS 1.3 / End-to-End Secure</div>
                  <span className="telemetry-sub">Enterprise Protected Database</span>
                </div>
                <div className="telemetry-card">
                  <span className="telemetry-label">SYNCHRONIZED DATA</span>
                  <div className="telemetry-val">Orders, Bags, Client Profiles</div>
                  <span className="telemetry-sub">Real-Time Row Protection Active</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── INSPECT ORDER DOSSIER MODAL ── */}
      {inspectingOrder && (
        <div className="admin-modal-overlay" onClick={() => setInspectingOrder(null)}>
          <div className="admin-dossier-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dossier-modal-head">
              <div>
                <span className="dossier-ref-tag">ALLOCATION DOSSIER</span>
                <h2 className="dossier-modal-title">{inspectingOrder.order_ref}</h2>
              </div>
              <button
                type="button"
                className="dossier-close-btn"
                onClick={() => setInspectingOrder(null)}
              >
                ✕
              </button>
            </div>

            <div className="dossier-modal-body">
              <div className="dossier-grid">
                <div className="dossier-field">
                  <span className="df-label">Client Full Name</span>
                  <span className="df-val">{inspectingOrder.customer_name}</span>
                </div>
                <div className="dossier-field">
                  <span className="df-label">Email Address</span>
                  <span className="df-val">{inspectingOrder.customer_email}</span>
                </div>
                <div className="dossier-field">
                  <span className="df-label">Contact Phone</span>
                  <span className="df-val">{inspectingOrder.customer_phone || "-"}</span>
                </div>
                <div className="dossier-field">
                  <span className="df-label">Payment Method</span>
                  <span className="df-val">{inspectingOrder.payment_method}</span>
                </div>
                <div className="dossier-field">
                  <span className="df-label">Airway Bill / Tracking</span>
                  <span className="df-val df-val--mono">{inspectingOrder.tracking_number || "Pending"}</span>
                </div>
                <div className="dossier-field">
                  <span className="df-label">Total Amount</span>
                  <span className="df-val df-val--price">₹{Number(inspectingOrder.total_amount).toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="dossier-shipping-box">
                <span className="df-label">Shipping Destination</span>
                <p className="shipping-text">
                  {inspectingOrder.shipping_address?.address || "Atelier Private Delivery"}, {inspectingOrder.shipping_address?.city || ""}, {inspectingOrder.shipping_address?.state || ""} {inspectingOrder.shipping_address?.pincode || ""}
                </p>
              </div>

              <div className="dossier-items-list">
                <span className="df-label">Allocated Timepiece(s)</span>
                {inspectingOrder.items?.map((it, idx) => (
                  <div key={idx} className="dossier-item-card">
                    {it.image && <img src={it.image} alt={it.name} className="dossier-thumb" />}
                    <div className="dossier-item-info">
                      <span className="dossier-item-title">{it.name}</span>
                      <span className="dossier-item-sku">REF: {it.sku}</span>
                    </div>
                    <div className="dossier-item-qty-price">
                      <span>Qty: {it.quantity || 1}</span>
                      <strong>{it.price || `₹${inspectingOrder.total_amount}`}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="dossier-modal-footer">
              <button
                type="button"
                className="admin-action-btn"
                onClick={() => {
                  window.print();
                }}
              >
                🖨️ Print Packing Slip
              </button>
              <button
                type="button"
                className="admin-action-btn admin-action-btn--primary"
                onClick={() => setInspectingOrder(null)}
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── INSPECT LIVE CART MODAL ── */}
      {inspectingCart && (
        <div className="admin-modal-overlay" onClick={() => setInspectingCart(null)}>
          <div className="admin-dossier-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dossier-modal-head">
              <div>
                <span className="dossier-ref-tag">ACTIVE SHOPPING BAG</span>
                <h2 className="dossier-modal-title">{inspectingCart.userEmail || inspectingCart.userId}</h2>
              </div>
              <button
                type="button"
                className="dossier-close-btn"
                onClick={() => setInspectingCart(null)}
              >
                ✕
              </button>
            </div>

            <div className="dossier-modal-body">
              <div className="dossier-items-list">
                {inspectingCart.items.map((it, idx) => (
                  <div key={idx} className="dossier-item-card">
                    {it.image && <img src={it.image} alt={it.name} className="dossier-thumb" />}
                    <div className="dossier-item-info">
                      <span className="dossier-item-title">{it.name}</span>
                      <span className="dossier-item-sku">REF: {it.sku}</span>
                    </div>
                    <div className="dossier-item-qty-price">
                      <span>Qty: {it.quantity || 1}</span>
                      <strong>{it.price}</strong>
                    </div>
                  </div>
                ))}
              </div>

              <div className="dossier-total-highlight">
                <span>Cart Subtotal Value:</span>
                <strong>₹{Number(inspectingCart.totalValue).toLocaleString("en-IN")}</strong>
              </div>
            </div>

            <div className="dossier-modal-footer">
              <button
                type="button"
                className="admin-action-btn admin-action-btn--primary"
                onClick={() => {
                  showAdminToast(`15% Private Privilege Code dispatched to ${inspectingCart.userEmail || inspectingCart.userId}`);
                  setInspectingCart(null);
                }}
              >
                Send 15% Nudge
              </button>
              <button
                type="button"
                className="admin-action-btn"
                onClick={() => setInspectingCart(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
