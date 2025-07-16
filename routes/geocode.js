import express from "express";
import fetch from "node-fetch"; 
const router = express.Router();

router.get("/geocode", async (req, res) => {
  const { q } = req.query;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}`
    );

    const data = await response.json();
    res.json(data);
  } catch (e) {
    console.error("Geocoding error:", e);
    res.status(500).json({ error: "Server geocoding failed" });
  }
});

export default router;
