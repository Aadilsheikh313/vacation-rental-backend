import express from "express";
import fetch from "node-fetch";
const router = express.Router();

router.get("/geocode", async (req, res) => {
  const { q } = req.query;

  try {
    const cleanQuery = q.replace(/[^a-zA-Z0-9 ,]/g, "");
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}`,

      {
        headers: {
          "User-Agent": "VacationRentalApp/1.0 (your-email@example.com)",
        },
      }
    );

    const data = await response.json();
    console.log("📦 Geocode API raw data:", data);
    res.json(data);
  } catch (e) {
    console.error("Geocoding error:", e);
    res.status(500).json({ error: "Server geocoding failed" });
  }
});

export default router;
