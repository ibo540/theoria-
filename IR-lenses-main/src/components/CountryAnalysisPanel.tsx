import { motion } from 'framer-motion';
import { X, MapPin, Globe2, Flag, ArrowRight } from 'lucide-react';
import { CountryInfo } from '../data/countries';
import { Theory } from '../types';

interface CountryAnalysisPanelProps {
  country: CountryInfo;
  event: string;
  theory?: Theory;
  onClose: () => void;
}

function CountryAnalysisPanel({ country, event, theory, onClose }: CountryAnalysisPanelProps) {
  const eventData = country.events[event];
  if (!eventData) return null;

  const theoryKey = theory?.id as keyof typeof eventData.perspectives;
  const analysis = theoryKey ? eventData.perspectives[theoryKey] : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-white rounded-xl shadow-2xl border-3 overflow-hidden"
      style={{ borderColor: theory?.color || '#3B82F6' }}
    >
      {/* Header */}
      <div 
        className="p-5 text-white flex items-center justify-between"
        style={{ background: `linear-gradient(135deg, ${theory?.color || '#3B82F6'} 0%, ${theory?.color || '#3B82F6'}dd 100%)` }}
      >
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-serif font-bold">{country.name}</h3>
            <p className="text-sm opacity-90 font-serif">{country.region}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="hover:bg-white/20 rounded-lg p-2 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-5">
        {/* Role in Event */}
        <div>
          <div className="flex items-center mb-2 pb-2 border-b border-gray-200">
            <Flag className="w-5 h-5 mr-2 text-gray-600" />
            <h4 className="font-serif font-bold text-lg tracking-wide text-gray-900">
              ROLE IN EVENT
            </h4>
          </div>
          <p className="text-sm text-gray-800 font-serif leading-relaxed italic">
            {eventData.role}
          </p>
        </div>

        {/* Theory-Specific Analysis */}
        {theory && analysis ? (
          <div>
            <div 
              className="flex items-center mb-3 pb-2 border-b"
              style={{ borderColor: `${theory.color}30` }}
            >
              <Globe2 className="w-5 h-5 mr-2" style={{ color: theory.color }} />
              <h4 className="font-serif font-bold text-lg tracking-wide" style={{ color: theory.color }}>
                {theory.shortName.toUpperCase()} PERSPECTIVE
              </h4>
            </div>
            <div 
              className="p-4 rounded-lg border-l-4"
              style={{ 
                backgroundColor: `${theory.color}08`,
                borderColor: theory.color
              }}
            >
              <p className="text-sm text-gray-800 font-serif leading-relaxed">
                {analysis}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 font-serif italic text-center">
              Select a theory to see {country.name}'s behavior from that theoretical perspective
            </p>
          </div>
        )}

        {/* Available Perspectives */}
        {!theory && (
          <div>
            <div className="flex items-center mb-2 pb-2 border-b border-gray-200">
              <ArrowRight className="w-5 h-5 mr-2 text-gray-600" />
              <h4 className="font-serif font-bold text-sm tracking-wide text-gray-900">
                AVAILABLE THEORETICAL PERSPECTIVES
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.keys(eventData.perspectives).map(theoryId => (
                <div
                  key={theoryId}
                  className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-serif capitalize"
                >
                  {theoryId.replace('-', ' ')}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tip */}
        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <p className="text-xs text-gray-700 font-serif flex items-start">
            <Globe2 className="w-3 h-3 mr-1.5 mt-0.5 flex-shrink-0 text-blue-600" />
            <span><strong className="text-blue-900">Academic Note:</strong> Switch theories above to see how different theoretical frameworks interpret {country.name}'s behavior differently. Each theory provides unique analytical insights.</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default CountryAnalysisPanel;

