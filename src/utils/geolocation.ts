import { WORLD_COUNTRIES } from './worldData';

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  // España Core
  madrid: { lat: 40.4168, lng: -3.7038 },
  barcelona: { lat: 41.3851, lng: 2.1734 },
  valencia: { lat: 39.4699, lng: -0.3763 },
  sevilla: { lat: 37.3891, lng: -5.9845 },
  marbella: { lat: 36.5101, lng: -4.8824 },
  ibiza: { lat: 38.9067, lng: 1.4206 },
  mallorca: { lat: 39.6953, lng: 3.0176 },
  
  // Ecuador Core
  quito: { lat: -0.1807, lng: -78.4678 },
  guayaquil: { lat: -2.1894, lng: -79.8890 },
  cuenca: { lat: -2.9001, lng: -79.0059 },
  manta: { lat: -0.9677, lng: -80.7089 },
  portoviejo: { lat: -1.0546, lng: -80.4542 },
  ambato: { lat: -1.2491, lng: -78.6168 },
  baños: { lat: -1.3964, lng: -78.4247 },
  loja: { lat: -3.9931, lng: -79.2042 },
  sangolquí: { lat: -0.3341, lng: -78.4418 },
  cayambe: { lat: 0.0416, lng: -78.1453 },
  machachi: { lat: -0.5103, lng: -78.5668 },
  samborondón: { lat: -1.9610, lng: -79.7249 },
  durán: { lat: -2.1670, lng: -79.8167 },
  milagro: { lat: -2.1286, lng: -79.5932 },
  gualaceo: { lat: -2.8942, lng: -78.7844 },
  paute: { lat: -2.7788, lng: -78.7619 },
  chone: { lat: -0.6981, lng: -80.0936 },
  montecristi: { lat: -1.0471, lng: -80.6575 },
  pelileo: { lat: -1.3308, lng: -78.5147 },
  catamayo: { lat: -3.9850, lng: -79.3517 },
  cariamanga: { lat: -4.3256, lng: -79.5544 }
};

// Base coordinates for each country in case we only know the country
const COUNTRY_COORDS_BASE: Record<string, { lat: number; lng: number }> = {
  espana: { lat: 40.4168, lng: -3.7038 }, // Madrid
  ecuador: { lat: -0.1807, lng: -78.4678 }, // Quito
  colombia: { lat: 4.7110, lng: -74.0721 }, // Bogotá
  mexico: { lat: 19.4326, lng: -99.1332 }, // CDMX
  usa: { lat: 37.0902, lng: -95.7129 }, // Center of US
  argentina: { lat: -34.6037, lng: -58.3816 }, // BA
  peru: { lat: -12.0464, lng: -77.0428 }, // Lima
  venezuela: { lat: 10.4806, lng: -66.9036 }, // Caracas
  chile: { lat: -33.4489, lng: -70.6693 } // Santiago
};

export function getSimulatedCoords(userId: string, city: string) {
  const normCity = (city || 'madrid').toLowerCase().trim();
  
  // 1. Direct match
  let base = CITY_COORDS[normCity];
  
  // 2. Scan geographic database for dynamic matching if not direct match
  if (!base) {
    let matchedCountryKey = 'espana';
    let found = false;

    // Search through states and cities
    for (const [countryKey, countryData] of Object.entries(WORLD_COUNTRIES)) {
      if (found) break;
      for (const [province, cities] of Object.entries(countryData.provinces)) {
        // Match province name or city name
        if (
          province.toLowerCase().trim() === normCity ||
          cities.some(c => c.toLowerCase().trim() === normCity)
        ) {
          matchedCountryKey = countryKey;
          found = true;
          break;
        }
      }
    }

    // Default to country base, or Madrid as ultimo resource
    base = COUNTRY_COORDS_BASE[matchedCountryKey] || CITY_COORDS.madrid;
  }
  
  // Create deterministic hash from userId string to scatter profiles
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Stable relative radial offset (within ~15-20km range)
  const latOffset = ((Math.abs(hash) % 100) / 600) - 0.082;
  const lngOffset = (((Math.abs(hash) >> 4) % 100) / 600) - 0.082;
  
  return {
    lat: base.lat + latOffset,
    lng: base.lng + lngOffset
  };
}

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // earth radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Number((R * c).toFixed(1));
}
