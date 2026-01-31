import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Globe, BookOpen, Brain } from 'lucide-react';
import LensExplorer from './pages/LensExplorer';
import ScenarioQuiz from './pages/ScenarioQuiz';
import Home from './pages/Home';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Work in Progress Banner */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-2 px-4 text-center font-serif">
          <p className="text-sm font-semibold">
            ⚠️ WORK IN PROGRESS - Platform Under Active Development
          </p>
        </div>
        
        <nav className="bg-white shadow-lg border-b-4 border-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center space-x-3">
                <Globe className="w-8 h-8 text-blue-600" />
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  IR Lenses
                </span>
              </Link>
              
              <div className="flex space-x-8">
                <Link
                  to="/explorer"
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <BookOpen className="w-5 h-5" />
                  <span className="font-medium">Theory Explorer</span>
                </Link>
                <Link
                  to="/scenarios"
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <Brain className="w-5 h-5" />
                  <span className="font-medium">Test Your Lens</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explorer" element={<LensExplorer />} />
            <Route path="/scenarios" element={<ScenarioQuiz />} />
          </Routes>
        </main>

        <footer className="bg-white border-t mt-20 py-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            {/* Copyright Notice */}
            <div className="mb-6 p-6 bg-gray-50 rounded-lg border-2 border-gray-300">
              <p className="text-sm font-serif font-semibold text-gray-800 mb-3">
                COPYRIGHT & INTELLECTUAL PROPERTY NOTICE
              </p>
              <div className="text-xs text-gray-700 font-serif leading-relaxed space-y-2 max-w-4xl mx-auto">
                <p>
                  © 2024 <strong>Ibrahim Al ksibati</strong>. All Rights Reserved.
                </p>
                <p>
                  This educational platform, including but not limited to its concept, design, methodology, 
                  interactive features, database structure, theoretical framework integration, and all associated 
                  code and content, is the original intellectual property of <strong>Ibrahim Al ksibati</strong>.
                </p>
                <p className="font-semibold text-gray-900">
                  LEGAL WARNING: Unauthorized reproduction, distribution, modification, or commercial use of 
                  this platform or any of its components without explicit written permission from Ibrahim Al ksibati 
                  is strictly prohibited and will result in legal action including but not limited to claims for 
                  copyright infringement, intellectual property theft, and damages under applicable international 
                  and domestic law.
                </p>
                <p>
                  For licensing inquiries, permissions, or collaborations, please contact Ibrahim Al ksibati directly.
                </p>
              </div>
            </div>
            
            {/* Platform Info */}
            <div className="text-gray-600">
              <p className="font-serif">IR Lenses - Understanding International Relations Through Theory</p>
              <p className="text-sm mt-2 font-serif">Built for students and professionals in Political Science and International Relations</p>
              <p className="text-xs mt-3 text-gray-500 font-serif">
                Platform Version: 1.0 Beta | Last Updated: October 2024
              </p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;

