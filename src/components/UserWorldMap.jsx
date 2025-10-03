import React, { useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker
} from 'react-simple-maps';

// World map topology URL
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function UserWorldMap({ data }) {
  const [hoveredCountry, setHoveredCountry] = useState(null);
  
  // Transform data to country codes and counts
  const countryData = data.reduce((acc, item) => {
    const country = item.country || 'unknown';
    acc[country] = (acc[country] || 0) + item.count;
    return acc;
  }, {});

  // Get max count for scaling colors
  const maxCount = Math.max(...Object.values(countryData), 1);

  // Country code mapping (topojson uses numeric ISO 3166-1 codes)
  const countryCodeMap = {
    'US': '840', // United States
    'CA': '124', // Canada
    'GB': '826', // United Kingdom
    'DE': '276', // Germany
    'FR': '250', // France
    'IT': '380', // Italy
    'ES': '724', // Spain
    'BR': '076', // Brazil
    'RU': '643', // Russia
    'CN': '156', // China
    'IN': '356', // India
    'JP': '392', // Japan
    'AU': '036', // Australia
    'TR': '792', // Turkey
    'EG': '818', // Egypt
    'ZA': '710', // South Africa
    'MX': '484', // Mexico
    'AR': '032', // Argentina
    'KR': '410', // South Korea
    'TH': '764'  // Thailand
  };

  // Get country fill color based on user count
  const getCountryColor = (geoId, geoProperties) => {
    // Find country code by matching topojson numeric ID with our mapping
    const countryCode = Object.keys(countryCodeMap).find(
      key => countryCodeMap[key] === geoId
    );
    
    if (!countryCode || !countryData[countryCode]) {
      return '#f8fafc'; // Default light color
    }
    
    const count = countryData[countryCode];
    const intensity = count / maxCount;
    
    if (intensity > 0.8) return '#ea580c'; // orange-600
    if (intensity > 0.6) return '#f97316'; // orange-500
    if (intensity > 0.4) return '#fb923c'; // orange-400
    if (intensity > 0.2) return '#fdba74'; // orange-300
    return '#fed7aa'; // orange-200
  };

  // Get country name and data
  const getCountryInfo = (geoId, geoProperties) => {
    // Find country code by matching topojson numeric ID with our mapping
    const countryCode = Object.keys(countryCodeMap).find(
      key => countryCodeMap[key] === geoId
    );
    
    if (!countryCode || !countryData[countryCode]) {
      return null;
    }
    
    return {
      code: countryCode,
      name: geoProperties?.name || countryCode,
      count: countryData[countryCode]
    };
  };


  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-stone-400 text-sm">No location data available</div>
          <div className="text-stone-300 text-xs mt-1">User locations will appear here</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="relative h-full">
        <ComposableMap
          projection="geoNaturalEarth1"
          projectionConfig={{
            scale: 140,
            center: [0, 0]
          }}
          width={800}
          height={400}
          className="w-full h-full"
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryInfo = getCountryInfo(geo.id, geo.properties);
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getCountryColor(geo.id, geo.properties)}
                    stroke="#ffffff"
                    strokeWidth={0.5}
                    onMouseEnter={() => {
                      if (countryInfo) {
                        setHoveredCountry(countryInfo.code);
                      }
                    }}
                    onMouseLeave={() => setHoveredCountry(null)}
                    style={{
                      default: { 
                        outline: "none",
                        cursor: countryInfo ? "pointer" : "default"
                      },
                      hover: { 
                        outline: "none", 
                        filter: countryInfo ? "brightness(1.1)" : "none"
                      },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
        
        {/* Hover tooltip */}
        {hoveredCountry && (
          <div className="absolute top-3 left-3 bg-black/80 rounded-md px-2 py-1 pointer-events-none">
            <div className="text-sm font-medium text-white">
              {hoveredCountry}
            </div>
            <div className="text-xs text-gray-300">
              {countryData[hoveredCountry]} users
            </div>
          </div>
        )}
        
        {/* Legend */}
        <div className="absolute bottom-3 left-3 bg-black/70 rounded-md px-2 py-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-200 rounded-full"></div>
            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
            <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
            <span className="text-xs text-white ml-1">Activity</span>
          </div>
        </div>

        {/* Stats overlay */}
        <div className="absolute top-3 right-3 bg-black/80 rounded-md px-3 py-2">
          <div className="text-lg font-bold text-white">
            {Object.values(countryData).reduce((sum, count) => sum + count, 0)}
          </div>
          <div className="text-xs text-gray-300">users</div>
        </div>
      </div>
    </div>
  );
}