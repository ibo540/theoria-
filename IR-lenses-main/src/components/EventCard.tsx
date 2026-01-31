import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { HistoricalEvent } from '../types';

interface EventCardProps {
  event: HistoricalEvent;
  isSelected: boolean;
  onClick: () => void;
}

function EventCard({ event, isSelected, onClick }: EventCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full text-left p-5 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-lg'
          : 'border-gray-200 hover:border-blue-300 bg-white'
      }`}
    >
      <h3 className="font-bold text-lg mb-2">{event.name}</h3>
      <div className="flex items-center text-sm text-gray-600 mb-2">
        <Calendar className="w-4 h-4 mr-1" />
        <span>{event.year}</span>
      </div>
      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{event.description}</p>
      <div className="flex flex-wrap gap-1">
        {event.actors.slice(0, 3).map((actor, index) => (
          <span
            key={index}
            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
          >
            {actor}
          </span>
        ))}
        {event.actors.length > 3 && (
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
            +{event.actors.length - 3} more
          </span>
        )}
      </div>
    </motion.button>
  );
}

export default EventCard;

