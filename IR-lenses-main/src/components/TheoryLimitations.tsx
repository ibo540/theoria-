import { motion } from 'framer-motion';
import { AlertTriangle, ThumbsDown, Lightbulb } from 'lucide-react';
import { Theory } from '../types';

interface TheoryLimitationsProps {
  theory: Theory;
  eventId: string;
  limitations: {
    canExplain: boolean;
    weaknessLevel: 'critical' | 'moderate' | 'minor' | 'none';
    blindSpots: string[];
    whatItMisses: string[];
    betterAlternatives?: { theoryId: string; reason: string }[];
    funnyAnalogy?: string;
  };
}

function TheoryLimitations({ theory, limitations }: TheoryLimitationsProps) {
  const getWeaknessColor = (level: string) => {
    switch (level) {
      case 'critical': return { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-800', icon: 'text-red-600' };
      case 'moderate': return { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-800', icon: 'text-orange-600' };
      case 'minor': return { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-800', icon: 'text-yellow-600' };
      default: return { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-800', icon: 'text-green-600' };
    }
  };

  const colors = getWeaknessColor(limitations.weaknessLevel);

  if (!limitations.canExplain) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${colors.bg} border-2 ${colors.border} rounded-xl p-6 mt-6`}
      >
        <div className="flex items-start space-x-3 mb-4">
          <ThumbsDown className={`w-8 h-8 ${colors.icon} flex-shrink-0`} />
          <div>
            <h3 className={`text-2xl font-serif font-bold ${colors.text} mb-2 tracking-wide`}>
              THEORETICAL LIMITATIONS: {theory.shortName.toUpperCase()}
            </h3>
            <p className={`${colors.text} text-lg font-medium`}>
              This theory has significant blind spots when explaining this event.
            </p>
          </div>
        </div>

        {limitations.funnyAnalogy && (
          <div className="bg-white/50 rounded-lg p-4 mb-4 border-l-4 font-serif" style={{ borderColor: theory.color }}>
            <p className="text-gray-800 italic text-sm">
              <strong className="font-semibold not-italic">Conceptual Analogy:</strong> {limitations.funnyAnalogy}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <h4 className={`font-serif font-bold ${colors.text} mb-3 flex items-center tracking-wide`}>
              <AlertTriangle className="w-5 h-5 mr-2" />
              EXPLANATORY GAPS
            </h4>
            <ul className="space-y-2">
              {limitations.whatItMisses.map((miss, idx) => (
                <li key={idx} className={`${colors.text} flex items-start text-sm font-serif`}>
                  <span className="mr-3 font-bold">{idx + 1}.</span>
                  <span>{miss}</span>
                </li>
              ))}
            </ul>
          </div>

          {limitations.blindSpots.length > 0 && (
            <div>
              <h4 className={`font-serif font-bold ${colors.text} mb-3 tracking-wide`}>
                THEORETICAL BLIND SPOTS
              </h4>
              <ul className="space-y-2">
                {limitations.blindSpots.map((spot, idx) => (
                  <li key={idx} className={`${colors.text} flex items-start text-sm font-serif`}>
                    <span className="mr-3 font-bold" style={{ color: theory.color }}>►</span>
                    <span>{spot}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {limitations.betterAlternatives && limitations.betterAlternatives.length > 0 && (
            <div className="bg-white rounded-lg p-5 border-2 border-blue-300">
              <h4 className="font-serif font-bold text-blue-900 mb-4 flex items-center tracking-wide text-sm">
                <Lightbulb className="w-5 h-5 mr-2" />
                RECOMMENDED ALTERNATIVE FRAMEWORKS
              </h4>
              <div className="space-y-3">
                {limitations.betterAlternatives.map((alt, idx) => (
                  <div key={idx} className="flex items-start bg-blue-50 rounded p-3 border-l-4 border-blue-600">
                    <span className="font-bold text-blue-900 mr-3 font-serif">{idx + 1}.</span>
                    <div className="font-serif text-sm">
                      <strong className="text-blue-900 font-semibold">{alt.theoryId}</strong>
                      <span className="text-gray-700">: {alt.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // If theory CAN explain but has some weaknesses
  if (limitations.weaknessLevel !== 'none') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${colors.bg} border-2 ${colors.border} rounded-xl p-6 mt-6`}
      >
        <div className="flex items-start space-x-3 mb-4">
          <AlertTriangle className={`w-7 h-7 ${colors.icon} flex-shrink-0`} />
          <div>
            <h3 className={`text-xl font-serif font-bold ${colors.text} mb-1 tracking-wide`}>
              THEORETICAL LIMITATIONS: {theory.shortName.toUpperCase()}
            </h3>
            <p className={`${colors.text}`}>
              This theory explains {limitations.weaknessLevel === 'minor' ? 'most' : 'some'} aspects, but has blind spots.
            </p>
          </div>
        </div>

        {limitations.funnyAnalogy && (
          <div className="bg-white/50 rounded-lg p-3 mb-4 border-l-4" style={{ borderColor: theory.color }}>
            <p className="text-gray-800 italic text-sm font-serif">
              <strong className="font-semibold not-italic">Conceptual Analogy:</strong> {limitations.funnyAnalogy}
            </p>
          </div>
        )}

        {limitations.blindSpots.length > 0 && (
          <div className="mb-3">
            <h4 className={`font-serif font-semibold ${colors.text} mb-2 text-sm tracking-wide`}>CRITICAL WEAKNESSES:</h4>
            <ul className="space-y-1">
              {limitations.blindSpots.map((spot, idx) => (
                <li key={idx} className={`${colors.text} text-sm flex items-start font-serif`}>
                  <span className="mr-2 font-bold" style={{ color: theory.color }}>►</span>
                  <span>{spot}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {limitations.betterAlternatives && (
          <div className="bg-white/70 rounded-lg p-3 border-l-4 border-blue-600">
            <p className="text-sm text-gray-800 font-serif">
              <strong className="font-semibold">Alternative Framework:</strong> {limitations.betterAlternatives[0].theoryId} — {limitations.betterAlternatives[0].reason}
            </p>
          </div>
        )}
      </motion.div>
    );
  }

  return null;
}

export default TheoryLimitations;

