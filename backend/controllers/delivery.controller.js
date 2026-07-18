const axios = require("axios");

const STORE_ORIGIN = process.env.STORE_ORIGIN_ADDRESS || "Murambi Cell, Gatenga Sector, Kicukiro District, Kigali, Rwanda";
const MIN_FEE = 1000;
const MAX_FEE = 10000;

// Core fee formula, reused by both the HTTP endpoint and order creation.
function feeFromDistanceKm(distanceKm) {
  const raw = Math.ceil(distanceKm / 10) * 1000;
  return Math.max(MIN_FEE, Math.min(raw, MAX_FEE));
}

// Calls Google Maps Distance Matrix API. Requires GOOGLE_MAPS_API_KEY.
// Falls back to a flat mid-range fee (with a warning) if the key is missing
// or the API call fails, so checkout never hard-blocks on this integration.
async function getDistanceKm(destinationAddress) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_MAPS_API_KEY not set - using fallback distance estimate");
    return null;
  }
  const url = "https://maps.googleapis.com/maps/api/distancematrix/json";
  const { data } = await axios.get(url, {
    params: { origins: STORE_ORIGIN, destinations: destinationAddress, mode: "driving", key: apiKey },
  });
  const element = data?.rows?.[0]?.elements?.[0];
  if (!element || element.status !== "OK") return null;
  return element.distance.value / 1000; // meters -> km
}

// POST /api/delivery/quote  { address }  (public — used live at checkout)
async function quote(req, res) {
  const { address } = req.body;
  if (!address) return res.status(400).json({ error: "address is required" });

  const distanceKm = await getDistanceKm(address);
  const usedFallback = distanceKm === null;
  const fee = feeFromDistanceKm(distanceKm ?? 5); // fallback: assume 5km if Maps unavailable

  res.json({
    distanceKm: distanceKm !== null ? Number(distanceKm.toFixed(1)) : null,
    fee,
    fallback: usedFallback,
    note: usedFallback ? "Google Maps API not configured/unavailable - using estimated fee" : undefined,
  });
}

module.exports = { quote, feeFromDistanceKm, getDistanceKm };
