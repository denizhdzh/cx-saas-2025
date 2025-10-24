import React, { useState, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker
} from 'react-simple-maps';

// World map topology URL - Using a better source with ISO codes
const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

// Country name to ISO code mapping (for fallback)
const countryNameToISO = {
  // Americas
  'United States of America': 'US', 'United States': 'US', 'USA': 'US',
  'Canada': 'CA',
  'Mexico': 'MX',
  'Brazil': 'BR',
  'Argentina': 'AR',
  'Chile': 'CL',
  'Colombia': 'CO',
  'Peru': 'PE',
  'Venezuela': 'VE',
  'Ecuador': 'EC',
  'Bolivia': 'BO',
  'Paraguay': 'PY',
  'Uruguay': 'UY',
  'Costa Rica': 'CR',
  'Panama': 'PA',
  'Guatemala': 'GT',
  'Cuba': 'CU',
  'Dominican Republic': 'DO',
  'Puerto Rico': 'PR',

  // Europe
  'United Kingdom': 'GB', 'England': 'GB', 'Scotland': 'GB', 'Wales': 'GB',
  'Ireland': 'IE',
  'France': 'FR',
  'Germany': 'DE',
  'Spain': 'ES',
  'Italy': 'IT',
  'Netherlands': 'NL',
  'Belgium': 'BE',
  'Switzerland': 'CH',
  'Austria': 'AT',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Denmark': 'DK',
  'Finland': 'FI',
  'Poland': 'PL',
  'Portugal': 'PT',
  'Greece': 'GR',
  'Turkey': 'TR',
  'Czech Republic': 'CZ', 'Czechia': 'CZ',
  'Romania': 'RO',
  'Hungary': 'HU',
  'Bulgaria': 'BG',
  'Serbia': 'RS',
  'Croatia': 'HR',
  'Ukraine': 'UA',
  'Russia': 'RU', 'Russian Federation': 'RU',
  'Belarus': 'BY',
  'Slovakia': 'SK',
  'Slovenia': 'SI',
  'Lithuania': 'LT',
  'Latvia': 'LV',
  'Estonia': 'EE',
  'Iceland': 'IS',
  'Luxembourg': 'LU',
  'Malta': 'MT',
  'Cyprus': 'CY',

  // Asia
  'China': 'CN', "People's Republic of China": 'CN',
  'India': 'IN',
  'Japan': 'JP',
  'South Korea': 'KR', 'Korea': 'KR', 'Republic of Korea': 'KR',
  'Indonesia': 'ID',
  'Thailand': 'TH',
  'Vietnam': 'VN', 'Viet Nam': 'VN',
  'Philippines': 'PH',
  'Malaysia': 'MY',
  'Singapore': 'SG',
  'Pakistan': 'PK',
  'Bangladesh': 'BD',
  'Myanmar': 'MM', 'Burma': 'MM',
  'Taiwan': 'TW',
  'Hong Kong': 'HK',
  'Macao': 'MO',
  'Cambodia': 'KH',
  'Laos': 'LA',
  'Nepal': 'NP',
  'Sri Lanka': 'LK',
  'Afghanistan': 'AF',
  'Kazakhstan': 'KZ',
  'Uzbekistan': 'UZ',
  'Mongolia': 'MN',

  // Middle East
  'Saudi Arabia': 'SA',
  'United Arab Emirates': 'AE', 'UAE': 'AE',
  'Israel': 'IL',
  'Iran': 'IR',
  'Iraq': 'IQ',
  'Jordan': 'JO',
  'Lebanon': 'LB',
  'Syria': 'SY',
  'Yemen': 'YE',
  'Oman': 'OM',
  'Kuwait': 'KW',
  'Qatar': 'QA',
  'Bahrain': 'BH',

  // Africa
  'Egypt': 'EG',
  'South Africa': 'ZA',
  'Nigeria': 'NG',
  'Kenya': 'KE',
  'Morocco': 'MA',
  'Algeria': 'DZ',
  'Tunisia': 'TN',
  'Libya': 'LY',
  'Ethiopia': 'ET',
  'Ghana': 'GH',
  'Tanzania': 'TZ',
  'Uganda': 'UG',
  'Zimbabwe': 'ZW',
  'Angola': 'AO',
  'Mozambique': 'MZ',
  'Cameroon': 'CM',
  'Sudan': 'SD',

  // Oceania
  'Australia': 'AU',
  'New Zealand': 'NZ',
  'Papua New Guinea': 'PG',
  'Fiji': 'FJ',

  // Overseas Territories & Dependencies
  // French territories
  'French Guiana': 'FR',
  'Martinique': 'FR',
  'Guadeloupe': 'FR',
  'Réunion': 'FR',
  'Mayotte': 'FR',
  'French Polynesia': 'FR',
  'New Caledonia': 'FR',
  'Saint Martin': 'FR',
  'Saint Barthélemy': 'FR',
  'Saint Pierre and Miquelon': 'FR',
  'Wallis and Futuna': 'FR',
  'French Southern and Antarctic Lands': 'FR',

  // British territories
  'Gibraltar': 'GB',
  'Bermuda': 'GB',
  'Cayman Islands': 'GB',
  'British Virgin Islands': 'GB',
  'Turks and Caicos Islands': 'GB',
  'Falkland Islands': 'GB',
  'South Georgia and the South Sandwich Islands': 'GB',
  'British Indian Ocean Territory': 'GB',
  'Pitcairn Islands': 'GB',
  'Saint Helena': 'GB',
  'Ascension Island': 'GB',
  'Tristan da Cunha': 'GB',
  'Anguilla': 'GB',
  'Montserrat': 'GB',

  // US territories
  'Guam': 'US',
  'U.S. Virgin Islands': 'US',
  'American Samoa': 'US',
  'Northern Mariana Islands': 'US',

  // Danish territories
  'Greenland': 'DK',
  'Faroe Islands': 'DK',

  // Dutch territories
  'Aruba': 'NL',
  'Curaçao': 'NL',
  'Sint Maarten': 'NL',
  'Caribbean Netherlands': 'NL',
  'Bonaire': 'NL',
  'Saba': 'NL',
  'Sint Eustatius': 'NL',

  // Norwegian territories
  'Svalbard and Jan Mayen': 'NO',
  'Bouvet Island': 'NO',

  // Australian territories
  'Christmas Island': 'AU',
  'Cocos Islands': 'AU',
  'Norfolk Island': 'AU',

  // New Zealand territories
  'Cook Islands': 'NZ',
  'Niue': 'NZ',
  'Tokelau': 'NZ',

  // Chinese territories
  'Macau': 'CN',
  'Macao': 'CN',

  // Other
  'Vatican City': 'IT',
  'San Marino': 'IT',
  'Monaco': 'FR',
  'Andorra': 'AD',
  'Liechtenstein': 'LI',
  'Kosovo': 'XK',
  'Palestine': 'PS',
  'Western Sahara': 'EH'
};

export default function UserWorldMap({ data }) {
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark') || mediaQuery.matches);

    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Listen for system theme changes
    mediaQuery.addEventListener('change', checkDark);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', checkDark);
    };
  }, []);
  
  // Transform data to country codes and counts
  const countryData = data.reduce((acc, item) => {
    // Use countryCode (2-letter ISO) from data - ensure uppercase
    const countryCode = (item.countryCode || item.country || 'unknown').toUpperCase();
    acc[countryCode] = (acc[countryCode] || 0) + (item.count || 1);
    return acc;
  }, {});

  // Get max count for scaling colors
  const maxCount = Math.max(...Object.values(countryData), 1);

  // Get country fill color based on user count
  const getCountryColor = (geoProperties) => {
    const countryName = geoProperties.NAME || geoProperties.name;

    // Try to get country code from multiple sources
    let countryCode = geoProperties.ISO_A2 || geoProperties.iso_a2 || geoProperties.ISO_A2_EH;

    // Fallback: Use country name to ISO mapping
    if (!countryCode) {
      countryCode = countryNameToISO[countryName];
    }

    if (!countryCode || !countryData[countryCode]) {
      return isDark ? '#44403c' : '#d6d3d1'; // stone-700 dark : stone-300 light
    }

    const count = countryData[countryCode];
    const intensity = count / maxCount;

    // Violet gradient based on intensity
    if (isDark) {
      if (intensity > 0.8) return '#f97316'; // violet-400
      if (intensity > 0.6) return '#f97316cc'; // violet-400 80%
      if (intensity > 0.4) return '#f9731699'; // violet-400 60%
      if (intensity > 0.2) return '#f9731666'; // violet-400 40%
      return '#f9731633'; // violet-400 20%
    } else {
      if (intensity > 0.8) return '#f97316'; // violet-500
      if (intensity > 0.6) return '#f97316cc'; // violet-500 80%
      if (intensity > 0.4) return '#f9731699'; // violet-500 60%
      if (intensity > 0.2) return '#f9731666'; // violet-500 40%
      return '#f9731633'; // violet-500 20%
    }
  };

  // Get country name and data
  const getCountryInfo = (geoProperties) => {
    // Try to get country code from multiple sources
    let countryCode = geoProperties.ISO_A2 || geoProperties.iso_a2 || geoProperties.ISO_A2_EH;

    // Fallback: Use country name to ISO mapping
    if (!countryCode) {
      const countryName = geoProperties.NAME || geoProperties.name;
      countryCode = countryNameToISO[countryName];
    }

    if (!countryCode || !countryData[countryCode]) {
      return null;
    }

    return {
      code: countryCode,
      name: geoProperties?.NAME || geoProperties?.name || countryCode,
      count: countryData[countryCode]
    };
  };


  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-stone-400 dark:text-stone-500 text-sm">Not enough data yet</div>
          <div className="text-stone-300 dark:text-stone-600 text-xs mt-1">Start getting conversations to see insights</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full" key={isDark ? 'dark' : 'light'}>
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
                const countryInfo = getCountryInfo(geo.properties);

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getCountryColor(geo.properties)}
                    stroke={isDark ? '#57534e' : '#ffffff'}
                    strokeWidth={0.5}
                    onMouseEnter={() => {
                      if (countryInfo) {
                        setHoveredCountry(countryInfo);
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
          <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm rounded-md px-3 py-2 pointer-events-none">
            <div className="text-sm font-medium text-white">
              {hoveredCountry.name}
            </div>
            <div className="text-xs text-gray-300">
              {hoveredCountry.count} users
            </div>
          </div>
        )}
        
        {/* Legend */}
        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm rounded-md px-2 py-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: isDark ? '#f9731633' : '#f9731633' }}></div>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: isDark ? '#f9731699' : '#f9731699' }}></div>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: isDark ? '#f97316' : '#f97316' }}></div>
            <span className="text-xs text-white ml-1">Activity</span>
          </div>
        </div>

        {/* Stats overlay */}
        <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm rounded-md px-3 py-2">
          <div className="text-lg font-bold text-white">
            {Object.values(countryData).reduce((sum, count) => sum + count, 0)}
          </div>
          <div className="text-xs text-gray-300">users</div>
        </div>
      </div>
    </div>
  );
}