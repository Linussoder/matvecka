// Geolocation utilities for detecting user location

import { getAllCities } from './swedish-locations'

// Swedish city coordinates (approximate centers)
const cityCoordinates = {
  'Stockholm': { lat: 59.3293, lng: 18.0686 },
  'Göteborg': { lat: 57.7089, lng: 11.9746 },
  'Malmö': { lat: 55.6050, lng: 13.0038 },
  'Uppsala': { lat: 59.8586, lng: 17.6389 },
  'Linköping': { lat: 58.4108, lng: 15.6214 },
  'Örebro': { lat: 59.2753, lng: 15.2134 },
  'Västerås': { lat: 59.6099, lng: 16.5448 },
  'Helsingborg': { lat: 56.0465, lng: 12.6945 },
  'Norrköping': { lat: 58.5877, lng: 16.1924 },
  'Jönköping': { lat: 57.7826, lng: 14.1618 },
  'Umeå': { lat: 63.8258, lng: 20.2630 },
  'Lund': { lat: 55.7047, lng: 13.1910 },
  'Gävle': { lat: 60.6749, lng: 17.1413 },
  'Borås': { lat: 57.7210, lng: 12.9401 },
  'Sundsvall': { lat: 62.3908, lng: 17.3069 },
  'Eskilstuna': { lat: 59.3666, lng: 16.5077 },
  'Karlstad': { lat: 59.3793, lng: 13.5036 },
  'Växjö': { lat: 56.8777, lng: 14.8091 },
  'Halmstad': { lat: 56.6745, lng: 12.8578 },
  'Kristianstad': { lat: 56.0294, lng: 14.1567 },
  'Trollhättan': { lat: 58.2837, lng: 12.2886 },
  'Kalmar': { lat: 56.6634, lng: 16.3566 },
  'Skövde': { lat: 58.3910, lng: 13.8456 },
  'Karlskrona': { lat: 56.1612, lng: 15.5869 },
  'Falun': { lat: 60.6065, lng: 15.6355 },
  'Skellefteå': { lat: 64.7507, lng: 20.9528 },
  'Uddevalla': { lat: 58.3498, lng: 11.9381 },
  'Varberg': { lat: 57.1057, lng: 12.2502 },
  'Örnsköldsvik': { lat: 63.2909, lng: 18.7152 },
  'Östersund': { lat: 63.1767, lng: 14.6361 },
  'Nyköping': { lat: 58.7530, lng: 17.0086 },
  'Landskrona': { lat: 55.8708, lng: 12.8302 },
  'Motala': { lat: 58.5372, lng: 15.0364 },
  'Borlänge': { lat: 60.4858, lng: 15.4364 },
  'Lidköping': { lat: 58.5052, lng: 13.1579 },
  'Trelleborg': { lat: 55.3760, lng: 13.1574 },
  'Alingsås': { lat: 57.9305, lng: 12.5333 },
  'Piteå': { lat: 65.3173, lng: 21.4797 },
  'Ängelholm': { lat: 56.2428, lng: 12.8622 },
  'Enköping': { lat: 59.6357, lng: 17.0776 },
  'Mjölby': { lat: 58.3263, lng: 15.1313 },
  'Luleå': { lat: 65.5848, lng: 22.1547 },
  'Kiruna': { lat: 67.8558, lng: 20.2253 },
  'Mora': { lat: 61.0050, lng: 14.5429 },
  'Sandviken': { lat: 60.6166, lng: 16.7716 },
  'Katrineholm': { lat: 58.9958, lng: 16.2075 },
  'Strängnäs': { lat: 59.3792, lng: 17.0312 },
  'Köping': { lat: 59.5140, lng: 15.9926 },
  'Ystad': { lat: 55.4295, lng: 13.8200 },
  'Bjuv': { lat: 56.0747, lng: 12.9214 },
  'Hyllinge': { lat: 56.1024, lng: 12.8972 },
  'Mörarp': { lat: 56.0833, lng: 12.7667 },
  'Åstorp': { lat: 56.1342, lng: 12.9456 },
  'Kungsbacka': { lat: 57.4869, lng: 12.0761 },
  'Mölndal': { lat: 57.6556, lng: 12.0136 },
  'Partille': { lat: 57.7394, lng: 12.1064 },
  'Kungälv': { lat: 57.8710, lng: 11.9731 },
  'Lerum': { lat: 57.7708, lng: 12.2694 },
  'Nacka': { lat: 59.3108, lng: 18.1636 },
  'Solna': { lat: 59.3600, lng: 18.0000 },
  'Huddinge': { lat: 59.2372, lng: 17.9817 },
  'Täby': { lat: 59.4439, lng: 18.0687 },
  'Sollentuna': { lat: 59.4281, lng: 17.9508 },
  'Haninge': { lat: 59.1741, lng: 18.1367 },
  'Botkyrka': { lat: 59.2000, lng: 17.8333 },
  'Järfälla': { lat: 59.4333, lng: 17.8333 },
  'Södertälje': { lat: 59.1955, lng: 17.6253 },
  'Tumba': { lat: 59.2000, lng: 17.8333 },
  'Märsta': { lat: 59.6206, lng: 17.8556 },
  'Bålsta': { lat: 59.5667, lng: 17.5333 },
  'Norrtälje': { lat: 59.7583, lng: 18.7042 },
  'Nynäshamn': { lat: 58.9031, lng: 17.9486 },
  'Tyresö': { lat: 59.2442, lng: 18.2269 },
  'Vallentuna': { lat: 59.5342, lng: 18.0778 },
  'Lidingö': { lat: 59.3667, lng: 18.1500 },
  'Danderyd': { lat: 59.3997, lng: 18.0333 },
  'Sundbyberg': { lat: 59.3617, lng: 17.9708 },
  'Sigtuna': { lat: 59.6167, lng: 17.7167 },
  'Vaxholm': { lat: 59.4028, lng: 18.3506 },
  'Gustavsberg': { lat: 59.3256, lng: 18.3861 },
  'Åkersberga': { lat: 59.4792, lng: 18.3008 },
  'Hässleholm': { lat: 56.1591, lng: 13.7666 },
  'Eslöv': { lat: 55.8392, lng: 13.3036 },
  'Höganäs': { lat: 56.2000, lng: 12.5500 },
  'Staffanstorp': { lat: 55.6417, lng: 13.2056 },
  'Lomma': { lat: 55.6728, lng: 13.0694 },
  'Kävlinge': { lat: 55.7917, lng: 13.1083 },
  'Svedala': { lat: 55.5028, lng: 13.2333 },
  'Simrishamn': { lat: 55.5569, lng: 14.3508 },
  'Tomelilla': { lat: 55.5431, lng: 13.9536 },
  'Sjöbo': { lat: 55.6306, lng: 13.7083 },
  'Höör': { lat: 55.9364, lng: 13.5417 },
  'Båstad': { lat: 56.4261, lng: 12.8514 },
  'Klippan': { lat: 56.1333, lng: 13.1333 },
  'Osby': { lat: 56.3833, lng: 13.9833 },
  'Perstorp': { lat: 56.1333, lng: 13.4000 },
  'Örkelljunga': { lat: 56.2833, lng: 13.2833 },
  'Broby': { lat: 56.2500, lng: 14.0833 },
  'Bromölla': { lat: 56.0747, lng: 14.4689 },
  'Åhus': { lat: 55.9250, lng: 14.3056 },
}

// Calculate distance between two coordinates (Haversine formula)
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Find nearest city from coordinates
export function findNearestCity(latitude, longitude) {
  let nearestCity = null
  let minDistance = Infinity

  for (const [city, coords] of Object.entries(cityCoordinates)) {
    const distance = calculateDistance(latitude, longitude, coords.lat, coords.lng)
    if (distance < minDistance) {
      minDistance = distance
      nearestCity = city
    }
  }

  return {
    city: nearestCity,
    distance: Math.round(minDistance)
  }
}

// Get location from IP address (no permission needed)
export async function getLocationFromIP() {
  try {
    // Using ip-api.com (free, no API key needed, 45 requests/minute)
    const response = await fetch('http://ip-api.com/json/?fields=status,city,regionName,country,lat,lon')
    const data = await response.json()

    if (data.status === 'success' && data.country === 'Sweden') {
      // Find nearest city from our list
      const nearest = findNearestCity(data.lat, data.lon)

      return {
        city: nearest.city || data.city,
        detectedCity: data.city,
        region: data.regionName,
        distance: nearest.distance,
        coordinates: { latitude: data.lat, longitude: data.lon },
        source: 'ip'
      }
    }
    return null
  } catch (error) {
    console.error('IP geolocation error:', error)
    return null
  }
}

// Get location from browser GPS (needs permission)
export async function getLocationFromGPS() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ error: 'Geolocation stöds inte i din webbläsare' })
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        // Find nearest city from our list
        const nearest = findNearestCity(latitude, longitude)

        if (nearest.city) {
          resolve({
            city: nearest.city,
            distance: nearest.distance,
            coordinates: { latitude, longitude },
            source: 'gps'
          })
        } else {
          // Fallback to reverse geocoding
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=sv`,
              { headers: { 'User-Agent': 'Matvecka/1.0' } }
            )
            const data = await response.json()

            const detectedCity = data.address?.city ||
                                 data.address?.town ||
                                 data.address?.municipality ||
                                 data.address?.village

            resolve({
              city: null,
              detectedCity: detectedCity,
              distance: null,
              coordinates: { latitude, longitude },
              source: 'gps',
              error: detectedCity ? `Hittade "${detectedCity}" men den finns inte i vår lista` : 'Kunde inte hitta din ort'
            })
          } catch (error) {
            resolve({ error: 'Kunde inte hämta platsinfo' })
          }
        }
      },
      (error) => {
        let errorMessage = 'Kunde inte hämta din plats'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Du nekade tillgång till din plats. Tillåt platsåtkomst i webbläsarens inställningar.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Platsinformation är inte tillgänglig just nu'
            break
          case error.TIMEOUT:
            errorMessage = 'Förfrågan tog för lång tid. Försök igen.'
            break
        }
        resolve({ error: errorMessage })
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000 // Cache for 1 minute
      }
    )
  })
}

// Find the closest matching city in our list (for text matching)
export function findMatchingCity(detectedCity) {
  if (!detectedCity) return null

  const allCities = getAllCities()
  const normalizedDetected = detectedCity.toLowerCase().trim()

  // 1. Exact match
  const exactMatch = allCities.find(
    city => city.toLowerCase() === normalizedDetected
  )
  if (exactMatch) return exactMatch

  // 2. Partial match (detected city contains or is contained by our city)
  const partialMatch = allCities.find(
    city => city.toLowerCase().includes(normalizedDetected) ||
            normalizedDetected.includes(city.toLowerCase())
  )
  if (partialMatch) return partialMatch

  // 3. Try removing common suffixes/prefixes
  const cleanedDetected = normalizedDetected
    .replace(/\s*(kommun|stad|municipality|city)$/i, '')
    .trim()

  const cleanedMatch = allCities.find(
    city => city.toLowerCase() === cleanedDetected ||
            city.toLowerCase().includes(cleanedDetected)
  )
  if (cleanedMatch) return cleanedMatch

  return null
}

// Combined function: try GPS first
export async function detectLocation() {
  const gpsResult = await getLocationFromGPS()

  if (gpsResult.error) {
    return gpsResult
  }

  return gpsResult
}
