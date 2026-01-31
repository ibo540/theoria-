import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { theories } from '../data/theories';
import { events, interpretations } from '../data/events';
import { coldWarTimeline, wwiTimeline, unFormationTimeline } from '../data/timelineData';
import { theoryLimitations } from '../data/theoryLimitations';
import { CountryInfo } from '../data/countries';
import TheoryCard from '../components/TheoryCard';
import EventCard from '../components/EventCard';
import MapVisualization from '../components/MapVisualization';
import DetailedMapVisualization from '../components/DetailedMapVisualization';
import EnhancedTheoryMap from '../components/EnhancedTheoryMap';
import InteractiveTimeline from '../components/InteractiveTimeline';
import ErrorBoundary from '../components/ErrorBoundary';
import DataCharts from '../components/DataCharts';
import TheorySpecificCharts from '../components/TheorySpecificCharts';
import InterpretationPanel from '../components/InterpretationPanel';
import TheoryLimitations from '../components/TheoryLimitations';
import AIAssistant from '../components/AIAssistant';
import CountrySearch from '../components/CountrySearch';
import CountryAnalysisPanel from '../components/CountryAnalysisPanel';

function LensExplorer() {
  const [selectedTheory, setSelectedTheory] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showLens, setShowLens] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryInfo | null>(null);
  const [currentTimelineIndex, setCurrentTimelineIndex] = useState(0);
  const [isTimelinePlaying, setIsTimelinePlaying] = useState(false);

  const handleTheorySelect = (theoryId: string) => {
    setSelectedTheory(theoryId);
    if (selectedEvent) {
      setShowLens(false);
      setTimeout(() => setShowLens(true), 100);
    }
  };

  const handleEventSelect = (eventId: string) => {
    setSelectedEvent(eventId);
    if (selectedTheory) {
      setShowLens(false);
      setTimeout(() => setShowLens(true), 100);
    }
  };

  const currentEvent = events.find(e => e.id === selectedEvent);
  const currentTheory = theories.find(t => t.id === selectedTheory);
  const currentInterpretation = interpretations.find(
    i => i.theoryId === selectedTheory && i.eventId === selectedEvent
  );
  const currentLimitations = theoryLimitations.find(
    l => l.theoryId === selectedTheory && l.eventId === selectedEvent
  );

  // Get timeline data for the event
  const getTimelineData = (eventId: string | null) => {
    if (!eventId) return null;
    if (eventId === 'cold-war') return coldWarTimeline;
    if (eventId === 'wwi') return wwiTimeline;
    if (eventId === 'un-formation') return unFormationTimeline;
    // Other events don't have timeline yet
    return null;
  };

  const timelineData = getTimelineData(selectedEvent);
  
  // Events that should use enhanced map even without timeline
  const useEnhancedMap = selectedEvent && ['cold-war', 'wwi', 'eu-formation', 'cuban-missile-crisis', 'un-formation'].includes(selectedEvent);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Theory Explorer</h1>
        <p className="text-lg text-gray-600">
          Select a theory and an event to see how different lenses interpret the same historical moment.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          {/* Country Search */}
          {selectedEvent && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-serif font-bold mb-3 tracking-wide text-gray-900">
                Country Analysis
              </h2>
              <p className="text-sm text-gray-600 font-serif mb-4">
                Search for any country to see how it behaved during this event from your selected theoretical perspective.
              </p>
              <CountrySearch
                currentEvent={selectedEvent}
                currentTheory={selectedTheory}
                onCountrySelect={setSelectedCountry}
              />
              
              {/* Country Analysis Panel - Right Below Search */}
              <AnimatePresence>
                {selectedCountry && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-4"
                  >
                    <CountryAnalysisPanel
                      country={selectedCountry}
                      event={selectedEvent}
                      theory={currentTheory}
                      onClose={() => setSelectedCountry(null)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-lg mr-3 text-sm">Step 1</span>
              Select a Historical Event
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {events.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  isSelected={selectedEvent === event.id}
                  onClick={() => handleEventSelect(event.id)}
                />
              ))}
            </div>
          </div>

          {currentEvent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={timelineData && (currentEvent.id === 'cold-war') && (currentTheory?.id === 'classical-realism' || currentTheory?.id === 'structural-realism') ? '' : 'bg-white rounded-xl shadow-lg overflow-hidden'}
            >
              {timelineData && timelineData.length > 0 && (currentEvent.id === 'cold-war') && (currentTheory?.id === 'classical-realism' || currentTheory?.id === 'structural-realism') ? (
                <ErrorBoundary>
                  <div className="mx-auto max-w-[1400px] px-4 lg:grid lg:grid-cols-2 lg:gap-6">
                    <section id="timelineCol" className="lg:pr-2">
                      <div className="bg-white rounded-xl shadow-lg overflow-visible">
                        <div className="p-6 border-b">
                          <h3 className="text-2xl font-bold mb-2">{currentEvent.name}</h3>
                          <p className="text-gray-600">{currentEvent.description}</p>
                        </div>
                        <div className="p-6 pt-4">
                          <InteractiveTimeline
                            events={timelineData}
                            currentIndex={currentTimelineIndex}
                            onTimeChange={(index) => setCurrentTimelineIndex(index)}
                            isPlaying={isTimelinePlaying}
                            onPlayToggle={() => setIsTimelinePlaying(!isTimelinePlaying)}
                            onReset={() => {
                              setCurrentTimelineIndex(0);
                              setIsTimelinePlaying(false);
                            }}
                            currentTheoryId={currentTheory?.id}
                          />
                        </div>
                      </div>
                    </section>
                    <aside
                      id="mapCol"
                      className="sticky top-[80px] h-[calc(100vh-80px)] lg:block hidden lg:pl-2"
                    >
                      <div className="h-full bg-white rounded-xl shadow-lg overflow-hidden">
                        <EnhancedTheoryMap
                          event={currentEvent}
                          theory={currentTheory}
                          showLens={showLens}
                          currentTimelineEvent={timelineData[currentTimelineIndex] || timelineData[0]}
                          shouldZoom={true}
                          selectedCountry={selectedCountry}
                        />
                      </div>
                    </aside>
                    {/* Mobile map */}
                    <div className="lg:hidden mt-6 h-[600px] bg-white rounded-xl shadow-lg overflow-hidden">
                      <EnhancedTheoryMap
                        event={currentEvent}
                        theory={currentTheory}
                        showLens={showLens}
                        currentTimelineEvent={timelineData[currentTimelineIndex] || timelineData[0]}
                        shouldZoom={true}
                        selectedCountry={selectedCountry}
                      />
                    </div>
                  </div>
                </ErrorBoundary>
              ) : timelineData ? (
                <DetailedMapVisualization
                  event={currentEvent}
                  theory={currentTheory}
                  showLens={showLens}
                  timelineData={timelineData}
                />
              ) : useEnhancedMap ? (
                <div>
                  <div className="p-6 border-b">
                    <h3 className="text-2xl font-bold mb-2">{currentEvent.name}</h3>
                    <p className="text-gray-600">{currentEvent.description}</p>
                  </div>
                  <EnhancedTheoryMap
                    event={currentEvent}
                    theory={currentTheory}
                    showLens={showLens}
                    selectedCountry={selectedCountry}
                  />
                </div>
              ) : (
                <MapVisualization
                  event={currentEvent}
                  theory={currentTheory}
                  showLens={showLens}
                />
              )}
            </motion.div>
          )}

          {currentEvent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6"
            >
              {currentTheory && showLens ? (
                <TheorySpecificCharts event={currentEvent} theory={currentTheory} />
              ) : currentEvent.data ? (
                <DataCharts event={currentEvent} />
              ) : null}
            </motion.div>
          )}
        </div>

        <div>
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-lg mr-3 text-sm">Step 2</span>
              Choose a Theory
            </h2>
            <div className="space-y-3">
              {theories.map(theory => (
                <TheoryCard
                  key={theory.id}
                  theory={theory}
                  isSelected={selectedTheory === theory.id}
                  onClick={() => handleTheorySelect(theory.id)}
                />
              ))}
            </div>

            <AnimatePresence>
              {currentInterpretation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6"
                >
                  <InterpretationPanel interpretation={currentInterpretation} theory={currentTheory!} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Theory Limitations */}
            <AnimatePresence>
              {currentLimitations && currentTheory && (
                <TheoryLimitations 
                  theory={currentTheory}
                  eventId={selectedEvent!}
                  limitations={currentLimitations}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* AI Assistant */}
      <AIAssistant currentTheory={currentTheory} currentEvent={currentEvent} />
    </div>
  );
}

export default LensExplorer;

