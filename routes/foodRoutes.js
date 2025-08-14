// backend/routes/foodRoutes.js
import express from "express";
import "dotenv/config";

const router = express.Router();

// Environment variables
const getKey = () => process.env.LOCATIONIQ_KEY;
const USER_AGENT = process.env.USER_AGENT || "VacationRentalApp/1.0";

// API fetch helper
async function fetchJSON(url) {
  const resp = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  const raw = await resp.text();
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      status: resp.status,
      error: "Invalid JSON from API",
      raw: raw?.slice(0, 300) || "Non-JSON response",
    };
  }

  if (!resp.ok) {
    return {
      ok: false,
      status: resp.status,
      error: json?.error || json?.message || `HTTP ${resp.status}`,
      raw: json,
    };
  }

  return { ok: true, status: resp.status, data: json };
}

// Map & normalize types
function normalizePlaces(data) {
  if (!Array.isArray(data)) return [];
  const typeMap = {
    fast_food: "Street Food",
    restaurant: "Restaurant",
    cafe: "Cafe",
    bar: "Bar",
    pub: "Pub",
    nightclub: "Nightclub",
    local_food: "Local Food",
    food: "Food",
  };
  return data.map((item) => {
    let rawType =
      item?.category?.split?.(",")[0] || item?.type || "Food";
    rawType = rawType.toLowerCase();
    const finalType =
      typeMap[rawType] ||
      rawType.charAt(0).toUpperCase() + rawType.slice(1);
    return {
      title: item?.name || item?.display_name || "Unnamed place",
      lat: item?.lat,
      lon: item?.lon,
      type: finalType,
      description: item?.display_name || "",
    };
  });
}

// Tag mapping by category
const CATEGORY_TAGS = {
  All: [
    "restaurant",
    "food",
    "cafe",
    "bar",
    "pub",
    "nightclub",
    "local_food",
    "fast_food",
  ],
  "Street Food": ["fast_food", "local_food"],
  Restaurant: ["restaurant"],
  Cafe: ["cafe"],
  Food: ["food"],
  Bar: ["bar", "pub", "nightclub"],
  "Local Food": ["local_food"],
};

// Nearby route
router.get("/nearby", async (req, res) => {
  const { lat, lon, category = "All" } = req.query;
  if (!lat || !lon)
    return res.status(400).json({ error: "Missing coords" });

  const key = getKey();
  if (!key) {
    return res.status(500).json({
      error: "LOCATIONIQ_KEY is missing in server configuration",
    });
  }

  const tags = CATEGORY_TAGS[category] || CATEGORY_TAGS.All;

  const url = `https://us1.locationiq.com/v1/nearby.php?key=${key}&lat=${lat}&lon=${lon}&tag=${tags.join(
    ","
  )}&radius=10000&format=json`;

  try {
    const result = await fetchJSON(url);

    if (!result.ok) {
      return res.status(result.status || 500).json({
        error: "LocationIQ error",
        details: result.error,
        raw: result.raw,
      });
    }

    return res.json({ places: normalizePlaces(result.data) });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "API error", details: err.message });
  }
});

// Search route
router.get("/search", async (req, res) => {
  const { q, category = "All" } = req.query;
  if (!q) return res.status(400).json({ error: "Missing q param" });

  const key = getKey();
  if (!key) {
    return res.status(500).json({
      error: "LOCATIONIQ_KEY is missing in server configuration",
    });
  }

  const geocodeUrl = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${encodeURIComponent(
    q
  )}&format=json&limit=1`;

  try {
    const geo = await fetchJSON(geocodeUrl);
    if (!geo.ok) {
      return res.status(geo.status || 500).json({
        error: "Geocode error",
        details: geo.error,
        raw: geo.raw,
      });
    }

    const first = Array.isArray(geo.data) && geo.data[0];
    if (!first?.lat || !first?.lon) {
      return res
        .status(404)
        .json({ error: "Location not found", q });
    }

    const tags = CATEGORY_TAGS[category] || CATEGORY_TAGS.All;

    const nearbyUrl = `https://us1.locationiq.com/v1/nearby.php?key=${key}&lat=${first.lat}&lon=${first.lon}&tag=${tags.join(
      ","
    )}&radius=10000&format=json`;

    const nearby = await fetchJSON(nearbyUrl);
    if (!nearby.ok) {
      return res.status(nearby.status || 500).json({
        error: "LocationIQ error",
        details: nearby.error,
        raw: nearby.raw,
      });
    }

    return res.json({ places: normalizePlaces(nearby.data) });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "API error", details: err.message });
  }
});

export default router;
