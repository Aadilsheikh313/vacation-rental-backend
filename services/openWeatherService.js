import fetch from 'node-fetch';
import { getCache, setCache } from '../utils/cache.js';


export async function getForecast(lat, lon) {
  const KEY = process.env.OPENWEATHER_KEY;
  console.log("OPEN WEATHER", KEY);
  const key = `weather:${lat}:${lon}`;
  const cached = getCache(key);
  if (cached) return cached;
  if (!KEY) throw new Error('OPENWEATHER_KEY not set in env');

  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  setCache(key, data, 60 * 30); // 30 minutes
  return data;
}
