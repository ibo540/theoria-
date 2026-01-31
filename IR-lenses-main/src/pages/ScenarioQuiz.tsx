import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, RotateCcw } from 'lucide-react';
import { scenarios } from '../data/scenarios';
import AIAssistant from '../components/AIAssistant';

interface Answer {
  scenarioId: string;
  selectedOption: number;
}

// Shuffle array function
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function ScenarioQuiz() {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<any[]>([]);
  const [originalIndices, setOriginalIndices] = useState<number[]>([]);

  const scenario = scenarios[currentScenario];

  // Shuffle options when scenario changes
  useEffect(() => {
    const optionsWithIndices = scenario.options.map((opt, idx) => ({ ...opt, originalIndex: idx }));
    const shuffled = shuffleArray(optionsWithIndices);
    setShuffledOptions(shuffled);
    setOriginalIndices(shuffled.map(opt => opt.originalIndex));
  }, [currentScenario, scenario.options]);

  const handleOptionSelect = (displayIndex: number) => {
    setSelectedOption(displayIndex);
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (selectedOption !== null) {
      // Store original index for scoring
      const originalIndex = originalIndices[selectedOption];
      setAnswers([...answers, {
        scenarioId: scenario.id,
        selectedOption: originalIndex
      }]);
      
      if (currentScenario < scenarios.length - 1) {
        setCurrentScenario(currentScenario + 1);
        setSelectedOption(null);
        setShowExplanation(false);
      } else {
        setQuizComplete(true);
      }
    }
  };

  const handleRestart = () => {
    setCurrentScenario(0);
    setAnswers([]);
    setSelectedOption(null);
    setShowExplanation(false);
    setQuizComplete(false);
  };

  const calculateResults = () => {
    const theoryCount: { [key: string]: number } = {};
    
    answers.forEach(answer => {
      const scenarioData = scenarios.find(s => s.id === answer.scenarioId);
      if (scenarioData) {
        const alignment = scenarioData.options[answer.selectedOption].theoryAlignment;
        theoryCount[alignment] = (theoryCount[alignment] || 0) + 1;
      }
    });

    return Object.entries(theoryCount)
      .sort(([, a], [, b]) => b - a)
      .map(([theory, count]) => ({ theory, count }));
  };

  if (quizComplete) {
    const results = calculateResults();
    const dominantTheory = results[0]?.theory;

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Quiz Complete!</h1>
            <p className="text-xl text-gray-600">Here's your theoretical perspective profile</p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Your Results</h2>
            <div className="space-y-4">
              {results.map(({ theory, count }) => (
                <div key={theory} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-lg">{theory}</span>
                    <span className="text-gray-600">{count} / {scenarios.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${(count / scenarios.length) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {dominantTheory && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold mb-2">Your Dominant Lens: {dominantTheory}</h3>
              <p className="text-gray-700">
                Your responses suggest you tend to view international relations through the lens of {dominantTheory}.
                This doesn't mean you always think this way, but it indicates a preference for this theoretical framework
                when analyzing global politics.
              </p>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={handleRestart}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Retake Quiz</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Test Your Theoretical Lens</h1>
          <span className="text-gray-600 font-medium">
            Question {currentScenario + 1} of {scenarios.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentScenario + 1) / scenarios.length) * 100}%` }}
          />
        </div>
      </div>

      <motion.div
        key={scenario.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-xl shadow-lg p-8"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{scenario.title}</h2>
        <div className="bg-gray-50 border-l-4 border-blue-500 p-6 rounded-lg mb-6">
          <p className="text-gray-800 text-lg leading-relaxed">{scenario.situation}</p>
        </div>

        <div className="space-y-4 mb-6">
          {shuffledOptions.map((option, index) => (
            <motion.button
              key={index}
              onClick={() => handleOptionSelect(index)}
              disabled={selectedOption !== null}
              whileHover={{ scale: selectedOption === null ? 1.02 : 1 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full text-left p-5 rounded-lg border-2 transition-all ${
                selectedOption === index
                  ? 'border-blue-500 bg-blue-50'
                  : selectedOption === null
                  ? 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start">
                <span className="bg-blue-100 text-blue-600 font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                  {String.fromCharCode(65 + index)}
                </span>
                <p className="ml-4 text-gray-800">{option.text}</p>
              </div>
            </motion.button>
          ))}
        </div>

        {showExplanation && selectedOption !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6"
          >
            <h3 className="font-bold text-lg text-green-800 mb-2 font-serif">
              Theory Alignment: {shuffledOptions[selectedOption].theoryAlignment}
            </h3>
            <p className="text-gray-700 font-serif leading-relaxed">{shuffledOptions[selectedOption].explanation}</p>
          </motion.div>
        )}

        {selectedOption !== null && (
          <div className="flex justify-end">
            <button
              onClick={handleNext}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              {currentScenario < scenarios.length - 1 ? 'Next Question' : 'See Results'}
            </button>
          </div>
        )}
      </motion.div>

      {/* AI Assistant */}
      <AIAssistant />
    </div>
  );
}

export default ScenarioQuiz;

