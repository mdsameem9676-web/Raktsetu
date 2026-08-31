/**
 * Geocoding Service — Raktsetu
 *
 * Converts a human-readable location string (city, address, etc.)
 * into latitude / longitude coordinates using the free
 * Nominatim OpenStreetMap API (no API key required).
 *
 * Results are cached in localStorage so repeated lookups for the
 * same string are instant and do not burn extra network requests.
 *
 * This service is general-purpose — it works for any city, state,
 * or country. There is NO city-specific hardcoding here.
 */

const CACHE_KEY = 'raktsetu_geocache';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
  lat: number;
  lng: number;
  displayName: string;
  cachedAt: number;
}

type GeoCache = Record<string, CacheEntry>;

const loadCache = (): GeoCache => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
  } catch {
    return {};
  }
};

const saveCache = (cache: GeoCache) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage full — ignore
  }
};

/**
 * Resolves a location string to coordinates.
 *
 * @param locationText - Any address, city, or region string. e.g. "Hyderabad",
 *   "Apollo Hospital, Bangalore", "Karol Bagh, Delhi"
 * @returns { lat, lng, displayName } or null if resolution fails.
 */
export const geocodeLocation = async (
  locationText: string
): Promise<{ lat: number; lng: number; displayName: string } | null> => {
  const key = locationText.trim().toLowerCase();
  if (!key) return null;

  // 1. Check cache
  const cache = loadCache();
  const cached = cache[key];
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return { lat: cached.lat, lng: cached.lng, displayName: cached.displayName };
  }

  // 2. Call Nominatim API
  try {
    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(locationText.trim())}` +
      `&format=json&limit=1&addressdetails=0`;

    const response = await fetch(url, {
      headers: {
        // Nominatim requires a descriptive User-Agent
        'User-Agent': 'Raktsetu-BloodDonation-App/1.0 (contact: dev@raktsetu.org)',
        'Accept-Language': 'en',
      },
    });

    if (!response.ok) {
      console.warn(`[Geocoding] Nominatim returned HTTP ${response.status} for "${locationText}"`);
      return null;
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      console.warn(`[Geocoding] No results for "${locationText}"`);
      return null;
    }

    const { lat, lon, display_name } = data[0];
    const result = {
      lat: parseFloat(lat),
      lng: parseFloat(lon),
      displayName: display_name,
    };

    // 3. Cache the result
    cache[key] = { ...result, cachedAt: Date.now() };
    saveCache(cache);

    return result;
  } catch (err) {
    console.warn(`[Geocoding] Network error geocoding "${locationText}":`, err);
    return null;
  }
};

/**
 * Returns cached coordinates synchronously (no network).
 * Used by the matching engine which runs synchronously.
 */
export const getCachedCoordinates = (
  locationText: string
): { lat: number; lng: number } | null => {
  if (!locationText?.trim()) return null;
  const key = locationText.trim().toLowerCase();
  const cache = loadCache();
  const cached = cache[key];
  if (cached) return { lat: cached.lat, lng: cached.lng };
  return null;
};
