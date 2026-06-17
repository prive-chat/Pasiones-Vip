const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  madrid: { lat: 40.4168, lng: -3.7038 },
  barcelona: { lat: 41.3851, lng: 2.1734 },
  valencia: { lat: 39.4699, lng: -0.3763 },
  sevilla: { lat: 37.3891, lng: -5.9845 },
  marbella: { lat: 36.5101, lng: -4.8824 },
  ibiza: { lat: 38.9067, lng: 1.4206 },
  mallorca: { lat: 39.6953, lng: 3.0176 },
  
  // Ecuador Cities Coords
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

export function getSimulatedCoords(userId: string, city: string) {
  const normCity = (city || 'madrid').toLowerCase().trim();
  const base = CITY_COORDS[normCity] || CITY_COORDS.madrid;
  
  // Create deterministic hash from userId string
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate stable relative radial offset (within ~15-20km range)
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
