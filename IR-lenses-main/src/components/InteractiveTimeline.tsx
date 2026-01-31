import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Shield, Users, Zap, Lightbulb, Flag, Sword, AlertCircle, Filter, Star, TrendingUp, BookOpen } from 'lucide-react';
import { TimelinePoint } from '../data/timelineData';

interface InteractiveTimelineProps {
  events: TimelinePoint[];
  currentIndex: number;
  onTimeChange: (index: number) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
  onReset: () => void;
  currentTheoryId?: string;
}

const eventTypeColors = {
  military: '#DC2626',
  diplomatic: '#3B82F6',
  economic: '#10B981',
  ideological: '#F59E0B',
};

const eventTypeIcons = {
  military: Shield,
  diplomatic: Users,
  economic: TrendingUp,
  ideological: Lightbulb,
};

function InteractiveTimeline({
  events,
  currentIndex,
  onTimeChange,
  isPlaying,
  onPlayToggle,
  onReset,
  currentTheoryId
}: InteractiveTimelineProps) {
  const [, setIsDragging] = useState(false);
  const [filters, setFilters] = useState({
    military: true,
    diplomatic: true,
    economic: true,
    ideological: true,
  });
  const [showOnlyTurningPoints, setShowOnlyTurningPoints] = useState(false);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTimeChange(parseInt(e.target.value));
  };

  const toggleFilter = (type: 'military' | 'diplomatic' | 'economic' | 'ideological') => {
    setFilters(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const currentEvent = events[currentIndex];
  const progress = (currentIndex / (events.length - 1)) * 100;

  // Note: Filters affect marker display (faded if filtered out)

  // Check if current event is relevant to selected theory
  const isRelevantToTheory = currentTheoryId && currentEvent.relevantTheories.includes(currentTheoryId);

  const getEventIcon = (iconName: string) => {
    const icons: { [key: string]: any } = {
      'shield': Shield,
      'users': Users,
      'zap': Zap,
      'lightbulb': Lightbulb,
      'flag': Flag,
      'sword': Sword,
      'alert-circle': AlertCircle,
      'wall': AlertCircle,
    };
    return icons[iconName] || Shield;
  };

  const EventIcon = getEventIcon(currentEvent.icon);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-serif font-bold tracking-wide text-gray-900">Historical Timeline</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowOnlyTurningPoints(!showOnlyTurningPoints)}
            className={`p-2 rounded-lg transition-colors text-xs font-serif flex items-center space-x-1 ${
              showOnlyTurningPoints ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="Show only turning points"
          >
            <Star className="w-4 h-4" />
            <span>Turning Points</span>
          </button>
          <button
            onClick={onReset}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Reset to beginning"
          >
            <RotateCcw className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={onPlayToggle}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
            title={isPlaying ? 'Pause' : 'Play through history'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Event Type Filters */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center mb-2">
          <Filter className="w-4 h-4 mr-2 text-gray-600" />
          <span className="text-xs font-serif font-semibold uppercase tracking-wide text-gray-700">Event Filters</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([type, enabled]) => {
            const Icon = eventTypeIcons[type as keyof typeof eventTypeIcons];
            const color = eventTypeColors[type as keyof typeof eventTypeColors];
            return (
              <button
                key={type}
                onClick={() => toggleFilter(type as any)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-serif font-medium transition-all border-2 ${
                  enabled 
                    ? 'text-white shadow-md' 
                    : 'bg-white text-gray-400 border-gray-300'
                }`}
                style={{
                  backgroundColor: enabled ? color : undefined,
                  borderColor: enabled ? color : undefined,
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="capitalize">{type}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Event Display */}
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className={`mb-4 p-4 rounded-lg border-l-4 ${
          isRelevantToTheory 
            ? 'bg-blue-50 border-blue-600' 
            : 'bg-gray-50 border-gray-400'
        }`}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: eventTypeColors[currentEvent.eventType] }}
            >
              <EventIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-bold font-serif" style={{ color: eventTypeColors[currentEvent.eventType] }}>
                {currentEvent.date}
              </span>
              {currentEvent.isTurningPoint && (
                <div className="inline-flex items-center ml-3 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                  <Star className="w-3 h-3 mr-1" />
                  Turning Point
                </div>
              )}
            </div>
          </div>
          <span className="text-sm text-gray-600 font-serif">
            {currentIndex + 1} of {events.length}
          </span>
        </div>
        <h4 className="font-bold text-lg font-serif mb-1">{currentEvent.title}</h4>
        <p className="text-gray-700 text-sm font-serif leading-relaxed">{currentEvent.description}</p>
        
        {/* Event Type Badge */}
        <div className="mt-3 flex items-center space-x-2">
          <span 
            className="text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide font-serif"
            style={{ 
              backgroundColor: `${eventTypeColors[currentEvent.eventType]}20`,
              color: eventTypeColors[currentEvent.eventType]
            }}
          >
            {currentEvent.eventType} Event
          </span>
          
          {isRelevantToTheory && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold font-serif flex items-center">
              <Star className="w-3 h-3 mr-1" />
              Key for Current Theory
            </span>
          )}
        </div>
      </motion.div>

      {/* Timeline Slider */}
      <div className="relative">
        {/* Progress bar background */}
        <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-2 bg-gray-200 rounded-full">
          {/* Active progress with gradient */}
          <motion.div
            className="h-full rounded-full"
            style={{ 
              width: `${progress}%`,
              background: `linear-gradient(to right, ${eventTypeColors.military}, ${eventTypeColors.ideological})`
            }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Timeline markers */}
        <div className="relative flex justify-between mb-2">
          {events.map((event, index) => {
            const isFiltered = !filters[event.eventType];
            const isPastEvent = index < currentIndex;
            const isCurrentEvent = index === currentIndex;
            
            return (
              <button
                key={index}
                onClick={() => onTimeChange(index)}
                className={`relative z-10 transition-all ${
                  isFiltered ? 'opacity-30' : 'opacity-100'
                }`}
                title={`${event.date} - ${event.title}`}
                disabled={isFiltered}
              >
                {/* Event marker */}
                <motion.div
                  animate={{
                    scale: isCurrentEvent ? 1.4 : 1,
                    opacity: isFiltered ? 0.3 : 1,
                  }}
                  className={`w-4 h-4 rounded-full border-3 shadow-md ${
                    event.isTurningPoint ? 'ring-2 ring-yellow-400' : ''
                  }`}
                  style={{
                    backgroundColor: isCurrentEvent || isPastEvent
                      ? eventTypeColors[event.eventType]
                      : '#FFFFFF',
                    borderColor: eventTypeColors[event.eventType],
                    borderWidth: '3px',
                  }}
                />
                
                {/* Turning point star */}
                {event.isTurningPoint && !isFiltered && (
                  <Star 
                    className="absolute -top-3 -right-3 w-3 h-3 text-yellow-500" 
                    fill="currentColor"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Invisible slider for dragging */}
        <input
          type="range"
          min="0"
          max={events.length - 1}
          value={currentIndex}
          onChange={handleSliderChange}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="absolute top-0 w-full h-8 opacity-0 cursor-pointer"
          style={{ zIndex: 20 }}
        />

        {/* Date labels */}
        <div className="flex justify-between mt-3 px-2">
          <span className="text-xs text-gray-600 font-serif font-semibold">{events[0].year}</span>
          <span className="text-xs text-gray-600 font-serif font-semibold">{events[events.length - 1].year}</span>
        </div>
      </div>

      {/* Theory Relevance Note */}
      {currentTheoryId && (
        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-start space-x-2">
            <BookOpen className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs font-serif text-gray-700">
              <p className="font-semibold text-blue-900 uppercase tracking-wide mb-1">Theoretical Relevance</p>
              <p className="leading-relaxed">
                {isRelevantToTheory 
                  ? `This event is particularly significant for ${currentTheoryId.replace('-', ' ')} theory's analysis of the Cold War.`
                  : `This event has less direct relevance to ${currentTheoryId.replace('-', ' ')} theory, which focuses on other aspects of this period.`
                }
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InteractiveTimeline;
