// routes/overpassRoutes.js
import express from "express";
import fetch from "node-fetch";
import { getForecast } from "../services/openWeatherService.js"; // tumhara function

const router = express.Router();

router.post("/", async (req, res) => {
  const { lat, lon, radius } = req.body;
  if (!lat || !lon) {
    return res.status(400).json({ message: "Latitude and longitude required" });
  }

  const query = `
    [out:json];
    (
      node(around:${radius},${lat},${lon})[tourism];
      node(around:${radius},${lat},${lon})[amenity];
    );
    out body;
  `;

  try {
    // POI fetch
    const poiResp = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
    });
    const poiData = await poiResp.json();

    // Weather fetch
    const weatherData = await getForecast(lat, lon);

    // Final Response
    res.json({
      pois: poiData.elements,
      center: { lat, lon },
      price: { low: 500, median: 1500, high: 3000 }, 
      weather: weatherData
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch trip info" });
  }
});

export default router;
