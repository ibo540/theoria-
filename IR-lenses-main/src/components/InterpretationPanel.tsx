import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, FileText, GraduationCap } from 'lucide-react';
import { TheoryInterpretation, Theory } from '../types';
import { scholars } from '../data/scholars';
import ScholarModal from './ScholarModal';

interface InterpretationPanelProps {
  interpretation: TheoryInterpretation;
  theory: Theory;
}

function InterpretationPanel({ interpretation, theory }: InterpretationPanelProps) {
  const [selectedScholar, setSelectedScholar] = useState<string | null>(null);
  const scholarProfile = selectedScholar ? scholars[selectedScholar] : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-t pt-6"
    >
      {/* Theoretical Interpretation */}
      <div className="mb-6">
        <div className="flex items-center mb-3 pb-2 border-b" style={{ borderColor: `${theory.color}30` }}>
          <FileText className="w-5 h-5 mr-2" style={{ color: theory.color }} />
          <h3 className="font-serif text-lg font-semibold tracking-wide" style={{ color: theory.color }}>
            THEORETICAL INTERPRETATION
          </h3>
        </div>
        <p className="text-sm text-gray-800 leading-relaxed font-serif italic border-l-4 pl-4 py-2" style={{ borderColor: theory.color }}>
          {interpretation.interpretation}
        </p>
      </div>

      {/* Key Analysis Points */}
      <div className="mb-6">
        <div className="flex items-center mb-3 pb-2 border-b" style={{ borderColor: `${theory.color}30` }}>
          <BookOpen className="w-5 h-5 mr-2" style={{ color: theory.color }} />
          <h3 className="font-serif text-lg font-semibold tracking-wide" style={{ color: theory.color }}>
            ANALYTICAL FRAMEWORK
          </h3>
        </div>
        <ul className="space-y-3">
          {interpretation.keyPoints.map((point, index) => (
            <li key={index} className="text-sm text-gray-800 flex items-start leading-relaxed">
              <span
                className="font-bold mr-3 mt-0.5 flex-shrink-0 font-serif"
                style={{ color: theory.color }}
              >
                {index + 1}.
              </span>
              <span className="font-serif">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Key Scholars */}
      <div>
        <div className="flex items-center mb-3 pb-2 border-b" style={{ borderColor: `${theory.color}30` }}>
          <GraduationCap className="w-5 h-5 mr-2" style={{ color: theory.color }} />
          <h3 className="font-serif text-lg font-semibold tracking-wide" style={{ color: theory.color }}>
            KEY SCHOLARS
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {theory.keyThinkers.map((thinker, index) => (
            <button
              key={index}
              onClick={() => setSelectedScholar(thinker)}
              className="text-sm px-3 py-2 rounded border bg-white font-serif hover:shadow-md transition-all text-left"
              style={{
                borderColor: `${theory.color}40`,
                color: '#374151'
              }}
            >
              <span className="font-semibold" style={{ color: theory.color }}>■</span> {thinker}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2 font-serif italic">
          Click any scholar name to view their profile and contributions
        </p>
      </div>

      {/* Scholar Modal */}
      <ScholarModal
        scholar={scholarProfile}
        isOpen={selectedScholar !== null}
        onClose={() => setSelectedScholar(null)}
        theoryColor={theory.color}
      />
    </motion.div>
  );
}

export default InterpretationPanel;

