import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HistoricalEvent, Theory } from '../types';
import { Eye, AlertTriangle, Users, Shield } from 'lucide-react';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  event: HistoricalEvent;
}

function MapView({ event }: MapViewProps) {
  const map = useMap();
  
  useEffect(() => {
    map.setView([event.location.lat, event.location.lng], event.zoom);
  }, [event, map]);

  return null;
}

interface MapVisualizationProps {
  event: HistoricalEvent;
  theory?: Theory;
  showLens: boolean;
}

// Theory-specific map overlays
function TheoryMapOverlay({ event, theory }: { event: HistoricalEvent; theory: Theory }) {
  if (!theory) return null;

  // Realism/Neorealism: Show power centers and spheres of influence
  if (theory.id === 'classical-realism' || theory.id === 'structural-realism') {
    if (event.id === 'cold-war') {
      return (
        <>
          <Circle
            center={[38.9072, -77.0369]}
            radius={2500000}
            pathOptions={{ 
              color: '#DC2626', 
              fillColor: '#DC2626', 
              fillOpacity: 0.15,
              weight: 3,
              dashArray: '10, 10'
            }}
          />
          <Circle
            center={[55.7558, 37.6173]}
            radius={2500000}
            pathOptions={{ 
              color: '#B91C1C', 
              fillColor: '#B91C1C', 
              fillOpacity: 0.15,
              weight: 3,
              dashArray: '10, 10'
            }}
          />
          <Marker position={[38.9072, -77.0369]}>
            <Popup><strong>US Power Center</strong><br/>Western Sphere of Influence</Popup>
          </Marker>
          <Marker position={[55.7558, 37.6173]}>
            <Popup><strong>Soviet Power Center</strong><br/>Eastern Sphere of Influence</Popup>
          </Marker>
        </>
      );
    }
  }

  // Liberalism: Show cooperation networks and trade routes
  if (theory.id === 'liberalism' || theory.id === 'neoliberalism') {
    if (event.id === 'eu-formation') {
      const cities = [
        [50.8503, 4.3517],  // Brussels
        [48.8566, 2.3522],  // Paris
        [52.5200, 13.4050], // Berlin
        [41.9028, 12.4964], // Rome
        [52.3676, 4.9041],  // Amsterdam
      ];
      
      return (
        <>
          {cities.map((city, i) => (
            <Circle
              key={i}
              center={city as [number, number]}
              radius={300000}
              pathOptions={{ 
                color: '#2563EB', 
                fillColor: '#2563EB', 
                fillOpacity: 0.2,
                weight: 2
              }}
            />
          ))}
          {cities.map((city, i) => 
            cities.slice(i + 1).map((otherCity, j) => (
              <Polyline
                key={`${i}-${j}`}
                positions={[city as [number, number], otherCity as [number, number]]}
                pathOptions={{ color: '#3B82F6', weight: 2, opacity: 0.6 }}
              />
            ))
          )}
        </>
      );
    }
  }

  return null;
}

function MapVisualization({ event, theory, showLens }: MapVisualizationProps) {
  return (
    <div className="relative">
      <div className="p-6 border-b">
        <h3 className="text-2xl font-bold mb-2">{event.name}</h3>
        <p className="text-gray-600">{event.description}</p>
      </div>

      <div className="relative">
        <div className="map-container" style={{ position: 'relative', zIndex: 1 }}>
          <MapContainer
            center={[event.location.lat, event.location.lng]}
            zoom={event.zoom}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapView event={event} />
            
            {showLens && theory && <TheoryMapOverlay event={event} theory={theory} />}
          </MapContainer>

          {/* Lens Overlay - NOW ON TOP WITH HIGHER Z-INDEX */}
          <AnimatePresence>
            {showLens && theory && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: 'none',
                  zIndex: 1000,
                  overflow: 'hidden',
                }}
              >
                {/* Animated lens frame effect */}
                <motion.div
                  initial={{ scale: 3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '90%',
                    height: '90%',
                    transform: 'translate(-50%, -50%)',
                    border: `6px solid ${theory.color}`,
                    borderRadius: '20px',
                    boxShadow: `
                      inset 0 0 60px ${theory.color}40,
                      0 0 40px ${theory.color}60,
                      0 0 80px ${theory.color}30
                    `,
                    background: `
                      radial-gradient(
                        ellipse at center,
                        ${theory.color}05 0%,
                        ${theory.color}10 50%,
                        ${theory.color}20 100%
                      )
                    `,
                  }}
                />

                {/* Corner decorations */}
                {[
                  { top: '10px', left: '10px' },
                  { top: '10px', right: '10px' },
                  { bottom: '10px', left: '10px' },
                  { bottom: '10px', right: '10px' },
                ].map((pos, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: 0 }}
                    animate={{ scale: 1, rotate: 90 * i }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                    style={{
                      position: 'absolute',
                      ...pos,
                      width: '40px',
                      height: '40px',
                      border: `4px solid ${theory.color}`,
                      borderRight: 'none',
                      borderBottom: 'none',
                    }}
                  />
                ))}

                {/* Lens label with icon */}
                <motion.div
                  initial={{ y: -100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="absolute top-4 left-1/2 transform -translate-x-1/2"
                  style={{ pointerEvents: 'auto' }}
                >
                  <div 
                    className="bg-white/95 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl border-3 flex items-center space-x-3"
                    style={{ borderColor: theory.color, borderWidth: '3px' }}
                  >
                    <Eye className="w-6 h-6" style={{ color: theory.color }} />
                    <span className="font-bold text-lg" style={{ color: theory.color }}>
                      {theory.shortName} Perspective
                    </span>
                  </div>
                </motion.div>

                {/* Theory-specific visual indicators */}
                {(theory.id === 'classical-realism' || theory.id === 'structural-realism') && (
                  <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    className="absolute top-20 left-4 bg-red-50/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border-2 border-red-600"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <div className="flex items-center space-x-2 text-red-800">
                      <Shield className="w-5 h-5" />
                      <span className="font-semibold text-sm">Focus: Power & Security</span>
                    </div>
                  </motion.div>
                )}

                {(theory.id === 'liberalism' || theory.id === 'neoliberalism') && (
                  <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    className="absolute top-20 left-4 bg-blue-50/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border-2 border-blue-600"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <div className="flex items-center space-x-2 text-blue-800">
                      <Users className="w-5 h-5" />
                      <span className="font-semibold text-sm">Focus: Cooperation & Institutions</span>
                    </div>
                  </motion.div>
                )}

                {theory.id === 'english-school' && (
                  <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    className="absolute top-20 left-4 bg-green-50/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border-2 border-green-600"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <div className="flex items-center space-x-2 text-green-800">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-semibold text-sm">Focus: Norms & Diplomacy</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {theory && showLens && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 border-t"
          style={{ backgroundColor: `${theory.color}05` }}
        >
          <h4 className="font-bold text-lg mb-2">Key Principles of {theory.shortName}:</h4>
          <ul className="space-y-1">
            {theory.keyPrinciples.slice(0, 3).map((principle, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                {principle}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}

export default MapVisualization;
