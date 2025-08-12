import fetch from 'node-fetch';
import { getCache, setCache } from '../utils/cache.js';

/**
 * Fetch nearby POIs using Overpass API (OSM).
 * tags: we use a combined query for tourism/amenity/natural/leisure types.
 */
export async function fetchNearbyPOIs(lat, lon, radius = 5000, limit = 20) {
  const key = `nearby:${lat}:${lon}:${radius}:${limit}`;
  const cached = getCache(key);
  if (cached) return cached;

  const q = `
    [out:json][timeout:25];
    (
      node(around:${radius},${lat},${lon})[tourism=attraction];
      node(around:${radius},${lat},${lon})[natural=beach];
      node(around:${radius},${lat},${lon})[amenity=restaurant];
      node(around:${radius},${lat},${lon})[amenity=bar];
      node(around:${radius},${lat},${lon})[leisure=park];
      node(around:${radius},${lat},${lon})[amenity=hotel];
      node(around:${radius},${lat},${lon})[tourism=viewpoint];
      way(around:${radius},${lat},${lon})[tourism=attraction];
      way(around:${radius},${lat},${lon})[natural=beach];
      relation(around:${radius},${lat},${lon})[tourism=attraction];
    );
    out center ${limit};
  `;
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: q,
    headers: { 'Content-Type': 'text/plain' }
  });
  const data = await res.json();

  // normalize results: nodes and ways may have different geometry
  const items = (data.elements || []).map(el => {
    const latOut = el.lat ?? (el.center && el.center.lat);
    const lonOut = el.lon ?? (el.center && el.center.lon);
    return {
      id: el.id,
      type: el.type,
      name: el.tags && (el.tags.name || el.tags['name:en']) || 'Unknown',
      lat: latOut,
      lon: lonOut,
      tags: el.tags || {}
    };
  }).filter(i => i.lat && i.lon);

  const sliced = items.slice(0, limit);
  setCache(key, sliced, 60 * 10); // cache 10 minutes
  return sliced;
}
