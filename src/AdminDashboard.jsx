import React, { useState, useEffect, useMemo } from "react";
import {
  ordersService,
  inventoryService,
  cartService,
  rouletteService,
  draftOrdersService,
  discountsService,
  SUPABASE_URL,
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
  IconGrowth,
  IconDiscounts,
  IconContent,
  IconMarkets,
  IconAnalytics,
  IconStorefront,
  IconAgentic,
  IconSocial,
  IconSmind,
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
  IconMail,
} from "./AdminIcons";

// Initial realistic Abandoned Checkouts matching user's exact Shopify screenshot
const SHOPIFY_ABANDONED_SEED = [
  {
    id: "chk-44803879502008",
    checkoutNumber: "#44803879502008",
    createdAt: "Aug 27 at 3:12 pm",
    customerName: "Arnold Rombach",
    customerEmail: "arnold.rombach@vip-collector.com",
    customerPhone: "+919811234567",
    emailStatus: "Not sent",
    region: "India",
    recoveryStatus: "Not recovered",
    totalPrice: 40499.00,
    items: [{ name: "HANBORO Astroworld Tourbillon", sku: "HNB-ASTRO-BLK", price: 40499, qty: 1 }],
  },
  {
    id: "chk-44756740014264",
    checkoutNumber: "#44756740014264",
    createdAt: "Aug 20 at 10:44 pm",
    customerName: "jacksonhase8@gmail.com",
    customerEmail: "jacksonhase8@gmail.com",
    customerPhone: "+919876543210",
    emailStatus: "Not sent",
    region: "India",
    recoveryStatus: "Not recovered",
    totalPrice: 33299.00,
    items: [{ name: "HANBORO Casino Roulette Diamond", sku: "HNB-ROULETTE-BLUE", price: 33299, qty: 1 }],
  },
  {
    id: "chk-44745009706552",
    checkoutNumber: "#44745009706552",
    createdAt: "Aug 19 at 9:47 am",
    customerName: "Neeraj Chawla",
    customerEmail: "neeraj.chawla@delhihorology.in",
    customerPhone: "+919810123987",
    emailStatus: "Not sent",
    region: "India",
    recoveryStatus: "Not recovered",
    totalPrice: 257394.00,
    items: [
      { name: "HANBORO Celestial Dragon Tourbillon", sku: "HNB-DRAGON-RG", price: 185000, qty: 1 },
      { name: "HANBORO Cyber Cogwheel Skeleton", sku: "HNB-CYBER-SKEL", price: 72394, qty: 1 }
    ],
  },
  {
    id: "chk-44738869305640",
    checkoutNumber: "#44738869305640",
    createdAt: "Aug 14 at 4:23 am",
    customerName: "heliogjsksclcks.com",
    customerEmail: "heliogjsksclcks@gmail.com",
    customerPhone: "+919920334455",
    emailStatus: "Not sent",
    region: "India",
    recoveryStatus: "Not recovered",
    totalPrice: 34199.00,
    items: [{ name: "HANBORO World Globe Dual Time", sku: "HNB-GLOBE-SLV", price: 34199, qty: 1 }],
  },
  {
    id: "chk-44712256372920",
    checkoutNumber: "#44712256372920",
    createdAt: "Aug 14 at 12:03 am",
    customerName: "Uyfishui Hfishueu",
    customerEmail: "uyfishui@yahoo.com",
    customerPhone: "+918800554433",
    emailStatus: "Not sent",
    region: "India",
    recoveryStatus: "Not recovered",
    totalPrice: 34199.00,
    items: [{ name: "HANBORO Mechanical Tonneau Rose Gold", sku: "HNB-TONNEAU-RG", price: 34199, qty: 1 }],
  },
  {
    id: "chk-44673887174840",
    checkoutNumber: "#44673887174840",
    createdAt: "Aug 8 at 4:10 am",
    customerName: "mario.mittendrein@gmx.at",
    customerEmail: "mario.mittendrein@gmx.at",
    customerPhone: "+919711882233",
    emailStatus: "Not sent",
    region: "India",
    recoveryStatus: "Not recovered",
    totalPrice: 42929.10,
    items: [{ name: "HANBORO Kinetic Roulette Green Edition", sku: "HNB-ROULETTE-GRN", price: 42929.10, qty: 1 }],
  },
  {
    id: "chk-44616854831288",
    checkoutNumber: "#44616854831288",
    createdAt: "Jul 28 at 1:18 pm",
    customerName: "Anupam Gulati",
    customerEmail: "anupam.gulati@mumbaicapital.com",
    customerPhone: "+919820011223",
    emailStatus: "Not sent",
    region: "India",
    recoveryStatus: "Not recovered",
    totalPrice: 36719.10,
    items: [{ name: "HANBORO Skeleton Tourbillon DLC", sku: "HNB-SKEL-DLC", price: 36719.10, qty: 1 }],
  },
  {
    id: "chk-44608399671480",
    checkoutNumber: "#44608399671480",
    createdAt: "Jul 26 at 10:51 pm",
    customerName: "E401201@miamidade.gov",
    customerEmail: "e401201@miamidade.gov",
    customerPhone: "+919818833445",
    emailStatus: "Not sent",
    region: "India",
    recoveryStatus: "Not recovered",
    totalPrice: 47699.00,
    items: [{ name: "HANBORO Astroworld Celestial Blue", sku: "HNB-ASTRO-BLU", price: 47699, qty: 1 }],
  },
  {
    id: "chk-44585485107384",
    checkoutNumber: "#44585485107384",
    createdAt: "Jul 23 at 3:41 am",
    customerName: "Ifeoluwa T",
    customerEmail: "ifeoluwa.t@collector.org",
    customerPhone: "+919650022334",
    emailStatus: "Not sent",
    region: "India",
    recoveryStatus: "Not recovered",
    totalPrice: 26399.00,
    items: [{ name: "HANBORO Royal Tonneau Black Dial", sku: "HNB-TONNEAU-BLK", price: 26399, qty: 1 }],
  },
  {
    id: "chk-44581409390776",
    checkoutNumber: "#44581409390776",
    createdAt: "Jul 22 at 9:08 am",
    customerName: "Kristen Kotter",
    customerEmail: "kristen.kotter@swisswatch.ch",
    customerPhone: "+919810998877",
    emailStatus: "Not sent",
    region: "India",
    recoveryStatus: "Not recovered",
    totalPrice: 40799.00,
    items: [{ name: "HANBORO Casino Roulette Silver Edition", sku: "HNB-ROULETTE-SLV", price: 40799, qty: 1 }],
  },
  {
    id: "chk-44442504331448",
    checkoutNumber: "#44442504331448",
    createdAt: "Jul 2 at 12:06 am",
    customerName: "Mohan Singh",
    customerEmail: "mohan.singh@royalpunjab.in",
    customerPhone: "+919871122334",
    emailStatus: "Sent",
    region: "India",
    recoveryStatus: "Not recovered",
    totalPrice: 42929.10,
    items: [{ name: "HANBORO Celestial Dragon Automatic", sku: "HNB-DRAGON-AUTO", price: 42929.10, qty: 1 }],
  },
  {
    id: "chk-44399314567352",
    checkoutNumber: "#44399314567352",
    createdAt: "Jun 25 at 4:09 pm",
    customerName: "Noor Hafiz",
    customerEmail: "noor.hafiz@gulfhorology.ae",
    customerPhone: "+919910088776",
    emailStatus: "Sent",
    region: "India",
    recoveryStatus: "Not recovered",
    totalPrice: 29699.00,
    items: [{ name: "HANBORO Cyber Cogwheel Titanium", sku: "HNB-CYBER-TI", price: 29699, qty: 1 }],
  },
  {
    id: "chk-44397952663736",
    checkoutNumber: "#44397952663736",
    createdAt: "Jun 24 at 10:39 pm",
    customerName: "dr.shubham patil",
    customerEmail: "dr.shubham.patil@medcare.org",
    customerPhone: "+919822334455",
    emailStatus: "Sent",
    region: "India",
    recoveryStatus: "Not recovered",
    totalPrice: 33299.00,
    items: [{ name: "HANBORO Skeleton Tourbillon Rose Gold", sku: "HNB-SKEL-RG", price: 33299, qty: 1 }],
  },
];

// Initial realistic Orders matching user's exact Shopify screenshot
const SHOPIFY_ORDERS_SEED = [
  {
    id: "ord-1001",
    order_ref: "#1001",
    customer_name: "Ankan Das",
    customer_email: "ankan.das@bengalhorology.in",
    customer_phone: "+919830011223",
    channel: "fv3>>",
    total_amount: 38474.05,
    currency: "INR",
    payment_status: "Paid",
    fulfillment_status: "In progress",
    items_count: "1 item",
    delivery_status: "",
    delivery_method: "Standard (Prepaid)",
    tags: ["fastrr", "low", "SR_STANDARD", "Standard"],
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    tracking_number: "EXP-884920",
    items: [{ name: "HANBORO Astroworld Tourbillon Black DLC", sku: "astroworld-tourbillon-black-dlc", price: 38474.05, quantity: 1 }],
    shipping_address: { city: "Kolkata", state: "West Bengal", pin: "700019" },
  },
  {
    id: "ord-1002",
    order_ref: "#1002",
    customer_name: "Shiva Karnati",
    customer_email: "shiva.karnati@hyderabadtech.in",
    customer_phone: "+919849012345",
    channel: "fv3>>",
    total_amount: 33079.26,
    currency: "INR",
    payment_status: "Paid",
    fulfillment_status: "Fulfilled",
    items_count: "1 item",
    delivery_status: "Delivered",
    delivery_method: "Standard (Prepaid)",
    tags: ["fastrr", "low", "SR_STANDARD", "Standard"],
    created_at: new Date(Date.now() - 14 * 3600000).toISOString(),
    tracking_number: "DEL-449102",
    items: [{ name: "HANBORO Casino Roulette Diamond Emerald", sku: "blue-roulette", price: 33079.26, quantity: 1 }],
    shipping_address: { city: "Hyderabad", state: "Telangana", pin: "500081" },
  },
  {
    id: "ord-1003",
    order_ref: "#1003",
    customer_name: "VIREN-",
    customer_email: "viren.mehta@mumbaitrading.com",
    customer_phone: "+919821098765",
    channel: "fv3>>",
    total_amount: 0.00,
    currency: "INR",
    payment_status: "Voided",
    fulfillment_status: "Not required",
    items_count: "0 items",
    delivery_status: "",
    delivery_method: "Standard (COD)",
    tags: ["fastrr", "high", "rto_prediction_high", "SR_STANDARD", "Standard"],
    created_at: new Date(Date.now() - 28 * 3600000).toISOString(),
    tracking_number: "",
    items: [],
    shipping_address: { city: "Mumbai", state: "Maharashtra", pin: "400050" },
  },
  {
    id: "ord-1004",
    order_ref: "#1004",
    customer_name: "Goutham singaravelu",
    customer_email: "goutham.s@chennaiauto.com",
    customer_phone: "+919840012345",
    channel: "Online Store",
    total_amount: 47699.00,
    currency: "INR",
    payment_status: "Paid",
    fulfillment_status: "Fulfilled",
    items_count: "1 item",
    delivery_status: "Delivered",
    delivery_method: "Standard",
    tags: ["Standard", "VIP_ALLOCATION"],
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    tracking_number: "BLR-992100",
    items: [{ name: "HANBORO Celestial Dragon Tourbillon Rose Gold", sku: "celestial-dragon", price: 47699, quantity: 1 }],
    shipping_address: { city: "Chennai", state: "Tamil Nadu", pin: "600004" },
  },
  {
    id: "ord-1005",
    order_ref: "#1005",
    customer_name: "Nandan Shetty",
    customer_email: "nandan.shetty@bangalorecap.in",
    customer_phone: "+919880023456",
    channel: "Online Store",
    total_amount: 44999.00,
    currency: "INR",
    payment_status: "Paid",
    fulfillment_status: "Fulfilled",
    items_count: "1 item",
    delivery_status: "Delivered",
    delivery_method: "Standard",
    tags: ["Standard"],
    created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
    tracking_number: "DEL-778811",
    items: [{ name: "HANBORO Cyber Cogwheel Skeleton Twotone", sku: "cyber-cogwheel", price: 44999, quantity: 1 }],
    shipping_address: { city: "Bengaluru", state: "Karnataka", pin: "560001" },
  },
  {
    id: "ord-1006",
    order_ref: "#1006",
    customer_name: "Deepak Agarwal",
    customer_email: "deepak.agarwal@delhiwealth.com",
    customer_phone: "+919811122334",
    channel: "Online Store",
    total_amount: 27999.00,
    currency: "INR",
    payment_status: "Paid",
    fulfillment_status: "Fulfilled",
    items_count: "1 item",
    delivery_status: "Delivered",
    delivery_method: "Standard",
    tags: ["Standard"],
    created_at: new Date(Date.now() - 96 * 3600000).toISOString(),
    tracking_number: "EXP-112233",
    items: [{ name: "HANBORO Mechanical Tonneau Rose Gold", sku: "HNB-TONNEAU-RG", price: 27999, quantity: 1 }],
    shipping_address: { city: "Gurgaon", state: "Haryana", pin: "122002" },
  }
];

export function AdminDashboard({ onNavigateHome }) {
  const {
    user,
    logout,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
    resetProductsToDefault,
  } = useStore();

  // Active Tab navigation matching Shopify: 'home' | 'orders' | 'drafts' | 'abandoned' | 'products' | 'customers' | 'analytics' | 'discounts' | 'whatsapp' | 'settings'
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash || "";
    if (hash.includes("abandoned")) return "abandoned";
    if (hash.includes("drafts")) return "drafts";
    if (hash.includes("orders")) return "orders";
    if (hash.includes("products") || hash.includes("inventory")) return "products";
    if (hash.includes("customers")) return "customers";
    if (hash.includes("analytics")) return "analytics";
    if (hash.includes("discounts")) return "discounts";
    if (hash.includes("whatsapp")) return "whatsapp";
    if (hash.includes("settings")) return "settings";
    return "orders"; // Default to Orders view as in active Shopify management
  });

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

  // Orders State (Merged Live + Seed)
  const [orders, setOrders] = useState(SHOPIFY_ORDERS_SEED);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusTab, setOrderStatusTab] = useState("all"); // "all" | "unfulfilled" | "unpaid" | "open" | "closed"
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [inspectingOrder, setInspectingOrder] = useState(null);

  // Abandoned Checkouts State (Merged Live + Seed)
  const [abandonedCheckouts, setAbandonedCheckouts] = useState(SHOPIFY_ABANDONED_SEED);
  const [abandonedSearch, setAbandonedSearch] = useState("");
  const [selectedCheckouts, setSelectedCheckouts] = useState(new Set());
  const [inspectingCheckout, setInspectingCheckout] = useState(null);

  // Drafts State
  const [draftOrders, setDraftOrders] = useState([
    {
      id: "dft-101",
      draftNumber: "#D101",
      customerName: "Rohan Malhotra",
      customerEmail: "rohan.m@investor.in",
      customerPhone: "+919811099887",
      total: 36500,
      status: "Open",
      createdAt: "Yesterday at 6:40 pm",
      items: [{ name: "HANBORO Astroworld Tourbillon Black DLC", sku: "astroworld-tourbillon-black-dlc", price: 36500, qty: 1 }],
    },
    {
      id: "dft-102",
      draftNumber: "#D102",
      customerName: "Dr. Vikram Sethi",
      customerEmail: "vikram.sethi@apollo.org",
      customerPhone: "+919820011445",
      total: 82000,
      status: "Invoice Sent",
      createdAt: "Sep 2 at 11:15 am",
      items: [{ name: "HANBORO Celestial Dragon Tourbillon", sku: "celestial-dragon", price: 82000, qty: 1 }],
    }
  ]);
  const [showCreateDraftModal, setShowCreateDraftModal] = useState(false);
  const [draftFormData, setDraftFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    productId: "",
    customPrice: "",
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

  // Customers State
  const [customerSearch, setCustomerSearch] = useState("");

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
    const phone = checkout.customerPhone || "918882069334";
    const cleanPhone = phone.replace(/[^\d]/g, "");
    const primaryItem = checkout.items?.[0]?.name || "HANBORO Luxury Timepiece";
    const text = encodeURIComponent(
      `Hello ${checkout.customerName || "Valued Client"},\n\nWe noticed you were selecting the ${primaryItem} at HANBORO Watches.\n\nTo ensure your allocation is secured, our boutique concierge has activated an exclusive 10% privilege voucher (CODE: VIP10) for you:\n\nAcquisition Reference: ${checkout.checkoutNumber}\nTotal: ₹${Number(checkout.totalPrice).toLocaleString("en-IN")}\nWebsite: https://hanborowatches.in/#cart\n\nMay we assist you with personal delivery or verification?\n— HANBORO VIP Concierge (+91 88820 69334)`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
    showToast(`WhatsApp recovery nudge opened for ${checkout.customerName}`);
  };

  // WhatsApp customer order update
  const triggerWhatsAppOrderUpdate = (order) => {
    const phone = order.customer_phone || "918882069334";
    const cleanPhone = phone.replace(/[^\d]/g, "");
    const text = encodeURIComponent(
      `Hello ${order.customer_name},\n\nUpdate regarding your HANBORO timepiece order ${order.order_ref}:\nStatus: ${order.order_status || "Processing"}\nPayment: ${order.payment_status || "Paid"}\nTracking Airway Bill: ${order.tracking_number || "Being assigned"}\n\nOur concierge is at your service.\n— HANBORO Watches (+91 88820 69334)`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  };

  // Initial Data Sync from Supabase & Local DB
  const loadAllAdminData = async () => {
    setIsSyncing(true);
    setOrdersLoading(true);
    try {
      const [loadedOrders, loadedCarts, loadedDrafts, loadedDiscounts] = await Promise.all([
        ordersService.fetchOrders().catch(() => []),
        cartService.fetchAllLiveCarts().catch(() => []),
        draftOrdersService.fetchDraftOrders(SHOPIFY_DRAFT_ORDERS_SEED).catch(() => SHOPIFY_DRAFT_ORDERS_SEED),
        discountsService.fetchDiscounts(PROMO_CODES).catch(() => PROMO_CODES),
      ]);

      if (loadedOrders && loadedOrders.length > 0) {
        // Merge Supabase orders with seed orders
        const combined = [...loadedOrders];
        SHOPIFY_ORDERS_SEED.forEach((seed) => {
          if (!combined.some((o) => o.order_ref === seed.order_ref || o.id === seed.id)) {
            combined.push(seed);
          }
        });
        setOrders(combined);
      }

      if (loadedDrafts && loadedDrafts.length > 0) {
        setDraftOrders(loadedDrafts);
      }

      if (loadedDiscounts) {
        setCustomPromos(loadedDiscounts);
      }

      if (loadedCarts && loadedCarts.length > 0) {
        // Map live carts into abandoned checkout format if not already completed
        const mappedLiveCheckouts = loadedCarts.map((cart, idx) => ({
          id: `chk-live-${idx}-${Date.now()}`,
          checkoutNumber: `#${44800000000000 + Math.floor(Math.random() * 999999999)}`,
          createdAt: "Just now",
          customerName: cart.userEmail || cart.userId || "Active Guest Shopper",
          customerEmail: cart.userEmail?.includes("@") ? cart.userEmail : "shopper@hanborowatches.in",
          customerPhone: "+918882069334",
          emailStatus: "Not sent",
          region: "India",
          recoveryStatus: "Not recovered",
          totalPrice: cart.totalValue || 45000,
          items: cart.items || [],
        }));
        setAbandonedCheckouts([...mappedLiveCheckouts, ...SHOPIFY_ABANDONED_SEED]);
      }
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
    return orders.filter((o) => {
      // Tab filter
      if (orderStatusTab === "unfulfilled" && (o.fulfillment_status === "Fulfilled" || o.fulfillment_status === "Not required")) return false;
      if (orderStatusTab === "unpaid" && o.payment_status === "Paid") return false;
      if (orderStatusTab === "open" && o.order_status === "Delivered") return false;
      if (orderStatusTab === "closed" && o.order_status !== "Delivered") return false;

      // Search filter
      const q = orderSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        o.order_ref?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.customer_email?.toLowerCase().includes(q) ||
        o.customer_phone?.includes(q) ||
        o.payment_status?.toLowerCase().includes(q) ||
        o.fulfillment_status?.toLowerCase().includes(q) ||
        o.tracking_number?.toLowerCase().includes(q) ||
        (o.tags && o.tags.some((t) => t.toLowerCase().includes(q)))
      );
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

  // Customers Directory
  const customersList = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const key = o.customer_email?.toLowerCase() || o.customer_name || "client";
      if (!map[key]) {
        map[key] = {
          name: o.customer_name || "Valued Client",
          email: o.customer_email || "client@hanborowatches.in",
          phone: o.customer_phone || "+918882069334",
          city: o.shipping_address?.city || "India",
          totalSpent: 0,
          ordersCount: 0,
          lastOrder: o.created_at,
        };
      }
      map[key].totalSpent += Number(o.total_amount) || 0;
      map[key].ordersCount += 1;
    });

    // Also include unique abandoned clients
    abandonedCheckouts.forEach((c) => {
      const key = c.customerEmail?.toLowerCase() || c.customerName;
      if (!map[key]) {
        map[key] = {
          name: c.customerName || "Prospective Client",
          email: c.customerEmail || "client@hanborowatches.in",
          phone: c.customerPhone || "+918882069334",
          city: c.region || "India",
          totalSpent: 0,
          ordersCount: 0,
          lastOrder: c.createdAt,
        };
      }
    });

    return Object.values(map);
  }, [orders, abandonedCheckouts]);

  // Filtered Products Catalog
  const filteredProducts = useMemo(() => {
    let list = Array.isArray(products) && products.length > 0 ? products : PRODUCTS_DATA;
    if (productCategoryFilter !== "ALL") {
      list = list.filter((p) => p.collection === productCategoryFilter);
    }
    const q = productSearch.toLowerCase().trim();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.collection?.toLowerCase().includes(q) ||
        p.tag?.toLowerCase().includes(q)
    );
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

    if (type === "abandoned") {
      headers = ["Checkout", "Created", "Customer Name", "Email Status", "Region", "Recovery Status", "Total Price"];
      rows = filteredAbandoned.map((c) => [
        c.checkoutNumber,
        `"${c.createdAt}"`,
        `"${c.customerName}"`,
        c.emailStatus,
        c.region,
        c.recoveryStatus,
        c.totalPrice,
      ]);
    } else {
      headers = ["Order", "Date", "Customer", "Channel", "Total", "Payment Status", "Fulfillment Status", "Delivery Status", "Tracking"];
      rows = filteredOrders.map((o) => [
        o.order_ref,
        `"${new Date(o.created_at).toLocaleDateString()}"`,
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
    const newDraft = {
      id: `dft-${Date.now()}`,
      draftNumber: `#D${100 + draftOrders.length + 1}`,
      customerName: draftFormData.customerName,
      customerEmail: draftFormData.customerEmail || "client@hanborowatches.in",
      customerPhone: draftFormData.customerPhone || "+918882069334",
      total: price,
      status: "Open",
      createdAt: "Just now",
      items: [{ name: prod?.name || "HANBORO Timepiece", sku: prod?.sku || "HNB-CUSTOM", price, qty: 1 }],
      notes: draftFormData.notes,
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
      deliveryMethod: "Standard (Prepaid)",
      paymentMethod: "Prepaid UPI / Card",
      notes: ""
    });
    showToast(`Draft Order ${newDraft.draftNumber} created for ${newDraft.customerName}`);
  };

  // Convert Draft to Live Placed Order
  const handleConvertDraftToOrder = (draft) => {
    const newOrder = {
      id: `ord-${Date.now()}`,
      order_ref: `#${Math.floor(1000 + Math.random() * 9000)}`,
      customer_name: draft.customerName,
      customer_email: draft.customerEmail,
      customer_phone: draft.customerPhone,
      channel: "Draft Order",
      total_amount: draft.total,
      currency: "INR",
      payment_status: "Paid",
      order_status: "Processing",
      fulfillment_status: "In progress",
      items_count: `${draft.items.length} item`,
      delivery_status: "Processing",
      delivery_method: "Standard (Prepaid)",
      tags: ["Draft Order", "VIP Direct"],
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

  // Create Custom Promo
  const handleCreatePromo = (e) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;
    const clean = promoCodeInput.trim().toUpperCase();
    const config = {
      type: promoTypeInput,
      value: Number(promoDiscountInput) || 15,
      label: `${clean}: ${promoDiscountInput}${promoTypeInput === "percent" ? "%" : " INR"} OFF`,
    };
    const updated = {
      ...customPromos,
      [clean]: config,
    };
    setCustomPromos(updated);
    discountsService.saveDiscount(clean, config).catch(() => {});
    setPromoCodeInput("");
    showToast(`Promo voucher ${clean} activated`);
  };

  const handleStockDelta = (productId, delta) => {
    const prod = (products || PRODUCTS_DATA).find((p) => p.id === productId || p.sku === productId);
    const nextStock = Math.max(0, (prod?.stock || 0) + delta);
    updateProduct(productId, { stock: nextStock });
    inventoryService.updateStock(productId, nextStock);
    showToast(`Stock for ${prod?.name || productId} updated to ${nextStock}`);
  };

  return (
    <div className={`shopify-admin-shell shopify-admin-theme--${adminTheme}`}>
      {/* ── TOP SHOPIFY EXECUTIVE BAR ── */}
      <header className="sp-topbar">
        <div className="sp-topbar__left">
          <button
            type="button"
            className="sp-brand-badge"
            onClick={onNavigateHome}
            title="Return to public boutique"
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
              placeholder="Search portal (orders, SKUs, patrons)..."
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
          {/* Refresh / Sync telemetry */}
          <button
            type="button"
            className={`sp-icon-btn ${isSyncing ? "is-spinning" : ""}`}
            onClick={loadAllAdminData}
            title="Sync Live Telemetry"
          >
            <IconSync size={14} />
          </button>

          {/* Theme Switcher: Shopify Polaris Light vs Luxury Dark */}
          <button
            type="button"
            className="sp-theme-toggle-btn"
            onClick={toggleTheme}
            title={`Switch to ${adminTheme === "shopify-light" ? "Dark Mode" : "Polaris Light"}`}
          >
            {adminTheme === "shopify-light" ? "🌙 Dark View" : "☀️ Polaris Light"}
          </button>

          {/* Direct Storefront Link */}
          <button
            type="button"
            className="sp-storefront-link"
            onClick={onNavigateHome}
          >
            <span>Online Store</span>
            <IconExternalLink size={12} />
          </button>

          {/* User Account Capsule */}
          <div className="sp-user-capsule">
            <div className="sp-avatar">{(user?.fullName || "Chaitanya").charAt(0).toUpperCase()}</div>
            <span className="sp-user-label">{user?.fullName || "Chaitanya (Owner)"}</span>
            <button
              type="button"
              className="sp-logout-btn"
              onClick={logout}
              title="Sign out of Admin"
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

            {/* 5. Growth */}
            <button
              type="button"
              className={`sp-nav-link ${activeTab === "growth" ? "is-active" : ""}`}
              onClick={() => setActiveTab("growth")}
            >
              <span className="sp-nav-icon"><IconGrowth size={16} /></span>
              <span className="sp-nav-text">Growth</span>
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

            {/* 7. Content */}
            <button
              type="button"
              className={`sp-nav-link ${activeTab === "content" ? "is-active" : ""}`}
              onClick={() => setActiveTab("content")}
            >
              <span className="sp-nav-icon"><IconContent size={16} /></span>
              <span className="sp-nav-text">Content</span>
            </button>

            {/* 8. Markets */}
            <button
              type="button"
              className={`sp-nav-link ${activeTab === "markets" ? "is-active" : ""}`}
              onClick={() => setActiveTab("markets")}
            >
              <span className="sp-nav-icon"><IconMarkets size={16} /></span>
              <span className="sp-nav-text">Markets</span>
            </button>

            {/* 9. Analytics */}
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
            <button
              type="button"
              className="sp-nav-link"
              onClick={() => showToast("Agentic AI Sales Assistant is active on storefront")}
            >
              <span className="sp-nav-icon"><IconAgentic size={16} /></span>
              <span className="sp-nav-text">Agentic AI</span>
            </button>
            <button
              type="button"
              className="sp-nav-link"
              onClick={() => window.open("https://instagram.com", "_blank")}
            >
              <span className="sp-nav-icon"><IconSocial size={16} /></span>
              <span className="sp-nav-text">Facebook & Instagram</span>
            </button>
          </nav>

          {/* Apps Group */}
          <div className="sp-sidebar-divider" />
          <div className="sp-sidebar-heading">Apps</div>
          <nav className="sp-nav-group">
            <button
              type="button"
              className="sp-nav-link"
              onClick={() => showToast("Smind Custom Design Sections active")}
            >
              <span className="sp-nav-icon"><IconSmind size={16} /></span>
              <span className="sp-nav-text">Smind Sections</span>
            </button>
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

          {/* Sidekick / Concierge Assistant */}
          <div className="sp-sidebar-divider" />
          <div className="sp-sidebar-heading">Sidekick conversations</div>
          <nav className="sp-nav-group">
            <button
              type="button"
              className="sp-nav-link"
              onClick={() => setActiveTab("abandoned")}
            >
              <span className="sp-nav-icon"><IconWhatsApp size={15} /></span>
              <span className="sp-nav-text" style={{ fontSize: "12px", color: "var(--sp-text-subdued)" }}>
                Recovering abandoned checkouts...
              </span>
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
                      onClick={() => {
                        if (selectedCheckouts.size === 0) {
                          showToast("Select checkouts to archive");
                        } else {
                          setAbandonedCheckouts(abandonedCheckouts.filter((c) => !selectedCheckouts.has(c.id)));
                          setSelectedCheckouts(new Set());
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
                      <th className="sp-th--action">WhatsApp VIP Recovery</th>
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
                            <span className="sp-customer-sub">{item.customerEmail}</span>
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
                          No abandoned checkouts match your query.
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
                      <th>Fulfill by</th>
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
                          <td className="sp-td--subdued">—</td>
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
                          No orders found matching this filter.
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
                  <span className="sp-title-icon"><IconContent size={18} /></span>
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
                </div>
                <div className="sp-header-actions">
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
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`sp-tab-item ${productCategoryFilter === cat.id ? "is-active" : ""}`}
                      onClick={() => setProductCategoryFilter(cat.id)}
                    >
                      {cat.name}
                    </button>
                  ))}
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

              {/* Products Table */}
              <div className="sp-table-wrap">
                <table className="sp-table">
                  <thead>
                    <tr>
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
                      <th>Product</th>
                      <th>Status</th>
                      <th>Inventory</th>
                      <th>Collection</th>
                      <th className="sp-th--right">Price (INR)</th>
                      <th className="sp-th--right">Price (USD)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((p) => {
                      const id = p.id || p.sku;
                      const isSelected = selectedProducts.has(id);
                      return (
                        <tr key={id} className={isSelected ? "is-selected-row" : ""}>
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
                                src={p.image}
                                alt={p.name}
                                className="sp-product-thumb"
                                onError={(e) => { e.target.src = "/watch-astroworld-moon-rosegold-front-transparent.webp"; }}
                              />
                              <div>
                                <div className="sp-product-title">{p.name}</div>
                                <div className="sp-product-sku">SKU: {p.sku}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`sp-status-badge ${p.isActive !== false ? "sp-status--green" : "sp-status--amber"}`}>
                              {p.isActive !== false ? "Active" : "Draft"}
                            </span>
                          </td>
                          <td>
                            <div className="sp-stock-control">
                              <button
                                type="button"
                                className="sp-stock-btn"
                                onClick={() => handleStockDelta(id, -1)}
                              >
                                −
                              </button>
                              <span className="sp-stock-value">{p.stock || 12} in stock</span>
                              <button
                                type="button"
                                className="sp-stock-btn"
                                onClick={() => handleStockDelta(id, 1)}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="sp-td--subdued">{p.collectionName || p.collection}</td>
                          <td className="sp-td--price sp-td--right">{p.price}</td>
                          <td className="sp-td--price sp-td--right sp-td--subdued">{p.priceUsd || "$465"}</td>
                          <td>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                type="button"
                                className="sp-btn sp-btn--sm"
                                onClick={() => {
                                  setEditingWatch(p);
                                  setEditorModalOpen(true);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="sp-btn sp-btn--sm"
                                onClick={async () => {
                                  await duplicateProduct(id);
                                  showToast(`Cloned ${p.name}`);
                                }}
                                title="Duplicate variant"
                              >
                                Clone
                              </button>
                              <button
                                type="button"
                                className="sp-btn sp-btn--sm sp-btn--danger"
                                onClick={() => {
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
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 5: CUSTOMERS (VIP Horology Collectors Directory)
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "customers" && (
            <div className="sp-page-card">
              <div className="sp-card-header">
                <div className="sp-card-title-wrap">
                  <span className="sp-title-icon"><IconCustomers size={18} /></span>
                  <h1 className="sp-page-title">Customers</h1>
                </div>
                <div className="sp-header-actions">
                  <button
                    type="button"
                    className="sp-btn sp-btn--default"
                    onClick={() => handleExportCSV("customers")}
                  >
                    <IconExport size={13} />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              <div className="sp-table-controls">
                <div className="sp-table-search-row">
                  <div className="sp-search-field">
                    <span className="sp-field-icon"><IconSearch size={14} /></span>
                    <input
                      type="text"
                      className="sp-field-input"
                      placeholder="Search customers by name, email, phone, city..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="sp-table-wrap">
                <table className="sp-table">
                  <thead>
                    <tr>
                      <th>Customer name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Location</th>
                      <th className="sp-th--right">Orders</th>
                      <th className="sp-th--right">Total spent</th>
                      <th>WhatsApp VIP Chat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customersList
                      .filter((c) => {
                        const q = customerSearch.toLowerCase().trim();
                        if (!q) return true;
                        return c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.phone?.includes(q) || c.city?.toLowerCase().includes(q);
                      })
                      .map((c, idx) => (
                        <tr key={idx}>
                          <td className="sp-td--bold">{c.name}</td>
                          <td className="sp-td--subdued">{c.email}</td>
                          <td className="sp-td--subdued">{c.phone}</td>
                          <td>{c.city}</td>
                          <td className="sp-td--right">{c.ordersCount}</td>
                          <td className="sp-td--price sp-td--right">
                            ₹{c.totalSpent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="sp-btn sp-btn--whatsapp-nudge"
                              onClick={() => {
                                const clean = (c.phone || "918882069334").replace(/[^\d]/g, "");
                                const text = encodeURIComponent(
                                  `Hello ${c.name},\n\nThis is your dedicated VIP concierge at HANBORO Watches (+91 88820 69334). How may we assist your timepiece collection today?`
                                );
                                window.open(`https://wa.me/${clean}?text=${text}`, "_blank");
                              }}
                            >
                              <IconWhatsApp size={14} />
                              <span>Chat on WhatsApp</span>
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
              VIEW 6: HOME / EXECUTIVE OVERVIEW PULSE
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "home" && (
            <div className="sp-page-stack">
              {/* Top Banner Alert */}
              <div className="sp-banner-alert">
                <div className="sp-banner-text">
                  <span className="sp-live-pulse-dot" /> <strong>Shopify Command Active</strong> • Real-time telemetry synchronized with storefront and Supabase Cloud.
                </div>
                <div className="sp-banner-actions">
                  <button type="button" className="sp-btn sp-btn--sm" onClick={() => setActiveTab("abandoned")}>
                    Recover Abandoned ({abandonedCheckouts.length}) →
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
                  <div className="sp-kpi-sub">Luxury Tourbillon Average</div>
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
                    {abandonedCheckouts.slice(0, 5).map((item) => (
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
                    ))}
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
                            <div className="sp-quick-sub">SKU: {p.sku}</div>
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
                      placeholder="e.g. VIP2026, SUMMER15"
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
                    <label>Discount Value</label>
                    <input
                      type="number"
                      value={promoDiscountInput}
                      onChange={(e) => setPromoDiscountInput(e.target.value)}
                      required
                    />
                  </div>

                  <div className="sp-form-group sp-form-group--btn">
                    <button type="submit" className="sp-btn sp-btn--primary">
                      Activate Code
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
                      <th>Type & Benefit</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries({ ...PROMO_CODES, ...customPromos }).map(([code, def]) => (
                      <tr key={code}>
                        <td className="sp-td--bold">{code}</td>
                        <td>{def.label || `${def.value}${def.type === "percent" ? "%" : " INR"} Discount`}</td>
                        <td>
                          <span className="sp-status-badge sp-status--green">Active</span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="sp-btn sp-btn--sm"
                            onClick={() => {
                              navigator.clipboard.writeText(code);
                              showToast(`Copied ${code} to clipboard`);
                            }}
                          >
                            Copy Link
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
              VIEW 8: WHATSAPP CONCIERGE APP (+91 88820 69334)
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "whatsapp" && (
            <div className="sp-page-card">
              <div className="sp-card-header">
                <div className="sp-card-title-wrap">
                  <span className="sp-title-icon" style={{ color: "#25d366" }}><IconWhatsApp size={18} /></span>
                  <h1 className="sp-page-title">WhatsApp Concierge & VIP Recovery</h1>
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
                      placeholder="Custom message or concierge invitation..."
                      defaultValue="Hello, this is your VIP concierge at HANBORO Watches (+91 88820 69334). How may we assist your timepiece acquisition?"
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
                    <label>WhatsApp VIP Concierge Line</label>
                    <input type="text" defaultValue="+91 88820 69334" disabled />
                  </div>
                  <div className="sp-settings-field">
                    <label>Support Email</label>
                    <input type="text" defaultValue="connect@hanborowatches.in" disabled />
                  </div>
                  <div className="sp-settings-field">
                    <label>Corporate Entity</label>
                    <input type="text" defaultValue="Rise and Be Original Private Limited" disabled />
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
                    <input type="text" defaultValue="Prepaid UPI / Cards / Net Banking + Concierge COD" disabled />
                  </div>
                  <div className="sp-settings-field">
                    <label>Boutique Studio Location</label>
                    <textarea defaultValue="M5 M-Block, DLF Phase-2, Sector 25, Gurgaon, Haryana 122002, India" rows="2" disabled />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 10: GROWTH & MARKETING OPERATIONS
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "growth" && (
            <div className="sp-page-stack">
              <div className="sp-page-card">
                <div className="sp-card-header">
                  <div className="sp-card-title-wrap">
                    <span className="sp-title-icon"><IconGrowth size={18} /></span>
                    <div>
                      <h1 className="sp-page-title">Growth & Marketing Operations</h1>
                      <div className="sp-page-sub">Acquisition channels, paid campaigns, conversion rate optimization, and VIP referrals.</div>
                    </div>
                  </div>
                  <div className="sp-header-actions">
                    <button
                      type="button"
                      className="sp-btn sp-btn--default"
                      onClick={() => showToast("Meta Pixel & Google Analytics 4 telemetry re-synchronized")}
                    >
                      <IconSync size={13} />
                      <span>Sync Telemetry</span>
                    </button>
                    <button
                      type="button"
                      className="sp-btn sp-btn--primary"
                      onClick={() => showToast("New acquisition campaign creator initialized")}
                    >
                      + Launch Campaign
                    </button>
                  </div>
                </div>

                {/* Growth KPIs */}
                <div style={{ padding: "20px 20px 0 20px" }}>
                  <div className="sp-kpi-row">
                    <div className="sp-kpi-card">
                      <div className="sp-kpi-label">CONVERSION RATE</div>
                      <div className="sp-kpi-val">3.42%</div>
                      <div className="sp-kpi-sub" style={{ color: "#16a34a" }}>↑ +1.2% vs Horology benchmark (1.8%)</div>
                    </div>
                    <div className="sp-kpi-card">
                      <div className="sp-kpi-label">BLENDED CAC</div>
                      <div className="sp-kpi-val">₹4,250</div>
                      <div className="sp-kpi-sub">Cost per confirmed collector</div>
                    </div>
                    <div className="sp-kpi-card">
                      <div className="sp-kpi-label">BLENDED ROAS</div>
                      <div className="sp-kpi-val">8.4x</div>
                      <div className="sp-kpi-sub" style={{ color: "#16a34a" }}>High-margin luxury return</div>
                    </div>
                    <div className="sp-kpi-card">
                      <div className="sp-kpi-label">WAITLIST INTENT</div>
                      <div className="sp-kpi-val">842</div>
                      <div className="sp-kpi-sub">Registered for 2026 Drops</div>
                    </div>
                  </div>
                </div>

                {/* Active Campaigns Table */}
                <div style={{ padding: "16px 20px 24px 20px" }}>
                  <h3 style={{ margin: "0 0 14px 0", fontSize: "15px", fontWeight: 700, color: "var(--sp-text)" }}>
                    Active Allocation Campaigns
                  </h3>
                  <div className="sp-table-wrap">
                    <table className="sp-table">
                      <thead>
                        <tr>
                          <th className="sp-th">Campaign & Initiative</th>
                          <th className="sp-th">Channel</th>
                          <th className="sp-th">Budget / Spent</th>
                          <th className="sp-th">Conversions</th>
                          <th className="sp-th">ROAS</th>
                          <th className="sp-th">Status</th>
                          <th className="sp-th" style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: "Diwali Haute Horlogerie Private Allocation", channel: "Meta & Instagram", budget: "₹2,50,000", spent: "₹1,84,000", conv: "42 Orders", roas: "9.2x", status: "Active" },
                          { name: "Astroworld Tourbillon VIP Concierge Drop", channel: "WhatsApp VIP Line", budget: "₹45,000", spent: "₹45,000", conv: "28 Orders", roas: "14.6x", status: "Active" },
                          { name: "Casino Roulette Diamond Viral Micro-Reels", channel: "YouTube & Reels", budget: "₹80,000", spent: "₹72,000", conv: "36 Orders", roas: "7.8x", status: "Active" },
                          { name: "Delhi-NCR & Mumbai Private Viewing Invitations", channel: "Direct Outreach", budget: "₹1,20,000", spent: "₹95,000", conv: "19 Orders", roas: "8.1x", status: "Active" },
                        ].map((c, idx) => (
                          <tr key={idx} className="sp-tr">
                            <td className="sp-td" style={{ fontWeight: 600, color: "var(--sp-text)" }}>{c.name}</td>
                            <td className="sp-td">{c.channel}</td>
                            <td className="sp-td">{c.budget} / {c.spent}</td>
                            <td className="sp-td" style={{ fontWeight: 600, color: "#16a34a" }}>{c.conv}</td>
                            <td className="sp-td" style={{ fontWeight: 700 }}>{c.roas}</td>
                            <td className="sp-td">
                              <span className="sp-badge-pill sp-badge-pill--fulfilled">{c.status}</span>
                            </td>
                            <td className="sp-td" style={{ textAlign: "right" }}>
                              <button
                                type="button"
                                className="sp-btn sp-btn--xs"
                                onClick={() => showToast(`Optimizing budget for "${c.name}"`)}
                              >
                                Optimize
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2-col Traffic Discovery & Funnel Breakdown */}
                <div style={{ padding: "0 20px 24px 20px" }}>
                  <div className="sp-grid-2col">
                    <div className="sp-card" style={{ padding: "18px" }}>
                      <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 700 }}>Collector Traffic Discovery</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {[
                          { label: "Direct & Private VIP Bookmarks", pct: "38%", color: "#fa2d1d" },
                          { label: "Instagram & Social Horology Showcases", pct: "34%", color: "#3b82f6" },
                          { label: "Organic Search (Google 'Hanboro watches')", pct: "20%", color: "#10b981" },
                          { label: "WhatsApp Concierge & Client Invites", pct: "8%", color: "#25d366" },
                        ].map((ch, i) => (
                          <div key={i}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", marginBottom: "4px" }}>
                              <span>{ch.label}</span>
                              <strong>{ch.pct}</strong>
                            </div>
                            <div style={{ width: "100%", height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ width: ch.pct, height: "100%", background: ch.color, borderRadius: "3px" }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="sp-card" style={{ padding: "18px" }}>
                      <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 700 }}>Conversion Funnel Efficiency</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {[
                          { step: "1. Storefront Visitors", count: "64,280", drop: "100%" },
                          { step: "2. Timepiece Detail Views", count: "38,940", drop: "60.5%" },
                          { step: "3. Added to Private Bag", count: "6,820", drop: "10.6%" },
                          { step: "4. Checkout Initiated", count: `${orders.length + abandonedCheckouts.length}`, drop: "5.4%" },
                          { step: "5. Confirmed Acquisitions", count: `${orders.length}`, drop: "3.42%" },
                        ].map((fn, i) => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                            <span>{fn.step}</span>
                            <div>
                              <strong style={{ marginRight: "8px" }}>{fn.count}</strong>
                              <span style={{ fontSize: "11px", color: "var(--sp-text-subdued)" }}>({fn.drop})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 11: CONTENT & EDITORIAL DOSSIERS
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "content" && (
            <div className="sp-page-stack">
              <div className="sp-page-card">
                <div className="sp-card-header">
                  <div className="sp-card-title-wrap">
                    <span className="sp-title-icon"><IconContent size={18} /></span>
                    <div>
                      <h1 className="sp-page-title">Content & Editorial Dossiers</h1>
                      <div className="sp-page-sub">Manage boutique storytelling, architectural exhibition sections, legal policies, and media assets.</div>
                    </div>
                  </div>
                  <div className="sp-header-actions">
                    <button
                      type="button"
                      className="sp-btn sp-btn--default"
                      onClick={onNavigateHome}
                    >
                      <span>Boutique Preview</span>
                      <IconExternalLink size={12} />
                    </button>
                    <button
                      type="button"
                      className="sp-btn sp-btn--primary"
                      onClick={() => showToast("Editorial story editor opened")}
                    >
                      <IconPlus size={13} />
                      <span>New Story</span>
                    </button>
                  </div>
                </div>

                {/* Content Sections Grid */}
                <div style={{ padding: "20px" }}>
                  <h3 style={{ margin: "0 0 14px 0", fontSize: "15px", fontWeight: 700, color: "var(--sp-text)" }}>
                    Storefront Display Sections
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
                    {[
                      { title: "Hero Cinematic Stage", desc: "Fast-moving analogue clock entry, 3D particles & video stage", status: "Published", file: "HeroParticleStage.jsx" },
                      { title: "Architectural Exhibition", desc: "Sapphire panoramic vaults & multi-axis tourbillon showcase", status: "Published", file: "ArchitecturalExhibitionSection.jsx" },
                      { title: "Subtle Mastery & Legacy", desc: "In-house mechanical movement caliber engineering narrative", status: "Published", file: "SubtleMasterySection.jsx" },
                      { title: "Orbital Collections Engine", desc: "4 Core collections: Tourbillon, Casino, Skeleton & Tonneau", status: "Published", file: "CollectionsOrbitalSection.jsx" },
                      { title: "Horological Media Vault", desc: "Cinematic film shorts, YouTube series & micro-reels showcase", status: "Published", file: "MediaSection.jsx" },
                      { title: "Collector Testimonials", desc: "Verified collector reviews and bespoke unboxing experiences", status: "Published", file: "TestimonialsSection.jsx" },
                    ].map((sec, i) => (
                      <div key={i} className="sp-card" style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--sp-text)" }}>{sec.title}</h4>
                          <span className="sp-badge-pill sp-badge-pill--fulfilled">{sec.status}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: "12.5px", color: "var(--sp-text-subdued)", lineHeight: 1.45 }}>{sec.desc}</p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
                          <span style={{ fontSize: "11px", fontFamily: "ui-monospace, monospace", color: "var(--sp-text-subdued)" }}>{sec.file}</span>
                          <button
                            type="button"
                            className="sp-btn sp-btn--xs"
                            onClick={() => {
                              onNavigateHome();
                              showToast(`Navigated to ${sec.title}`);
                            }}
                          >
                            Inspect View ↗
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Institutional Policies Table */}
                <div style={{ padding: "0 20px 24px 20px" }}>
                  <h3 style={{ margin: "0 0 14px 0", fontSize: "15px", fontWeight: 700, color: "var(--sp-text)" }}>
                    Legal & Collector Policy Documents
                  </h3>
                  <div className="sp-table-wrap">
                    <table className="sp-table">
                      <thead>
                        <tr>
                          <th className="sp-th">Policy Document</th>
                          <th className="sp-th">Jurisdiction & Standard</th>
                          <th className="sp-th">Last Revision</th>
                          <th className="sp-th">Compliance</th>
                          <th className="sp-th" style={{ textAlign: "right" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { title: "Terms of Service", reg: "India Consumer Protection & E-Commerce 2020", rev: "September 2026", comp: "Active (Compliant)", hash: "#terms" },
                          { title: "Privacy Policy", reg: "India DPDP Act 2023 & Global GDPR", rev: "September 2026", comp: "Active (Compliant)", hash: "#privacy" },
                          { title: "White-Glove Shipping & Armored Transit", reg: "Insured Transit Standard", rev: "September 2026", comp: "Active (Compliant)", hash: "#shipping" },
                          { title: "7-Day Authenticity & Refund Guarantee", reg: "Collector Assurance Protocol", rev: "September 2026", comp: "Active (Compliant)", hash: "#refund" },
                        ].map((pol, i) => (
                          <tr key={i} className="sp-tr">
                            <td className="sp-td" style={{ fontWeight: 600, color: "var(--sp-text)" }}>{pol.title}</td>
                            <td className="sp-td">{pol.reg}</td>
                            <td className="sp-td">{pol.rev}</td>
                            <td className="sp-td">
                              <span className="sp-badge-pill sp-badge-pill--fulfilled">{pol.comp}</span>
                            </td>
                            <td className="sp-td" style={{ textAlign: "right" }}>
                              <button
                                type="button"
                                className="sp-btn sp-btn--xs"
                                onClick={() => {
                                  window.location.hash = pol.hash;
                                  showToast(`Opened ${pol.title}`);
                                }}
                              >
                                View Document ↗
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              VIEW 12: GLOBAL MARKETS & MULTI-CURRENCY ALLOCATIONS
              ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "markets" && (
            <div className="sp-page-stack">
              <div className="sp-page-card">
                <div className="sp-card-header">
                  <div className="sp-card-title-wrap">
                    <span className="sp-title-icon"><IconMarkets size={18} /></span>
                    <div>
                      <h1 className="sp-page-title">Markets & International Allocations</h1>
                      <div className="sp-page-sub">Configure regional pricing, currencies, tax jurisdictions, and white-glove international dispatch.</div>
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
                      <h1 className="sp-page-title">Analytics & Horological Intelligence</h1>
                      <div className="sp-page-sub">Comprehensive financial telemetry, average order value, conversion trends, and top timepiece performances.</div>
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
                          { method: "White-Glove Concierge Cash on Delivery", share: "6%", count: `${Math.round(orders.length * 0.06)} orders` },
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

        </main>
      </div>

      {/* ── MODAL 1: INSPECT ORDER MODAL ── */}
      {inspectingOrder && (
        <div className="sp-modal-overlay" role="dialog" aria-modal="true">
          <div className="sp-modal-backdrop" onClick={() => setInspectingOrder(null)} />
          <div className="sp-modal-box">
            <div className="sp-modal-header">
              <h2>Order Details: {inspectingOrder.order_ref}</h2>
              <button type="button" className="sp-close-btn" onClick={() => setInspectingOrder(null)}>✕</button>
            </div>
            <div className="sp-modal-body">
              <div className="sp-modal-grid">
                <div>
                  <h4>Customer Information</h4>
                  <p><strong>Name:</strong> {inspectingOrder.customer_name}</p>
                  <p><strong>Email:</strong> {inspectingOrder.customer_email}</p>
                  <p><strong>Phone:</strong> {inspectingOrder.customer_phone || "—"}</p>
                  <p><strong>Address:</strong> {inspectingOrder.shipping_address?.city || "India"}</p>
                </div>
                <div>
                  <h4>Order Summary</h4>
                  <p><strong>Total:</strong> ₹{Number(inspectingOrder.total_amount).toLocaleString("en-IN")}</p>
                  <p><strong>Payment Status:</strong> {inspectingOrder.payment_status}</p>
                  <p><strong>Fulfillment Status:</strong> {inspectingOrder.fulfillment_status || "In progress"}</p>
                  <p><strong>Tracking Number:</strong> {inspectingOrder.tracking_number || "None"}</p>
                </div>
              </div>

              <h4 style={{ marginTop: "16px" }}>Line Items</h4>
              <div className="sp-order-items-list">
                {(inspectingOrder.items || []).map((it, idx) => (
                  <div key={idx} className="sp-order-item-row">
                    <span>{it.name || "Timepiece"} (Qty: {it.quantity || it.qty || 1})</span>
                    <span>₹{Number(it.price || 0).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>

              <div className="sp-modal-actions-row">
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
                  Send WhatsApp Update (+91 88820 69334)
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
              <p><strong>Client:</strong> {inspectingCheckout.customerName}</p>
              <p><strong>Email:</strong> {inspectingCheckout.customerEmail}</p>
              <p><strong>Phone:</strong> {inspectingCheckout.customerPhone}</p>
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
                  💬 1-Click WhatsApp Recovery Nudge (+91 88820 69334)
                </button>
                <button
                  type="button"
                  className="sp-btn sp-btn--default"
                  onClick={() => {
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
                      <option key={p.id} value={p.id}>{p.name} ({p.price})</option>
                    ))}
                  </select>
                </div>

                <div className="sp-form-group">
                  <label>Price / Allocation Amount (INR)</label>
                  <input
                    type="number"
                    value={draftFormData.customPrice}
                    onChange={(e) => setDraftFormData({ ...draftFormData, customPrice: e.target.value })}
                    required
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
            if (prevId) {
              await updateProduct(prevId, watchData);
              showToast(`Updated ${watchData.name}`);
            } else {
              await addProduct(watchData);
              showToast(`Created ${watchData.name}`);
            }
            setEditorModalOpen(false);
            setEditingWatch(null);
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
    </div>
  );
}

export default AdminDashboard;
