/**
 * HANBORO — Shiprocket Order Tracking Proxy
 * Vercel Serverless Function: /api/track-order
 *
 * Proxies order tracking requests to Shiprocket's API.
 * The API key and secret are stored as Vercel environment variables
 * and NEVER exposed to the browser.
 *
 * Usage: GET /api/track-order?orderId=ORDER123
 *    or: GET /api/track-order?awb=AWB123456
 */

const SHIPROCKET_API_BASE = "https://apiv2.shiprocket.in/v1/external";

let _cachedToken = null;
let _tokenExpiry = 0;

async function getShiprocketToken(apiKey, secretKey) {
  // Return cached token if still valid (tokens last 24h, refresh 1h early)
  if (_cachedToken && Date.now() < _tokenExpiry) {
    return _cachedToken;
  }

  const res = await fetch(`${SHIPROCKET_API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: apiKey, password: secretKey }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const msg = errorBody.message || (errorBody.errors ? JSON.stringify(errorBody.errors) : `HTTP ${res.status}`);
    throw new Error(`Shiprocket auth failed (${res.status}): ${msg}`);
  }

  const data = await res.json();
  if (!data.token) {
    throw new Error("No token returned from Shiprocket");
  }

  _cachedToken = data.token;
  // Cache for 23 hours
  _tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
  return _cachedToken;
}

export default async function handler(req, res) {
  // CORS headers
  const origin = req?.headers?.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { orderId, awb } = req.query;

  if (!orderId && !awb) {
    return res.status(400).json({
      error: "Provide either orderId or awb (airway bill number)",
    });
  }

  const apiKey = process.env.SHIPROCKET_EMAIL;
  const secretKey = process.env.SHIPROCKET_PASSWORD;

  if (!apiKey || !secretKey) {
    return res.status(503).json({
      error: "Order tracking temporarily unavailable",
    });
  }

  try {
    const token = await getShiprocketToken(apiKey, secretKey);

    let trackingData = null;

    if (awb) {
      // Track by AWB (airway bill number) — most reliable
      const trackRes = await fetch(
        `${SHIPROCKET_API_BASE}/courier/track/awb/${encodeURIComponent(awb)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!trackRes.ok) {
        throw new Error(`Shiprocket tracking API error: ${trackRes.status}`);
      }
      trackingData = await trackRes.json();
    } else {
      // Track by Shiprocket Order ID
      const trackRes = await fetch(
        `${SHIPROCKET_API_BASE}/orders/show/${encodeURIComponent(orderId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!trackRes.ok) {
        throw new Error(`Shiprocket order API error: ${trackRes.status}`);
      }
      const orderData = await trackRes.json();

      // Also fetch shipment tracking if shipment_id exists
      const shipmentId = orderData.data?.shipments?.[0]?.id;
      if (shipmentId) {
        const shipRes = await fetch(
          `${SHIPROCKET_API_BASE}/shipments/track/shipment/${shipmentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (shipRes.ok) {
          const shipData = await shipRes.json();
          trackingData = { order: orderData.data, tracking: shipData };
        } else {
          trackingData = { order: orderData.data };
        }
      } else {
        trackingData = { order: orderData.data };
      }
    }

    // Return sanitized tracking data (no internal credentials or PII beyond what's needed)
    return res.status(200).json({
      success: true,
      data: sanitizeTrackingData(trackingData),
    });
  } catch (err) {
    console.error("Shiprocket tracking note:", err.message);
    return res.status(502).json({
      error: "Shiprocket could not verify this shipment right now. Please check the number and try again.",
    });
  }
}

/**
 * Sanitize tracking response — only return fields needed for the customer UI
 */
function sanitizeTrackingData(raw) {
  if (!raw) return null;

  // AWB tracking response format
  if (raw.tracking_data) {
    const t = raw.tracking_data;
    return {
      type: "awb",
      orderId: t.order_id,
      awb: t.shipment_track?.[0]?.awb_code,
      status: t.shipment_track?.[0]?.current_status,
      courier: t.shipment_track?.[0]?.courier_name,
      estimatedDelivery: t.shipment_track?.[0]?.estimated_delivery_date,
      activities: (t.shipment_track_activities || []).map((a) => ({
        date: a.date,
        activity: a.activity,
        location: a.location,
        status: a["sr-status-label"] || a.status,
      })),
    };
  }

  // Order + shipment tracking format
  if (raw.order) {
    const o = raw.order;
    const track = raw.tracking;
    return {
      type: "order",
      orderId: o.id || o.channel_order_id,
      channelOrderId: o.channel_order_id,
      status: o.status,
      awb: o.shipments?.[0]?.awb,
      courier: o.shipments?.[0]?.courier,
      estimatedDelivery: o.shipments?.[0]?.etd,
      activities: (track?.tracking_data?.shipment_track_activities || []).map(
        (a) => ({
          date: a.date,
          activity: a.activity,
          location: a.location,
          status: a["sr-status-label"] || a.status,
        })
      ),
    };
  }

  return raw;
}
