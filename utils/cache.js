import NodeCache from 'node-cache';
const cache = new NodeCache();

export function getCache(key) {
  return cache.get(key);
}
export function setCache(key, value, ttlSeconds = 300) {
  cache.set(key, value, ttlSeconds);
}
