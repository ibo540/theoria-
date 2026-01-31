import { useState } from 'react';
import { motion } from 'framer-motion';
import { HistoricalEvent, Theory } from '../types';
import { Sword, TrendingUp, Users, Shield } from 'lucide-react';
import { TimelinePoint } from '../data/timelineData';
import InteractiveTimeline from './InteractiveTimeline';
import EnhancedTheoryMap from './EnhancedTheoryMap';

interface DetailedMapVisualizationProps {
  event: HistoricalEvent;
  theory?: Theory;
  showLens: boolean;
  timelineData: TimelinePoint[];
}

function DetailedMapVisualization({ event, theory, showLens, timelineData }: DetailedMapVisualizationProps) {
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mapShouldZoom, setMapShouldZoom] = useState(false);

  const currentTimeData = timelineData[currentTimeIndex];

  // Trigger map zoom when timeline changes
  const handleTimeChange = (newIndex: number) => {
    setCurrentTimeIndex(newIndex);
    setMapShouldZoom(true);
    // Keep zoom active longer so map stays at location
    setTimeout(() => setMapShouldZoom(false), 2000);
  };

  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentTimeIndex(0);
    setIsPlaying(false);
  };

  return (
    <div className="relative">
      <div className="p-6 border-b">
        <h3 className="text-2xl font-bold mb-2">{event.name}</h3>
        <p className="text-gray-600">{event.description}</p>
      </div>

      {/* Interactive Timeline */}
      <div className="p-6 pt-4">
        <InteractiveTimeline
          events={timelineData}
          currentIndex={currentTimeIndex}
          onTimeChange={handleTimeChange}
          isPlaying={isPlaying}
          onPlayToggle={handlePlayToggle}
          onReset={handleReset}
          currentTheoryId={theory?.id}
        />
      </div>

      {/* Enhanced Theory-Specific Map */}
      <EnhancedTheoryMap 
        event={event} 
        theory={theory} 
        showLens={showLens}
        currentTimelineEvent={currentTimeData}
        shouldZoom={mapShouldZoom}
      />

      {/* Stats Panel */}
      {currentTimeData && (
        <motion.div
          key={currentTimeIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-gray-50 border-t grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="flex items-center mb-2">
              <Shield className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-sm text-gray-600">Military Bases</span>
            </div>
            <span className="text-2xl font-bold">{currentTimeData.mapData.militaryBases?.length || 0}</span>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="flex items-center mb-2">
              <Sword className="w-5 h-5 text-orange-600 mr-2" />
              <span className="text-sm text-gray-600">Active Conflicts</span>
            </div>
            <span className="text-2xl font-bold">{currentTimeData.mapData.conflicts?.length || 0}</span>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="flex items-center mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-sm text-gray-600">Troop Deployments</span>
            </div>
            <span className="text-2xl font-bold">{currentTimeData.mapData.troops?.length || 0}</span>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="flex items-center mb-2">
              <Users className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm text-gray-600">Major Movements</span>
            </div>
            <span className="text-2xl font-bold">{currentTimeData.mapData.movements?.length || 0}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default DetailedMapVisualization;
