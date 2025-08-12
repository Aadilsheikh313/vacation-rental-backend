import { geocode } from "../services/nominatimService.js";
import { getForecast } from "../services/openWeatherService.js";
import { getRoute } from "../services/osrmService.js";
import { fetchNearbyPOIs } from "../services/overpassService.js";
import fetch from "node-fetch";


export async function getCurrentWeather(lat, lon) {
  const KEY = process.env.OPENWEATHER_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${KEY}`;
  const res = await fetch(url);
  return res.json();
}

export async function tripInfo(req, res) {
  try {
    const { q, lat, lon, radius = 10000, limit = 12, mode = "driving" } = req.query;

    // 1) Find center
    let center;
    if (q) {
      center = await geocode(q);
      if (!center) return res.status(404).json({ error: "place not found" });
    } else if (lat && lon) {
      center = { lat: parseFloat(lat), lon: parseFloat(lon) };
    } else {
      return res.status(400).json({ error: "Provide q or lat+lon" });
    }

    // 2) Get current weather
    let currentWeather = null;
    try {
      currentWeather = await getCurrentWeather(center.lat, center.lon);

    } catch (e) {
      currentWeather = null;
    }

    // 3) Get forecast (5-day)
    let weather = null;
    try {
      weather = await getForecast(center.lat, center.lon);
    } catch (e) {
      weather = null;
    }

    // 4) Nearby POIs
    const pois = await fetchNearbyPOIs(center.lat, center.lon, parseInt(radius), parseInt(limit));

    // 5) Add routes to each POI
    const enriched = [];
    for (let p of pois) {
      let route = null;
      try {
        route = await getRoute(center.lat, center.lon, p.lat, p.lon, mode);
      } catch (e) {
        route = null;
      }
      enriched.push({
        id: p.id,
        name: p.name,
        lat: p.lat,
        lon: p.lon,
        tags: p.tags,
        route
      });
    }

    // 6) Send full data
    return res.json({
      center: { lat: center.lat, lon: center.lon, display_name: center.display_name || null },
      currentWeather, // abhi ka mausam
      weather,        // forecast
      pois: enriched,
      price: { low: 500, median: 1500, high: 3000 }
    });

  } catch (err) {
    console.error("tripInfo error", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}
