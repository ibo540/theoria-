/**
 * Country name to approximate center coordinates mapping
 * Coordinates are in [lat, lng] format
 */
export const COUNTRY_COORDINATES: Record<string, [number, number]> = {
  "United States of America": [39.8283, -98.5795],
  "United States": [39.8283, -98.5795],
  "USA": [39.8283, -98.5795],
  "Russia": [61.5240, 105.3188],
  "Russian Federation": [61.5240, 105.3188],
  "Russian Empire": [61.5240, 105.3188], // Historical
  "China": [35.8617, 104.1954],
  "United Kingdom": [55.3781, -3.4360],
  "UK": [55.3781, -3.4360],
  "British Empire": [55.3781, -3.4360], // Historical
  "France": [46.2276, 2.2137],
  "Germany": [51.1657, 10.4515],
  "German Empire": [51.1657, 10.4515], // Historical
  "Japan": [36.2048, 138.2529],
  "India": [20.5937, 78.9629],
  "Brazil": [-14.2350, -51.9253],
  "Canada": [56.1304, -106.3468],
  "Australia": [-25.2744, 133.7751],
  "South Korea": [35.9078, 127.7669],
  "Italy": [41.8719, 12.5674],
  "Spain": [40.4637, -3.7492],
  "Mexico": [23.6345, -102.5528],
  "Indonesia": [-0.7893, 113.9213],
  "Turkey": [38.9637, 35.2433],
  "Ottoman Empire": [38.9637, 35.2433], // Historical: centered in modern Turkey
  "Saudi Arabia": [23.8859, 45.0792],
  "Iran": [32.4279, 53.6880],
  "Poland": [51.9194, 19.1451],
  "Ukraine": [48.3794, 31.1656],
  "Egypt": [26.8206, 30.8025],
  "South Africa": [-30.5595, 22.9375],
  "Argentina": [-38.4161, -63.6167],
  "Pakistan": [30.3753, 69.3451],
  "Bangladesh": [23.6850, 90.3563],
  "Vietnam": [14.0583, 108.2772],
  "Thailand": [15.8700, 100.9925],
  "Philippines": [12.8797, 121.7740],
  "Algeria": [28.0339, 1.6596],
  "Iraq": [33.2232, 43.6793],
  "Afghanistan": [33.9391, 67.7100],
  "North Korea": [40.3399, 127.5101],
  "Cuba": [21.5218, -77.7812],
  "Venezuela": [6.4238, -66.5897],
  "Colombia": [4.5709, -74.2973],
  "Chile": [-35.6751, -71.5430],
  "Peru": [-9.1900, -75.0152],
  "Greece": [39.0742, 21.8243],
  "Portugal": [39.3999, -8.2245],
  "Netherlands": [52.1326, 5.2913],
  "Belgium": [50.5039, 4.4699],
  "Switzerland": [46.8182, 8.2275],
  "Austria": [47.5162, 14.5501],
  "Austria-Hungary": [47.5162, 14.5501], // Historical: centered in Austria
  "Austria Hungary": [47.5162, 14.5501], // Alternative spelling
  "Sweden": [60.1282, 18.6435],
  "Norway": [60.4720, 8.4689],
  "Denmark": [56.2639, 9.5018],
  "Finland": [61.9241, 25.7482],
  "Israel": [31.0461, 34.8516],
  "Palestine": [31.9522, 35.2332],
  "Jordan": [30.5852, 36.2384],
  "Lebanon": [33.8547, 35.8623],
  "Syria": [34.8021, 38.9968],
  "Yemen": [15.5527, 48.5164],
  "Oman": [21.4735, 55.9754],
  "United Arab Emirates": [23.4241, 53.8478],
  "Kuwait": [29.3117, 47.4818],
  "Qatar": [25.3548, 51.1839],
  "Bahrain": [25.9304, 50.6378],
  "Kazakhstan": [48.0196, 66.9237],
  "Uzbekistan": [41.3775, 64.5853],
  "Turkmenistan": [38.9697, 59.5563],
  "Kyrgyzstan": [41.2044, 74.7661],
  "Tajikistan": [38.8610, 71.2761],
  "Mongolia": [46.8625, 103.8467],
  "Myanmar": [21.9162, 95.9560],
  "Laos": [19.8563, 102.4955],
  "Cambodia": [12.5657, 104.9910],
  "Malaysia": [4.2105, 101.9758],
  "Singapore": [1.3521, 103.8198],
  "New Zealand": [-40.9006, 174.8860],
  "Ireland": [53.4129, -8.2439],
  "Iceland": [64.9631, -19.0208],
  "Luxembourg": [49.8153, 6.1296],
  "Czech Republic": [49.8175, 15.4730],
  "Slovakia": [48.6690, 19.6990],
  "Hungary": [47.1625, 19.5033],
  "Romania": [45.9432, 24.9668],
  "Bulgaria": [42.7339, 25.4858],
  "Serbia": [44.0165, 21.0059],
  "Croatia": [45.1000, 15.2000],
  "Bosnia and Herzegovina": [43.9159, 17.6791],
  "Slovenia": [46.1512, 14.9955],
  "Albania": [41.1533, 20.1683],
  "Macedonia": [41.6086, 21.7453],
  "Montenegro": [42.7087, 19.3744],
  "Kosovo": [42.6026, 20.9030],
  "Moldova": [47.4116, 28.3699],
  "Belarus": [53.7098, 27.9534],
  "Lithuania": [55.1694, 23.8813],
  "Latvia": [56.8796, 24.6032],
  "Estonia": [58.5953, 25.0136],
  "Georgia": [42.3154, 43.3569],
  "Armenia": [40.0691, 45.0382],
  "Azerbaijan": [40.1431, 47.5769],
  "Libya": [26.3351, 17.2283],
  "Tunisia": [33.8869, 9.5375],
  "Morocco": [31.7917, -7.0926],
  "Sudan": [12.8628, 30.2176],
  "Ethiopia": [9.1450, 38.7667],
  "Kenya": [-0.0236, 37.9062],
  "Tanzania": [-6.3690, 34.8888],
  "Uganda": [1.3733, 32.2903],
  "Ghana": [7.9465, -1.0232],
  "Nigeria": [9.0820, 8.6753],
  "Senegal": [14.4974, -14.4524],
  "Mali": [17.5707, -3.9962],
  "Niger": [17.6078, 8.0817],
  "Chad": [15.4542, 18.7322],
  "Cameroon": [7.3697, 12.3547],
  "Democratic Republic of the Congo": [-4.0383, 21.7587],
  "Republic of the Congo": [-0.2280, 15.8277],
  "Angola": [-11.2027, 17.8739],
  "Zambia": [-13.1339, 27.8493],
  "Zimbabwe": [-19.0154, 29.1549],
  "Mozambique": [-18.6657, 35.5296],
  "Madagascar": [-18.7669, 46.8691],
  "Botswana": [-22.3285, 24.6849],
  "Namibia": [-22.9576, 18.4904],
  "Lesotho": [-29.6100, 28.2336],
  "Swaziland": [-26.5225, 31.4659],
  "Eswatini": [-26.5225, 31.4659],
};

/**
 * Get approximate center coordinates for a country
 * Returns [lat, lng] or null if country not found
 */
export function getCountryCoordinates(countryName: string): [number, number] | null {
  // Try exact match first
  if (COUNTRY_COORDINATES[countryName]) {
    return COUNTRY_COORDINATES[countryName];
  }
  
  // Try case-insensitive match
  const normalizedName = countryName.trim();
  for (const [key, coords] of Object.entries(COUNTRY_COORDINATES)) {
    if (key.toLowerCase() === normalizedName.toLowerCase()) {
      return coords;
    }
  }
  
  // Try partial match (e.g., "United States" matches "United States of America")
  for (const [key, coords] of Object.entries(COUNTRY_COORDINATES)) {
    if (key.toLowerCase().includes(normalizedName.toLowerCase()) || 
        normalizedName.toLowerCase().includes(key.toLowerCase())) {
      return coords;
    }
  }
  
  return null;
}
