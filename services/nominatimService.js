import fetch from 'node-fetch';
import { getCache, setCache } from '../utils/cache.js';

const USER_AGENT = process.env.USER_AGENT || 'VacationRentalApp/1.0 (aadilsheikh515@gmail.com)';

export async function geocode(query) {
  const key = `geocode:${query}`;
  const cached = getCache(key);
  if (cached) return cached;

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  const data = await res.json();
  const out = data && data[0] ? {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
    display_name: data[0].display_name,
    raw: data[0]
  } : null;

  setCache(key, out, 60 * 60); // cache 1 hour
  return out;
}

export async function reverseGeocode(lat, lon) {
  const key = `reverse:${lat}:${lon}`;
  const cached = getCache(key);
  if (cached) return cached;

  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }});
  const data = await res.json();
  setCache(key, data, 60*60);
  return data;
}
async function getCenterNames(lat, lon) {
  // 1️⃣ Local language
  const localRes = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
  );
  const localData = await localRes.json();

  // 2️⃣ English version
  const englishRes = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`
  );
  const englishData = await englishRes.json();

  return {
    local_name: localData.display_name,
    english_name: englishData.display_name,
    lat: parseFloat(lat),
    lon: parseFloat(lon)
  };
}
