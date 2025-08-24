import express from "express";
import fetch from "node-fetch";
const router = express.Router();

router.get("/geocode", async (req, res) => {
  try {
    let { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({ error: "Location query required" });
    }

    // ⚡ Query ko over-clean mat karo
    const cleanQuery = q.trim();

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}`;
    console.log("🌍 Geocode request URL:", url);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "VacationRentalApp/1.0 (myapp@gmail.com)", // ✅ valid email daalo
      },
    });

    if (!response.ok) {
      console.error("🌍 Nominatim API error:", response.status, response.statusText);
      return res.status(response.status).json({ error: "Geocode API request failed" });
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ error: "No coordinates found for this location" });
    }

    console.log("📦 Geocode API response:", data[0]);
    res.json(data);
  } catch (err) {
    console.error("❌ Geocoding server error:", err.message);
    res.status(500).json({ error: "Server geocoding failed" });
  }
});

export default router;
