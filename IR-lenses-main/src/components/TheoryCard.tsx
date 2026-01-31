import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';
import { Theory } from '../types';

interface TheoryCardProps {
  theory: Theory;
  isSelected: boolean;
  onClick: () => void;
}

function TheoryCard({ theory, isSelected, onClick }: TheoryCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-purple-500 bg-purple-50 shadow-lg'
          : 'border-gray-200 hover:border-purple-300 bg-white'
      }`}
    >
      <div className="flex items-center mb-2">
        <div
          className="w-4 h-4 rounded-full mr-3"
          style={{ backgroundColor: theory.color }}
        />
        <h3 className="font-bold text-lg">{theory.shortName}</h3>
        {isSelected && <Eye className="ml-auto w-5 h-5 text-purple-600" />}
      </div>
      <p className="text-sm text-gray-600 line-clamp-2">{theory.description}</p>
    </motion.button>
  );
}

export default TheoryCard;

