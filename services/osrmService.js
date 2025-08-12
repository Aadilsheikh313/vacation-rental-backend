import fetch from 'node-fetch';

/**
 * getRoute: returns duration (seconds) and distance (meters) for a route between two points
 * mode: driving, walking, cycling
 */
export async function getRoute(startLat, startLon, endLat, endLon, mode = 'driving') {
  const url = `https://router.project-osrm.org/route/v1/${mode}/${startLon},${startLat};${endLon},${endLat}?overview=false&alternatives=false&steps=false`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data || !data.routes || !data.routes[0]) return null;
  const r = data.routes[0];
  return { distance: r.distance, duration: r.duration };
}
