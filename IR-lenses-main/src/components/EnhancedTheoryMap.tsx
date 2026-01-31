import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap, CircleMarker, Tooltip } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import { Theory, HistoricalEvent } from '../types';
import { Eye, Shield, Users, Building, Globe2, Scale, BookOpen, Swords, Radiation, Landmark, FileText, Target, Network, TrendingUp, Zap } from 'lucide-react';
import { coldWarMapData, wwiMapData, euFormationMapData, cubanMissileMapData, unFormationMapData } from '../data/mapOverlayData';
import { CountryInfo } from '../data/countries';
import { TimelinePoint } from '../data/timelineData';
import { useEffect, useState, useRef } from 'react';
import MapControls from './MapControls';
import CountryHighlightMap from './CountryHighlightMap';
import EventDetailCard from './EventDetailCard';

// Coordinate normalization helper - prevents NaN LatLng errors
function normLL(v: any): [number, number] | null {
  if (!v) return null;
  const lat = Number(Array.isArray(v) ? v[0] : v.lat);
  const lng = Number(Array.isArray(v) ? v[1] : v.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
}

// Professional custom icons using SVG
const createIcon = (type: string, color: string) => {
  const iconMap: { [key: string]: string } = {
    'military': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M14.5 2H9.5L7 7l5 3 5-3-2.5-5z"/><path d="M12 10v12"/><path d="m8 14 4 4 4-4"/></svg>',
    'nuclear': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="3"/></svg>',
    'institution': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="m3 21 18-18M3 21h18M3 3h.01"/><path d="M12 3v18"/><path d="M12 3h.01"/></svg>',
    'treaty': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6"/></svg>',
    'bank': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    'law': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z"/></svg>',
    'trade': '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12h3"/></svg>',
  };
  
  const svgIcon = iconMap[type] || iconMap['military'];
  
  return L.divIcon({
    className: 'professional-marker',
    html: `<div style="background: ${color}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 3px 10px rgba(0,0,0,0.4);">${svgIcon}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

interface MapControllerProps {
  event: HistoricalEvent;
  timelineEvent?: TimelinePoint;
  shouldZoom?: boolean;
}

function MapController({ event, timelineEvent }: MapControllerProps) {
  const map = useMap();
  
  // Cinematic zoom to timeline event location with safe coordinates
  useEffect(() => {
    // Safely extract base location
    let baseLat = 0;
    let baseLng = 0;
    let baseZoom = 2;

    if (event && event.location) {
      baseLat = Number(event.location.lat);
      baseLng = Number(event.location.lng);
      baseZoom = Number(event.zoom) || 2;
    }

    const base: [number, number] = [
      Number.isFinite(baseLat) ? baseLat : 0,
      Number.isFinite(baseLng) ? baseLng : 0
    ];
    
    const focus = normLL(timelineEvent?.focusLocation) || null;
    const zoom = Number(timelineEvent?.focusZoom) || baseZoom;

    console.log('MapController - focus:', focus, 'zoom:', zoom);

    // ONLY fly if we have valid focus coordinates
    if (focus && focus[0] !== 0 && focus[1] !== 0 && Number.isFinite(focus[0]) && Number.isFinite(focus[1])) {
      console.log('Flying to:', focus);
      map.flyTo(focus, zoom, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    } else if (base[0] !== 0 || base[1] !== 0) {
      console.log('Setting view to base:', base);
      map.setView(base, zoom);
    }
    // If both are [0,0], do nothing (avoid flying to null island)
  }, [event, timelineEvent, map]);

  return null;
}

interface EnhancedTheoryMapProps {
  event: HistoricalEvent;
  theory?: Theory;
  showLens: boolean;
  selectedCountry?: CountryInfo | null;
  currentTimelineEvent?: TimelinePoint;
  shouldZoom?: boolean;
}

function EnhancedTheoryMap({ event, theory, showLens, selectedCountry, currentTimelineEvent, shouldZoom }: EnhancedTheoryMapProps) {
  const [mounted, setMounted] = useState(false);
  const [activeEventLocation, setActiveEventLocation] = useState<[number, number] | null>(null);
  const [focusedEvent, setFocusedEvent] = useState<TimelinePoint | null>(null);
  const focusedMarkerRef = useRef<any>(null);
  const currentOpenPopupRef = useRef<any>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Debug logging
  useEffect(() => {
    console.log('EnhancedTheoryMap received event:', event);
    console.log('Event location:', event?.location);
    console.log('Event lat/lng:', event?.location?.lat, event?.location?.lng);
  }, [event]);

  // Client-side only rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Map resize handler
  useEffect(() => {
    if (!mounted) return;
    const onResize = () => mapRef.current?.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [mounted]);

  // Timeline event changed - update focus with coordinate validation
  useEffect(() => {
    const focus = normLL(currentTimelineEvent?.focusLocation);
    
    if (!focus) {
      console.warn('Bad or missing focusLocation for event:', currentTimelineEvent);
      setActiveEventLocation(null);
      setFocusedEvent(null);
      return;
    }
    
    setActiveEventLocation(focus);
    setFocusedEvent(currentTimelineEvent!);
    
    // NO setTimeout that clears this - it persists!
  }, [currentTimelineEvent]);

  // When focused event changes, manage popup (one at a time)
  useEffect(() => {
    if (!mounted || !focusedMarkerRef.current || !activeEventLocation) return;

    // Close any currently open popup
    if (currentOpenPopupRef.current) {
      try {
        currentOpenPopupRef.current.remove();
      } catch (e) {
        // Popup already closed
      }
      currentOpenPopupRef.current = null;
    }

    // Open the new event's popup after map animation
    const timer = setTimeout(() => {
      if (focusedMarkerRef.current && focusedMarkerRef.current.openPopup) {
        try {
          focusedMarkerRef.current.openPopup();
          const popup = focusedMarkerRef.current.getPopup();
          if (popup) {
            currentOpenPopupRef.current = popup;
          }
        } catch (e) {
          console.error('Failed to open popup:', e);
        }
      }
    }, 1600);

    return () => clearTimeout(timer);
  }, [mounted, focusedEvent, activeEventLocation]);
  // Get appropriate map data based on event
  const getMapData = () => {
    switch(event.id) {
      case 'cold-war':
        return coldWarMapData;
      case 'wwi':
        return wwiMapData;
      case 'eu-formation':
        return euFormationMapData;
      case 'cuban-missile-crisis':
        return cubanMissileMapData;
      case 'un-formation':
        return unFormationMapData;
      default:
        return null;
    }
  };

  const mapData: any = getMapData();
  
  // Client-side only guard
  if (!mounted) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 font-serif">Loading map...</div>
      </div>
    );
  }

  if (!mapData) {
    return (
      <div className="h-full w-full p-8 text-center text-gray-600 font-serif flex items-center justify-center">
        <div>
          <p className="mb-2">Enhanced visualization coming soon for this event.</p>
          <p className="text-sm">Currently available for: Cold War, WWI, EU Formation, Cuban Missile Crisis, UN Formation</p>
        </div>
      </div>
    );
  }

  // Safe base center for MapContainer
  const baseLat = event && event.location ? Number(event.location.lat) : 0;
  const baseLng = event && event.location ? Number(event.location.lng) : 0;
  const baseCenter: [number, number] = [
    Number.isFinite(baseLat) ? baseLat : 0,
    Number.isFinite(baseLng) ? baseLng : 0
  ];
  const baseZoom = event && event.zoom ? Number(event.zoom) : 2;

  return (
    <div className="relative h-full w-full">
      <MapContainer
        ref={(mapInstance) => {
          if (mapInstance) {
            mapRef.current = mapInstance;
            setTimeout(() => mapInstance.invalidateSize(), 0);
          }
        }}
        center={baseCenter}
        zoom={baseZoom}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController event={event} timelineEvent={currentTimelineEvent} shouldZoom={shouldZoom} />

          {/* Map Controls - Compass and Scale */}
          {showLens && <MapControls />}

          {/* Persistent Event Marker with Detail Card - Cold War Realism Only */}
          {activeEventLocation && focusedEvent && event.id === 'cold-war' && (theory?.id === 'classical-realism' || theory?.id === 'structural-realism') && (
            <>
              <CircleMarker
                ref={focusedMarkerRef}
                center={activeEventLocation}
                radius={18}
                pathOptions={{
                  fillColor: focusedEvent.eventType === 'military' ? '#DC2626' :
                            focusedEvent.eventType === 'diplomatic' ? '#2563EB' :
                            focusedEvent.eventType === 'economic' ? '#10B981' :
                            focusedEvent.eventType === 'ideological' ? '#F59E0B' : '#6B7280',
                  fillOpacity: 0.8,
                  color: '#FFFFFF',
                  weight: 3,
                }}
                className="persistent-event-marker"
                eventHandlers={{
                  popupopen: (e: any) => {
                    // Track this as currently open
                    if (e.popup) {
                      currentOpenPopupRef.current = e.popup;
                    }
                  },
                  popupclose: () => {
                    // Clear reference when user manually closes
                    if (currentOpenPopupRef.current) {
                      currentOpenPopupRef.current = null;
                    }
                  }
                }}
              >
                <Popup 
                  autoClose={false}
                  closeOnClick={false}
                  closeButton={true}
                  keepInView={true}
                  maxWidth={360}
                  className="event-detail-popup"
                >
                  <EventDetailCard
                    title={focusedEvent.title}
                    type={focusedEvent.eventType}
                    placeName={getEventPlaceName(focusedEvent)}
                    country={getEventCountry(focusedEvent)}
                    years={focusedEvent.year}
                    coordinates={{
                      lat: focusedEvent.focusLocation?.[0] || 0,
                      lng: focusedEvent.focusLocation?.[1] || 0
                    }}
                    realistAnalysis={getRealistAnalysis(focusedEvent)}
                    showCloseButton={false}
                  />
                </Popup>
              </CircleMarker>
              
              {/* Glowing halo - continuous until event changes */}
              <CircleMarker
                center={activeEventLocation}
                radius={28}
                pathOptions={{
                  fillColor: 'transparent',
                  color: focusedEvent.eventType === 'military' ? '#DC2626' :
                        focusedEvent.eventType === 'diplomatic' ? '#2563EB' :
                        focusedEvent.eventType === 'economic' ? '#10B981' :
                        focusedEvent.eventType === 'ideological' ? '#F59E0B' : '#6B7280',
                  weight: 2,
                  opacity: 0.5,
                }}
                className="timeline-event-glow"
              />
            </>
          )}

          {/* Selected Country Highlight */}
          {selectedCountry && (
            <CountryHighlightMap
              country={selectedCountry}
              event={event.id}
              theory={theory}
            />
          )}

          {/* REALISM OVERLAYS */}
          {(theory?.id === 'classical-realism' || theory?.id === 'structural-realism') && showLens && 'realism' in mapData && mapData.realism && (
            <>
              {/* REMOVED: Alliance borders and connection lines for cleaner map */}
              {/* Focus on event markers only */}

              {/* Military bases */}
              {mapData.realism.militaryBases.map((base: any, idx: number) => {
                const pos = normLL(base.position);
                if (!pos) return null;
                return (
                <Marker
                  key={`base-${idx}`}
                  position={pos}
                  icon={createIcon(base.type === 'nuclear-site' ? 'nuclear' : 'military', base.country === 'USA' ? '#2563EB' : '#DC2626')}
                >
                  <Popup className="elegant-popup" maxWidth={300}>
                    <div className="font-serif">
                      <div className="flex items-center mb-3 pb-2 border-b border-gray-200">
                        <Shield className="w-5 h-5 mr-2" style={{ color: base.country === 'USA' ? '#2563EB' : '#DC2626' }} />
                        <strong className="text-lg text-gray-900">{base.name}</strong>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-semibold text-gray-800">{base.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Nation:</span>
                          <span className="font-semibold text-gray-800">{base.country}</span>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-gray-50 rounded border-l-3" style={{ borderColor: base.country === 'USA' ? '#2563EB' : '#DC2626' }}>
                        <p className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-1">Realist Analysis</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{base.tooltip}</p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
                );
              })}

              {/* Spheres of influence */}
              {'realism' in mapData && mapData.realism.spheresOfInfluence?.map((sphere: any, idx: number) => {
                const center = normLL(sphere.center);
                if (!center) return null;
                return (
                <Circle
                  key={`sphere-${idx}`}
                  center={center}
                  radius={sphere.radius}
                  pathOptions={{
                    color: sphere.color,
                    fillColor: sphere.color,
                    fillOpacity: 0.06,
                    weight: 2,
                    dashArray: '12, 8',
                    opacity: 0.5
                  }}
                  className="sphere-influence"
                >
                  <Tooltip direction="top" permanent offset={[0, -20]} className="elegant-tooltip">
                    <span className="text-xs font-serif">{sphere.label}</span>
                  </Tooltip>
                </Circle>
                );
              })}

              {/* REMOVED: Attack vectors for cleaner visualization */}
              {/* Lines removed to focus on event locations */}
            </>
          )}

          {/* LIBERALISM OVERLAYS */}
          {theory?.id === 'liberalism' && showLens && 'liberalism' in mapData && mapData.liberalism && (
            <>
              {/* International institutions */}
              {mapData.liberalism.institutions?.map((inst: any, idx: number) => {
                const pos = normLL(inst.location);
                if (!pos) return null;
                const iconType = inst.name.includes('Bank') ? 'bank' : 
                                inst.name.includes('UN') ? 'institution' :
                                inst.name.includes('IMF') ? 'bank' : 'law';
                return (
                <Marker
                  key={`inst-${idx}`}
                  position={pos}
                  icon={createIcon(iconType, '#3B82F6')}
                >
                  <Popup className="elegant-popup" maxWidth={320}>
                    <div className="font-serif">
                      <div className="flex items-center mb-3 pb-2 border-b border-gray-200">
                        <Building className="w-5 h-5 mr-2 text-blue-600" />
                        <strong className="text-lg text-gray-900">{inst.name}</strong>
                      </div>
                      <div className="space-y-2 text-sm mb-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Established:</span>
                          <span className="font-semibold text-gray-800">{inst.founded}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Member States:</span>
                          <span className="font-semibold text-gray-800">{inst.members}</span>
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded border-l-3 border-blue-600">
                        <p className="text-xs uppercase tracking-wide font-semibold text-blue-900 mb-1.5">Liberal Analysis</p>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Institutions reduce transaction costs, provide information, and enable monitoring. 
                          They facilitate cooperation by creating expectations and reducing uncertainty under anarchy.
                        </p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
                );
              })}

              {/* Trade routes */}
              {'liberalism' in mapData && mapData.liberalism.tradeRoutes?.map((route: any, idx: number) => {
                const from = normLL(route.from);
                const to = normLL(route.to);
                if (!from || !to) return null;
                return (
                <Polyline
                  key={`trade-${idx}`}
                  positions={[from, to]}
                  pathOptions={{
                    color: '#10B981',
                    weight: Math.max(route.volume / 3, 1.5),
                    opacity: 0.5,
                  }}
                  className="trade-route"
                >
                  <Tooltip><TrendingUp className="inline w-3 h-3" /> {route.tooltip}</Tooltip>
                  <Popup>
                    <div className="text-sm">
                      <strong className="text-green-700">Economic Interdependence</strong>
                      <br />
                      {route.tooltip}
                      <br /><br />
                      <strong className="text-blue-700">Liberal Theory:</strong>
                      <br />
                      Trade creates mutual dependence, making conflict costly. Peace through commerce!
                    </div>
                  </Popup>
                </Polyline>
                );
              })}

              {/* Democratic countries */}
              {'liberalism' in mapData && mapData.liberalism.democraticCountries?.map((pos: any, idx: number) => (
                <CircleMarker
                  key={`democracy-${idx}`}
                  center={pos as [number, number]}
                  radius={12}
                  pathOptions={{
                    fillColor: '#3B82F6',
                    fillOpacity: 0.6,
                    color: '#1E40AF',
                    weight: 2
                  }}
                >
                  <Tooltip><Shield className="inline w-3 h-3" /> Democratic State</Tooltip>
                  <Popup>
                    <strong className="text-blue-700">Democratic Peace Zone</strong>
                    <br />
                    Democracies rarely fight each other!
                  </Popup>
                </CircleMarker>
              ))}
            </>
          )}

          {/* NEOLIBERALISM OVERLAYS */}
          {theory?.id === 'neoliberalism' && showLens && 'neoliberalism' in mapData && mapData.neoliberalism && (
            <>
              {/* Treaties and regimes */}
              {mapData.neoliberalism.treaties?.map((treaty: any, idx: number) => (
                <Marker
                  key={`treaty-${idx}`}
                  position={treaty.location as [number, number]}
                  icon={createIcon('treaty', '#6366F1')}
                >
                  <Popup>
                    <div className="text-sm">
                      <strong className="text-lg">{treaty.name}</strong>
                      <br />
                      <div className="text-gray-600">Signatories: {treaty.signatories}</div>
                      <div className="mt-2">{treaty.tooltip}</div>
                      <div className="mt-2 p-2 bg-indigo-50 rounded">
                        <strong className="text-indigo-700">Neoliberal Insight:</strong>
                        <br />
                        Regimes create expectations, reduce cheating, and enable cooperation under anarchy.
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Cooperation zones */}
              {'neoliberalism' in mapData && mapData.neoliberalism.cooperationZones?.map((zone: any, idx: number) => (
                <Circle
                  key={`coop-${idx}`}
                  center={zone.center as [number, number]}
                  radius={zone.radius}
                  pathOptions={{
                    color: zone.color,
                    fillColor: zone.color,
                    fillOpacity: 0.15,
                    weight: 2,
                    dashArray: '5, 5'
                  }}
                >
                  <Tooltip><strong>{zone.label}</strong></Tooltip>
                </Circle>
              ))}
            </>
          )}

          {/* CONSTRUCTIVISM OVERLAYS */}
          {theory?.id === 'constructivism' && showLens && 'constructivism' in mapData && mapData.constructivism && (
            <>
              {/* Ideological zones */}
              {mapData.constructivism.ideologicalZones?.map((zone: any, idx: number) => (
                <div key={`zone-${idx}`}>
                  {zone.countries.map((pos: any, i: number) => (
                    <CircleMarker
                      key={`ideology-${idx}-${i}`}
                      center={pos as [number, number]}
                      radius={18}
                      pathOptions={{
                        fillColor: zone.color,
                        fillOpacity: 0.5,
                        color: zone.color,
                        weight: 3
                      }}
                    >
                      <Popup>
                        <div className="text-sm">
                          <strong>{zone.name}</strong>
                          <br />
                          Ideology: {zone.ideology}
                          <br /><br />
                          <strong className="text-yellow-700">Constructivist View:</strong>
                          <br />
                          Identity shapes interests. {zone.ideology} worldview determines what threats look like.
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </div>
              ))}

              {/* Norm diffusion arrows */}
              {'constructivism' in mapData && mapData.constructivism.normDiffusion?.map((diffusion: any, idx: number) => (
                <Polyline
                  key={`norm-${idx}`}
                  positions={[diffusion.from as [number, number], diffusion.to as [number, number]]}
                  pathOptions={{
                    color: diffusion.type === 'democracy' ? '#3B82F6' : 
                           diffusion.type === 'ideology' ? '#DC2626' : '#10B981',
                    weight: 4,
                    opacity: 0.7,
                  }}
                >
                  <Tooltip><Network className="inline w-3 h-3" /> {diffusion.type}</Tooltip>
                  <Popup>
                    <div className="text-sm">
                      <strong>Norm/Idea Diffusion</strong>
                      <br />
                      {diffusion.tooltip}
                      <br /><br />
                      <strong className="text-yellow-700">Constructivist Insight:</strong>
                      <br />
                      Ideas and norms spread through socialization and interaction.
                    </div>
                  </Popup>
                </Polyline>
              ))}
            </>
          )}

          {/* NEOREALISM OVERLAYS */}
          {theory?.id === 'structural-realism' && showLens && 'neorealism' in mapData && mapData.neorealism && (
            <>
              {/* Bipolar structure */}
              {mapData.neorealism.polarityStructure?.poles.map((pole: any, idx: number) => (
                <CircleMarker
                  key={`pole-${idx}`}
                  center={pole.position as [number, number]}
                  radius={25}
                  pathOptions={{
                    fillColor: '#DC2626',
                    fillOpacity: 0.7,
                    color: '#7F1D1D',
                    weight: 4
                  }}
                >
                  <Tooltip permanent direction="top">
                    <strong><Zap className="inline w-4 h-4" /> {pole.label}</strong>
                    <br />
                    Power: {pole.power}/100
                  </Tooltip>
                  <Popup>
                    <div className="text-sm">
                      <strong className="text-lg">{pole.label}</strong>
                      <br />
                      System Power: {pole.power}/100
                      <br /><br />
                      <strong className="text-red-700">Neorealist Structure:</strong>
                      <br />
                      Bipolar system - Two dominant powers create stability through clarity.
                      Each pole must balance the other.
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

              {/* Buffer states */}
              {'neorealism' in mapData && mapData.neorealism.polarityStructure?.bufferStates?.map((buffer: any, idx: number) => (
                <CircleMarker
                  key={`buffer-${idx}`}
                  center={buffer.position as [number, number]}
                  radius={10}
                  pathOptions={{
                    fillColor: '#F59E0B',
                    fillOpacity: 0.7,
                    color: '#D97706',
                    weight: 2
                  }}
                >
                  <Tooltip><Target className="inline w-3 h-3" /> {buffer.name} (Neutral)</Tooltip>
                  <Popup>
                    <div className="text-sm">
                      <strong>{buffer.name} - Buffer State</strong>
                      <br />
                      {buffer.tooltip}
                      <br /><br />
                      <strong className="text-red-700">Neorealist Role:</strong>
                      <br />
                      Buffer states reduce direct confrontation between poles, stabilizing bipolar system.
                    </div>
                  </Popup>
                </CircleMarker>
              ))}

              {/* Regional subsystems */}
              {'neorealism' in mapData && mapData.neorealism.polarityStructure?.regionalSubsystems?.map((region: any, idx: number) => (
                <Circle
                  key={`region-${idx}`}
                  center={region.center as [number, number]}
                  radius={region.radius}
                  pathOptions={{
                    color: '#DC2626',
                    fillColor: '#FEE2E2',
                    fillOpacity: 0.2,
                    weight: 2,
                    dashArray: '15, 10'
                  }}
                >
                  <Tooltip>
                    <strong>{region.label}</strong>
                    <br />
                    Tension Level: {region.tension}/10
                  </Tooltip>
                </Circle>
              ))}
            </>
          )}

          {/* ENGLISH SCHOOL OVERLAYS */}
          {theory?.id === 'english-school' && showLens && 'englishSchool' in mapData && mapData.englishSchool && (
            <>
              {/* International society members */}
              {mapData.englishSchool.internationalSocietyMembers?.map((pos: any, idx: number) => (
                <CircleMarker
                  key={`society-${idx}`}
                  center={pos as [number, number]}
                  radius={14}
                  pathOptions={{
                    fillColor: '#10B981',
                    fillOpacity: 0.6,
                    color: '#059669',
                    weight: 2
                  }}
                >
                  <Tooltip><Globe2 className="inline w-3 h-3" /> International Society Member</Tooltip>
                  <Popup>
                    <strong className="text-green-700">International Society</strong>
                    <br />
                    Great power recognizing shared norms and rules.
                  </Popup>
                </CircleMarker>
              ))}

              {/* Diplomatic channels */}
              {'englishSchool' in mapData && mapData.englishSchool.diplomaticChannels?.map((channel: any, idx: number) => (
                <Polyline
                  key={`diplo-${idx}`}
                  positions={[channel.from as [number, number], channel.to as [number, number]]}
                  pathOptions={{
                    color: '#10B981',
                    weight: 3,
                    opacity: 0.8,
                    dashArray: channel.type === 'hotline' ? '2, 8' : undefined
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      {channel.tooltip}
                      <br /><br />
                      <strong className="text-green-700">English School:</strong>
                      <br />
                      Diplomacy maintains international society even during rivalry.
                    </div>
                  </Popup>
                </Polyline>
              ))}
            </>
          )}

          {/* CLICKABLE COUNTRIES - All Theories */}
          {showLens && theory && mapData.countries?.map((country: any, idx: number) => (
            <CircleMarker
              key={`country-${idx}`}
              center={country.position as [number, number]}
              radius={16}
              pathOptions={{
                fillColor: theory.color,
                fillOpacity: 0.4,
                color: theory.color,
                weight: 3
              }}
            >
              <Popup maxWidth={400}>
                <div className="text-sm">
                  <strong className="text-xl">{country.name}</strong>
                  <br /><br />
                  <div className="p-3 rounded" style={{ backgroundColor: `${theory.color}15` }}>
                    <strong style={{ color: theory.color }}>
                      {theory.shortName} Perspective:
                    </strong>
                    <br />
                    <div className="mt-2">
                      {theory.id === 'classical-realism' && country.perspectives.realism}
                      {theory.id === 'structural-realism' && country.perspectives.neorealism}
                      {theory.id === 'liberalism' && country.perspectives.liberalism}
                      {theory.id === 'neoliberalism' && country.perspectives.neoliberalism}
                      {theory.id === 'constructivism' && country.perspectives.constructivism}
                      {theory.id === 'english-school' && country.perspectives.englishSchool}
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Theory Lens Overlay */}
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
              }}
            >
              <motion.div
                initial={{ scale: 3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    inset: '20px',
                    border: `3px solid ${theory.color}`,
                    borderRadius: '12px',
                    boxShadow: `inset 0 0 30px ${theory.color}20, 0 0 20px ${theory.color}30`,
                    background: `radial-gradient(ellipse at center, ${theory.color}03 0%, ${theory.color}08 100%)`,
                  }}
                />

              {/* Theory label */}
              <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="absolute top-6 left-1/2 transform -translate-x-1/2"
                style={{ pointerEvents: 'auto' }}
              >
                <div 
                    className="bg-white/98 backdrop-blur-sm px-5 py-2.5 rounded-lg shadow-lg flex items-center space-x-2 border"
                    style={{ borderColor: `${theory.color}60` }}
                  >
                    <Eye className="w-5 h-5" style={{ color: theory.color }} />
                    <span className="font-serif font-semibold text-base tracking-wide" style={{ color: theory.color }}>
                      {theory.shortName}
                    </span>
                  </div>
              </motion.div>

              {/* Focus badges */}
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1 }}
                className="absolute top-24 left-4 bg-white/98 backdrop-blur-sm px-4 py-2.5 rounded-lg shadow-md border"
                style={{ borderColor: `${theory.color}50`, pointerEvents: 'auto' }}
              >
                {theory.id === 'classical-realism' && (
                  <div className="flex items-center space-x-2 text-red-800">
                    <Shield className="w-5 h-5" />
                    <span className="font-semibold text-sm">Showing: Power & Alliances</span>
                  </div>
                )}
                {theory.id === 'liberalism' && (
                  <div className="flex items-center space-x-2 text-blue-800">
                    <Building className="w-5 h-5" />
                    <span className="font-semibold text-sm">Showing: Institutions & Trade</span>
                  </div>
                )}
                {theory.id === 'neoliberalism' && (
                  <div className="flex items-center space-x-2 text-indigo-800">
                    <BookOpen className="w-5 h-5" />
                    <span className="font-semibold text-sm">Showing: Treaties & Regimes</span>
                  </div>
                )}
                {theory.id === 'constructivism' && (
                  <div className="flex items-center space-x-2 text-yellow-800">
                    <Globe2 className="w-5 h-5" />
                    <span className="font-semibold text-sm">Showing: Ideology & Norms</span>
                  </div>
                )}
                {theory.id === 'structural-realism' && (
                  <div className="flex items-center space-x-2 text-red-800">
                    <Scale className="w-5 h-5" />
                    <span className="font-semibold text-sm">Showing: System Structure</span>
                  </div>
                )}
                {theory.id === 'english-school' && (
                  <div className="flex items-center space-x-2 text-green-800">
                    <Users className="w-5 h-5" />
                    <span className="font-semibold text-sm">Showing: International Society</span>
                  </div>
                )}
              </motion.div>

              {/* Map legend */}
              <motion.div
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="absolute top-24 right-4 bg-white/98 backdrop-blur-sm p-4 rounded-lg shadow-md max-w-xs border"
                style={{ borderColor: `${theory.color}50`, pointerEvents: 'auto' }}
              >
                <h4 className="font-bold mb-2" style={{ color: theory.color }}>Map Key:</h4>
                <div className="text-xs space-y-1">
                  {theory.id === 'classical-realism' && (
                    <>
                      <div className="flex items-center"><div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>NATO Alliance</div>
                      <div className="flex items-center"><div className="w-3 h-3 bg-red-600 rounded-full mr-2"></div>Warsaw Pact</div>
                      <div className="flex items-center"><Swords className="w-3 h-3 mr-2" />Military Bases</div>
                      <div className="flex items-center"><Radiation className="w-3 h-3 mr-2" />Nuclear Sites</div>
                      <div className="flex items-center"><Target className="w-3 h-3 mr-2" />Attack Vectors</div>
                    </>
                  )}
                  {theory.id === 'liberalism' && (
                    <>
                      <div className="flex items-center"><Landmark className="w-3 h-3 mr-2" />International Institutions</div>
                      <div className="flex items-center"><TrendingUp className="w-3 h-3 mr-2" />Trade Routes (thickness = volume)</div>
                      <div className="flex items-center"><Shield className="w-3 h-3 mr-2" />Democratic States</div>
                      <div className="flex items-center"><Target className="w-3 h-3 mr-2" />Click institutions!</div>
                    </>
                  )}
                  {theory.id === 'neoliberalism' && (
                    <>
                      <div className="flex items-center"><FileText className="w-3 h-3 mr-2" />Treaties & Regimes</div>
                      <div className="flex items-center"><div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>Cooperation Zones</div>
                      <div className="flex items-center"><Target className="w-3 h-3 mr-2" />Click treaties!</div>
                    </>
                  )}
                  {theory.id === 'constructivism' && (
                    <>
                      <div className="flex items-center"><div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>Capitalist/Democratic</div>
                      <div className="flex items-center"><div className="w-3 h-3 bg-red-600 rounded-full mr-2"></div>Communist</div>
                      <div className="flex items-center"><div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>Non-Aligned</div>
                      <div className="flex items-center"><Network className="w-3 h-3 mr-2" />Norm/Idea Diffusion</div>
                    </>
                  )}
                  {theory.id === 'structural-realism' && (
                    <>
                      <div className="flex items-center"><Zap className="w-3 h-3 mr-2" />Superpowers (Poles)</div>
                      <div className="flex items-center"><div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>Buffer States</div>
                      <div className="flex items-center"><Target className="w-3 h-3 mr-2" />Regional Subsystems</div>
                    </>
                  )}
                  {theory.id === 'english-school' && (
                    <>
                      <div className="flex items-center"><div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>International Society</div>
                      <div className="flex items-center"><Network className="w-3 h-3 mr-2" />Diplomatic Channels</div>
                      <div className="flex items-center"><Target className="w-3 h-3 mr-2" />Click countries!</div>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Dynamic Interpretation Box */}
      {theory && showLens && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="p-6 border-t"
          style={{ backgroundColor: `${theory.color}08` }}
        >
          <h4 className="font-bold text-xl mb-3 flex items-center" style={{ color: theory.color }}>
            {theory.id === 'classical-realism' && <Shield className="w-6 h-6 mr-2" />}
            {theory.id === 'liberalism' && <Building className="w-6 h-6 mr-2" />}
            {theory.id === 'neoliberalism' && <BookOpen className="w-6 h-6 mr-2" />}
            {theory.id === 'constructivism' && <Globe2 className="w-6 h-6 mr-2" />}
            {theory.id === 'structural-realism' && <Scale className="w-6 h-6 mr-2" />}
            {theory.id === 'english-school' && <Users className="w-6 h-6 mr-2" />}
            How {theory.shortName} Views This Map
          </h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h5 className="font-semibold mb-2">What This Theory Sees:</h5>
              <ul className="text-sm space-y-1 text-gray-700">
                {theory.id === 'classical-realism' && (
                  <>
                    <li>• Military alliances (NATO vs Warsaw Pact)</li>
                    <li>• Nuclear weapons sites (ultimate power)</li>
                    <li>• Spheres of influence (territorial control)</li>
                    <li>• Potential attack routes</li>
                    <li>• Balance of power dynamics</li>
                  </>
                )}
                {theory.id === 'liberalism' && (
                  <>
                    <li>• International institutions (UN, IMF, World Bank)</li>
                    <li>• Trade routes and economic interdependence</li>
                    <li>• Democratic peace zone (Western Europe)</li>
                    <li>• Cooperation networks</li>
                    <li>• Institutional memberships</li>
                  </>
                )}
                {theory.id === 'neoliberalism' && (
                  <>
                    <li>• Arms control treaties (NPT, SALT, INF)</li>
                    <li>• International regimes facilitating cooperation</li>
                    <li>• European cooperation zone (EEC)</li>
                    <li>• Institutions mitigating anarchy</li>
                    <li>• Repeated interactions building trust</li>
                  </>
                )}
                {theory.id === 'constructivism' && (
                  <>
                    <li>• Ideological zones (Capitalist, Communist, Non-Aligned)</li>
                    <li>• Norm diffusion patterns</li>
                    <li>• Identity conflicts (democracy vs. communism)</li>
                    <li>• Cultural propaganda spheres</li>
                    <li>• How ideas spread across borders</li>
                  </>
                )}
                {theory.id === 'structural-realism' && (
                  <>
                    <li>• Bipolar structure (two superpowers)</li>
                    <li>• Buffer states maintaining stability</li>
                    <li>• Regional subsystems under bipolar logic</li>
                    <li>• System-level constraints on behavior</li>
                    <li>• Structural balance of power</li>
                  </>
                )}
                {theory.id === 'english-school' && (
                  <>
                    <li>• International society membership</li>
                    <li>• Diplomatic communication channels</li>
                    <li>• Shared legal commitments</li>
                    <li>• Great power management</li>
                    <li>• Norms constraining behavior</li>
                  </>
                )}
              </ul>
            </div>

            {/* Key Thinkers Panel */}
            <div>
              <h5 className="font-semibold mb-2">Key Thinkers:</h5>
              <div className="space-y-2 text-sm">
                  {theory.keyThinkers.slice(0, 3).map((thinker, idx) => (
                  <div key={idx} className="p-2 bg-white rounded border flex items-center" style={{ borderColor: `${theory.color}50` }}>
                    <BookOpen className="w-4 h-4 mr-2" style={{ color: theory.color }} />
                    <strong style={{ color: theory.color }}>{thinker}</strong>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200 text-xs text-gray-700 font-serif">
                <div className="flex items-center mb-1">
                  <BookOpen className="w-3 h-3 mr-1.5 text-blue-600" />
                  <span className="font-semibold text-blue-900 uppercase tracking-wide text-[10px]">Academic Note</span>
                </div>
                <p className="leading-relaxed">Click any country marker to view {theory.shortName} interpretation of their strategic behavior and policy motivations.</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Helper functions for event detail extraction
function getEventPlaceName(event: TimelinePoint): string {
  const placeNames: { [key: string]: string } = {
    '1947': 'Greece & Turkey',
    '1948': 'Western Europe',
    '1949': 'Brussels',
    '1950': 'Korean Peninsula',
    '1952': 'Pacific Proving Grounds',
    '1955': 'Warsaw',
    '1956': 'Suez Canal Zone',
    '1957': 'Baikonur Cosmodrome',
    '1962': 'Cuba',
    '1972': 'Beijing',
    '1975': 'Saigon',
    '1979': 'Kabul',
    '1985': 'Moscow',
    '1989': 'Berlin',
    '1991': 'Moscow',
  };
  return placeNames[event.year] || 'Unknown';
}

function getEventCountry(event: TimelinePoint): string {
  const countries: { [key: string]: string } = {
    '1947': 'Greece/Turkey',
    '1948': 'Multiple',
    '1949': 'Belgium',
    '1950': 'South Korea',
    '1952': 'Marshall Islands',
    '1955': 'Poland',
    '1956': 'Egypt',
    '1957': 'USSR',
    '1962': 'Cuba',
    '1972': 'China',
    '1975': 'Vietnam',
    '1979': 'Afghanistan',
    '1985': 'USSR',
    '1989': 'Germany',
    '1991': 'USSR',
  };
  return countries[event.year] || 'Unknown';
}

function getRealistAnalysis(event: TimelinePoint): string {
  // Extract first two sentences from description as realist analysis
  const sentences = event.description.split('. ');
  return sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '.' : '');
}

export default EnhancedTheoryMap;

