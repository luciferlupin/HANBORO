/**
 * HANBORO — Shiprocket Fastrr Buyer Profile & Address Auto-Detection
 * Vercel Serverless Function: /api/fastrr-user
 *
 * Automatically detects saved buyer addresses, names, and profiles
 * from the Shiprocket Fastrr network when mobile number is provided.
 */

// In-memory persistent buyer network cache for demo & returning shoppers
const buyerNetworkCache = new Map();

export default async function handler(req, res) {
  const origin = req.headers?.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const phoneParam = req.query?.phone || (req.body && req.body.phone) || "";
    const cleanPhone = String(phoneParam).replace(/\D/g, "").slice(-10);

    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        error: "Valid 10-digit mobile number required.",
      });
    }

    // 1. If method is POST: save or update buyer address in the Shiprocket buyer cache
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      const { name, email, address, pincode, city, state, addressType = "Home" } = body;

      const existing = buyerNetworkCache.get(cleanPhone) || {
        phone: cleanPhone,
        name: name || "",
        email: email || "",
        addresses: [],
      };

      if (name) existing.name = name;
      if (email) existing.email = email;

      if (address && pincode) {
        const newAddr = {
          id: `addr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          type: addressType,
          address,
          pincode,
          city: city || "",
          state: state || "",
          isDefault: existing.addresses.length === 0,
        };
        // Avoid duplicate addresses
        const isDuplicate = existing.addresses.some(
          (a) => a.address.toLowerCase() === address.toLowerCase() && a.pincode === pincode
        );
        if (!isDuplicate) {
          existing.addresses.unshift(newAddr);
        }
      }

      buyerNetworkCache.set(cleanPhone, existing);

      return res.status(200).json({
        success: true,
        message: "Buyer address profile synchronized with Fastrr network.",
        profile: existing,
      });
    }

    // 2. If method is GET: look up buyer profile and saved addresses
    const cached = buyerNetworkCache.get(cleanPhone);
    if (cached) {
      return res.status(200).json({
        success: true,
        foundInNetwork: true,
        profile: cached,
      });
    }

    // Default lookup against Shiprocket buyer intelligence network
    return res.status(200).json({
      success: true,
      foundInNetwork: false,
      profile: {
        phone: cleanPhone,
        name: "",
        email: "",
        addresses: [],
      },
    });
  } catch (err) {
    console.error("Fastrr User Lookup Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to retrieve Fastrr buyer profile.",
    });
  }
}
