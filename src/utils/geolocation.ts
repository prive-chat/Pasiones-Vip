const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  madrid: { lat: 40.4168, lng: -3.7038 },
  barcelona: { lat: 41.3851, lng: 2.1734 },
  valencia: { lat: 39.4699, lng: -0.3763 },
  sevilla: { lat: 37.3891, lng: -5.9845 },
  marbella: { lat: 36.5101, lng: -4.8824 },
  ibiza: { lat: 38.9067, lng: 1.4206 },
  mallorca: { lat: 39.6953, lng: 3.0176 }
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
