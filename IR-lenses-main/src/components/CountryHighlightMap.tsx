import { useEffect } from 'react';
import { CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import { CountryInfo } from '../data/countries';
import { Theory } from '../types';
import { MapPin } from 'lucide-react';

interface CountryHighlightMapProps {
  country: CountryInfo;
  event: string;
  theory?: Theory;
}

function MapZoomController({ country }: { country: CountryInfo }) {
  const map = useMap();
  
  useEffect(() => {
    map.flyTo(country.position, 6, {
      duration: 1.5,
      easeLinearity: 0.25
    });
  }, [country, map]);

  return null;
}

function CountryHighlightMap({ country, event, theory }: CountryHighlightMapProps) {
  const eventData = country.events[event];
  if (!eventData) return null;

  const theoryKey = theory?.id as keyof typeof eventData.perspectives;
  const analysis = theoryKey ? eventData.perspectives[theoryKey] : null;

  return (
    <>
      <MapZoomController country={country} />
      
      {/* Country Marker with Pulse Animation */}
      <CircleMarker
        center={country.position}
        radius={20}
        pathOptions={{
          fillColor: theory?.color || '#3B82F6',
          fillOpacity: 0.6,
          color: theory?.color || '#3B82F6',
          weight: 4,
        }}
        className="country-highlight-marker"
      >
        <Tooltip permanent direction="top" offset={[0, -25]}>
          <div className="font-serif font-bold">{country.name}</div>
        </Tooltip>
        
        <Popup maxWidth={350} className="elegant-popup">
          <div className="font-serif">
            <div className="flex items-center mb-3 pb-2 border-b border-gray-200">
              <MapPin className="w-5 h-5 mr-2" style={{ color: theory?.color || '#3B82F6' }} />
              <strong className="text-xl text-gray-900">{country.name}</strong>
            </div>
            
            <div className="space-y-3 text-sm">
              <div>
                <strong className="text-gray-600">Region:</strong>
                <span className="ml-2 text-gray-800">{country.region}</span>
              </div>
              
              <div>
                <strong className="text-gray-600">Role:</strong>
                <p className="mt-1 text-gray-800 italic">{eventData.role}</p>
              </div>

              {theory && analysis && (
                <div 
                  className="p-3 rounded border-l-3"
                  style={{ 
                    backgroundColor: `${theory.color}10`,
                    borderColor: theory.color
                  }}
                >
                  <p className="text-xs uppercase tracking-wide font-semibold mb-1" style={{ color: theory.color }}>
                    {theory.shortName} Analysis
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    {analysis.length > 150 ? analysis.substring(0, 150) + '...' : analysis}
                  </p>
                  <p className="text-xs text-gray-500 mt-2 italic">
                    See full analysis in side panel →
                  </p>
                </div>
              )}
            </div>
          </div>
        </Popup>
      </CircleMarker>

      {/* Pulsing Circle Around Country */}
      <CircleMarker
        center={country.position}
        radius={35}
        pathOptions={{
          fillColor: 'transparent',
          color: theory?.color || '#3B82F6',
          weight: 3,
          opacity: 0.4,
          dashArray: '5, 10'
        }}
        className="country-pulse-circle"
      />
    </>
  );
}

export default CountryHighlightMap;

