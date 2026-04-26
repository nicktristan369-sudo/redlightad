// Major cities for grouping smaller towns
// Each major city has coordinates and a radius (km) for grouping

export interface MajorCity {
  name: string
  country: string
  countryCode: string
  lat: number
  lng: number
  radius: number // km - cities within this radius get grouped here
}

export const MAJOR_CITIES: MajorCity[] = [
  // Spain
  { name: "Madrid", country: "Spain", countryCode: "ES", lat: 40.4168, lng: -3.7038, radius: 50 },
  { name: "Barcelona", country: "Spain", countryCode: "ES", lat: 41.3851, lng: 2.1734, radius: 40 },
  { name: "Málaga", country: "Spain", countryCode: "ES", lat: 36.7213, lng: -4.4214, radius: 60 },
  { name: "Marbella", country: "Spain", countryCode: "ES", lat: 36.5099, lng: -4.8861, radius: 30 },
  { name: "Valencia", country: "Spain", countryCode: "ES", lat: 39.4699, lng: -0.3763, radius: 40 },
  { name: "Sevilla", country: "Spain", countryCode: "ES", lat: 37.3891, lng: -5.9845, radius: 40 },
  { name: "Alicante", country: "Spain", countryCode: "ES", lat: 38.3452, lng: -0.4810, radius: 40 },
  { name: "Palma de Mallorca", country: "Spain", countryCode: "ES", lat: 39.5696, lng: 2.6502, radius: 50 },
  { name: "Ibiza", country: "Spain", countryCode: "ES", lat: 38.9067, lng: 1.4206, radius: 30 },
  
  // Germany
  { name: "Berlin", country: "Germany", countryCode: "DE", lat: 52.5200, lng: 13.4050, radius: 50 },
  { name: "Munich", country: "Germany", countryCode: "DE", lat: 48.1351, lng: 11.5820, radius: 50 },
  { name: "Hamburg", country: "Germany", countryCode: "DE", lat: 53.5511, lng: 9.9937, radius: 40 },
  { name: "Frankfurt", country: "Germany", countryCode: "DE", lat: 50.1109, lng: 8.6821, radius: 40 },
  { name: "Cologne", country: "Germany", countryCode: "DE", lat: 50.9375, lng: 6.9603, radius: 40 },
  { name: "Düsseldorf", country: "Germany", countryCode: "DE", lat: 51.2277, lng: 6.7735, radius: 30 },
  { name: "Stuttgart", country: "Germany", countryCode: "DE", lat: 48.7758, lng: 9.1829, radius: 40 },
  
  // UK
  { name: "London", country: "United Kingdom", countryCode: "GB", lat: 51.5074, lng: -0.1278, radius: 60 },
  { name: "Manchester", country: "United Kingdom", countryCode: "GB", lat: 53.4808, lng: -2.2426, radius: 40 },
  { name: "Birmingham", country: "United Kingdom", countryCode: "GB", lat: 52.4862, lng: -1.8904, radius: 40 },
  { name: "Liverpool", country: "United Kingdom", countryCode: "GB", lat: 53.4084, lng: -2.9916, radius: 30 },
  { name: "Edinburgh", country: "United Kingdom", countryCode: "GB", lat: 55.9533, lng: -3.1883, radius: 30 },
  { name: "Glasgow", country: "United Kingdom", countryCode: "GB", lat: 55.8642, lng: -4.2518, radius: 30 },
  
  // Denmark
  { name: "Copenhagen", country: "Denmark", countryCode: "DK", lat: 55.6761, lng: 12.5683, radius: 50 },
  { name: "Aarhus", country: "Denmark", countryCode: "DK", lat: 56.1629, lng: 10.2039, radius: 40 },
  { name: "Odense", country: "Denmark", countryCode: "DK", lat: 55.4038, lng: 10.4024, radius: 30 },
  { name: "Aalborg", country: "Denmark", countryCode: "DK", lat: 57.0488, lng: 9.9217, radius: 30 },
  
  // Sweden
  { name: "Stockholm", country: "Sweden", countryCode: "SE", lat: 59.3293, lng: 18.0686, radius: 50 },
  { name: "Gothenburg", country: "Sweden", countryCode: "SE", lat: 57.7089, lng: 11.9746, radius: 40 },
  { name: "Malmö", country: "Sweden", countryCode: "SE", lat: 55.6050, lng: 13.0038, radius: 30 },
  
  // Norway
  { name: "Oslo", country: "Norway", countryCode: "NO", lat: 59.9139, lng: 10.7522, radius: 40 },
  { name: "Bergen", country: "Norway", countryCode: "NO", lat: 60.3913, lng: 5.3221, radius: 30 },
  
  // Netherlands
  { name: "Amsterdam", country: "Netherlands", countryCode: "NL", lat: 52.3676, lng: 4.9041, radius: 40 },
  { name: "Rotterdam", country: "Netherlands", countryCode: "NL", lat: 51.9244, lng: 4.4777, radius: 30 },
  { name: "The Hague", country: "Netherlands", countryCode: "NL", lat: 52.0705, lng: 4.3007, radius: 25 },
  
  // Belgium
  { name: "Brussels", country: "Belgium", countryCode: "BE", lat: 50.8503, lng: 4.3517, radius: 40 },
  { name: "Antwerp", country: "Belgium", countryCode: "BE", lat: 51.2194, lng: 4.4025, radius: 30 },
  
  // France
  { name: "Paris", country: "France", countryCode: "FR", lat: 48.8566, lng: 2.3522, radius: 60 },
  { name: "Nice", country: "France", countryCode: "FR", lat: 43.7102, lng: 7.2620, radius: 40 },
  { name: "Lyon", country: "France", countryCode: "FR", lat: 45.7640, lng: 4.8357, radius: 40 },
  { name: "Marseille", country: "France", countryCode: "FR", lat: 43.2965, lng: 5.3698, radius: 40 },
  { name: "Cannes", country: "France", countryCode: "FR", lat: 43.5528, lng: 7.0174, radius: 25 },
  
  // Italy
  { name: "Rome", country: "Italy", countryCode: "IT", lat: 41.9028, lng: 12.4964, radius: 50 },
  { name: "Milan", country: "Italy", countryCode: "IT", lat: 45.4642, lng: 9.1900, radius: 50 },
  { name: "Naples", country: "Italy", countryCode: "IT", lat: 40.8518, lng: 14.2681, radius: 40 },
  { name: "Florence", country: "Italy", countryCode: "IT", lat: 43.7696, lng: 11.2558, radius: 30 },
  { name: "Venice", country: "Italy", countryCode: "IT", lat: 45.4408, lng: 12.3155, radius: 30 },
  
  // Switzerland
  { name: "Zurich", country: "Switzerland", countryCode: "CH", lat: 47.3769, lng: 8.5417, radius: 40 },
  { name: "Geneva", country: "Switzerland", countryCode: "CH", lat: 46.2044, lng: 6.1432, radius: 30 },
  { name: "Basel", country: "Switzerland", countryCode: "CH", lat: 47.5596, lng: 7.5886, radius: 25 },
  
  // Austria
  { name: "Vienna", country: "Austria", countryCode: "AT", lat: 48.2082, lng: 16.3738, radius: 40 },
  { name: "Salzburg", country: "Austria", countryCode: "AT", lat: 47.8095, lng: 13.0550, radius: 25 },
  
  // Portugal
  { name: "Lisbon", country: "Portugal", countryCode: "PT", lat: 38.7223, lng: -9.1393, radius: 50 },
  { name: "Porto", country: "Portugal", countryCode: "PT", lat: 41.1579, lng: -8.6291, radius: 40 },
  { name: "Faro", country: "Portugal", countryCode: "PT", lat: 37.0194, lng: -7.9322, radius: 50 },
  
  // Greece
  { name: "Athens", country: "Greece", countryCode: "GR", lat: 37.9838, lng: 23.7275, radius: 50 },
  { name: "Thessaloniki", country: "Greece", countryCode: "GR", lat: 40.6401, lng: 22.9444, radius: 40 },
  
  // Czech Republic
  { name: "Prague", country: "Czech Republic", countryCode: "CZ", lat: 50.0755, lng: 14.4378, radius: 40 },
  
  // Poland
  { name: "Warsaw", country: "Poland", countryCode: "PL", lat: 52.2297, lng: 21.0122, radius: 50 },
  { name: "Krakow", country: "Poland", countryCode: "PL", lat: 50.0647, lng: 19.9450, radius: 40 },
  
  // Hungary
  { name: "Budapest", country: "Hungary", countryCode: "HU", lat: 47.4979, lng: 19.0402, radius: 50 },
  
  // UAE
  { name: "Dubai", country: "United Arab Emirates", countryCode: "AE", lat: 25.2048, lng: 55.2708, radius: 50 },
  { name: "Abu Dhabi", country: "United Arab Emirates", countryCode: "AE", lat: 24.4539, lng: 54.3773, radius: 40 },
  
  // Thailand
  { name: "Bangkok", country: "Thailand", countryCode: "TH", lat: 13.7563, lng: 100.5018, radius: 60 },
  { name: "Pattaya", country: "Thailand", countryCode: "TH", lat: 12.9236, lng: 100.8825, radius: 30 },
  { name: "Phuket", country: "Thailand", countryCode: "TH", lat: 7.8804, lng: 98.3923, radius: 40 },
  
  // USA
  { name: "New York", country: "United States", countryCode: "US", lat: 40.7128, lng: -74.0060, radius: 60 },
  { name: "Los Angeles", country: "United States", countryCode: "US", lat: 34.0522, lng: -118.2437, radius: 80 },
  { name: "Miami", country: "United States", countryCode: "US", lat: 25.7617, lng: -80.1918, radius: 60 },
  { name: "Las Vegas", country: "United States", countryCode: "US", lat: 36.1699, lng: -115.1398, radius: 40 },
  { name: "San Francisco", country: "United States", countryCode: "US", lat: 37.7749, lng: -122.4194, radius: 50 },
  { name: "Chicago", country: "United States", countryCode: "US", lat: 41.8781, lng: -87.6298, radius: 60 },
  
  // Canada
  { name: "Toronto", country: "Canada", countryCode: "CA", lat: 43.6532, lng: -79.3832, radius: 60 },
  { name: "Vancouver", country: "Canada", countryCode: "CA", lat: 49.2827, lng: -123.1207, radius: 50 },
  { name: "Montreal", country: "Canada", countryCode: "CA", lat: 45.5017, lng: -73.5673, radius: 50 },
  
  // Australia
  { name: "Sydney", country: "Australia", countryCode: "AU", lat: -33.8688, lng: 151.2093, radius: 60 },
  { name: "Melbourne", country: "Australia", countryCode: "AU", lat: -37.8136, lng: 144.9631, radius: 60 },
  { name: "Brisbane", country: "Australia", countryCode: "AU", lat: -27.4698, lng: 153.0251, radius: 50 },
  { name: "Gold Coast", country: "Australia", countryCode: "AU", lat: -28.0167, lng: 153.4000, radius: 40 },
]

// Calculate distance between two points using Haversine formula
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Find the nearest major city for a given location
export function findNearestMajorCity(
  lat: number, 
  lng: number, 
  countryCode?: string
): MajorCity | null {
  // Filter by country if provided
  const candidates = countryCode 
    ? MAJOR_CITIES.filter(c => c.countryCode === countryCode.toUpperCase())
    : MAJOR_CITIES
  
  if (candidates.length === 0) return null
  
  let nearest: MajorCity | null = null
  let minDistance = Infinity
  
  for (const city of candidates) {
    const distance = calculateDistance(lat, lng, city.lat, city.lng)
    
    // Only consider if within the city's radius
    if (distance <= city.radius && distance < minDistance) {
      minDistance = distance
      nearest = city
    }
  }
  
  // If no city within radius, find the absolute nearest in the country
  if (!nearest && countryCode) {
    for (const city of candidates) {
      const distance = calculateDistance(lat, lng, city.lat, city.lng)
      if (distance < minDistance) {
        minDistance = distance
        nearest = city
      }
    }
  }
  
  return nearest
}

// Get display location string (e.g., "Málaga, Torremolinos")
export function getDisplayLocation(majorCity: string | null, exactCity: string): string {
  if (!majorCity || majorCity === exactCity) {
    return exactCity
  }
  return `${majorCity}, ${exactCity}`
}
