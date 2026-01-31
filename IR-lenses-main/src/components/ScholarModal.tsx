import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, GraduationCap, BookOpen, Award, Quote, Globe } from 'lucide-react';
import { ScholarProfile } from '../data/scholars';

interface ScholarModalProps {
  scholar: ScholarProfile | null;
  isOpen: boolean;
  onClose: () => void;
  theoryColor: string;
}

function ScholarModal({ scholar, isOpen, onClose, theoryColor }: ScholarModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!scholar) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[9998] backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-2xl my-8"
            >
              <div className="bg-white rounded-xl shadow-2xl border-4 max-h-[85vh] overflow-y-auto" style={{ borderColor: theoryColor }}>
              {/* Header */}
              <div className="p-6 border-b-2" style={{ borderColor: `${theoryColor}30`, backgroundColor: `${theoryColor}05` }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: theoryColor }}>
                      <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-serif font-bold text-gray-900 tracking-wide">
                        {scholar.name}
                      </h2>
                      <p className="text-sm text-gray-600 font-serif mt-1">
                        {scholar.lifespan} • {scholar.nationality}
                      </p>
                      <div className="mt-2 inline-block px-3 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: `${theoryColor}20`, color: theoryColor }}>
                        {scholar.theory}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="hover:bg-gray-100 rounded-lg p-2 transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Background */}
                <div>
                  <div className="flex items-center mb-3 pb-2 border-b" style={{ borderColor: `${theoryColor}30` }}>
                    <Globe className="w-5 h-5 mr-2" style={{ color: theoryColor }} />
                    <h3 className="font-serif font-bold text-lg tracking-wide" style={{ color: theoryColor }}>
                      BIOGRAPHICAL CONTEXT
                    </h3>
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed font-serif">
                    {scholar.background}
                  </p>
                </div>

                {/* Key Works */}
                <div>
                  <div className="flex items-center mb-3 pb-2 border-b" style={{ borderColor: `${theoryColor}30` }}>
                    <BookOpen className="w-5 h-5 mr-2" style={{ color: theoryColor }} />
                    <h3 className="font-serif font-bold text-lg tracking-wide" style={{ color: theoryColor }}>
                      MAJOR WORKS
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {scholar.keyWorks.map((work, idx) => (
                      <li key={idx} className="text-sm text-gray-800 flex items-start font-serif">
                        <span className="font-bold mr-3 mt-0.5" style={{ color: theoryColor }}>
                          {idx + 1}.
                        </span>
                        <span className="italic">{work}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Main Contributions */}
                <div>
                  <div className="flex items-center mb-3 pb-2 border-b" style={{ borderColor: `${theoryColor}30` }}>
                    <Award className="w-5 h-5 mr-2" style={{ color: theoryColor }} />
                    <h3 className="font-serif font-bold text-lg tracking-wide" style={{ color: theoryColor }}>
                      THEORETICAL CONTRIBUTIONS
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {scholar.mainContributions.map((contribution, idx) => (
                      <li key={idx} className="text-sm text-gray-800 flex items-start leading-relaxed font-serif">
                        <span className="font-bold mr-3 mt-0.5 flex-shrink-0" style={{ color: theoryColor }}>
                          ►
                        </span>
                        <span>{contribution}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Famous Quote */}
                {scholar.famousQuote && (
                  <div>
                    <div className="flex items-center mb-3 pb-2 border-b" style={{ borderColor: `${theoryColor}30` }}>
                      <Quote className="w-5 h-5 mr-2" style={{ color: theoryColor }} />
                      <h3 className="font-serif font-bold text-lg tracking-wide" style={{ color: theoryColor }}>
                        NOTABLE QUOTATION
                      </h3>
                    </div>
                    <blockquote className="border-l-4 pl-4 py-2 italic text-gray-700 font-serif text-sm leading-relaxed" style={{ borderColor: theoryColor }}>
                      "{scholar.famousQuote}"
                    </blockquote>
                  </div>
                )}

                {/* Legacy */}
                <div>
                  <div className="flex items-center mb-3 pb-2 border-b" style={{ borderColor: `${theoryColor}30` }}>
                    <Award className="w-5 h-5 mr-2" style={{ color: theoryColor }} />
                    <h3 className="font-serif font-bold text-lg tracking-wide" style={{ color: theoryColor }}>
                      SCHOLARLY LEGACY
                    </h3>
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed font-serif">
                    {scholar.legacy}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50 border-t flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-lg font-semibold transition-colors font-serif"
                  style={{ backgroundColor: theoryColor, color: 'white' }}
                >
                  Close
                </button>
              </div>
            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ScholarModal;

