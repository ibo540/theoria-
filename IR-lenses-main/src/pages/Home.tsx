import { Link } from 'react-router-dom';
import { ArrowRight, Eye, Map, TrendingUp, Users } from 'lucide-react';

function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          See the World Through <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Different Lenses</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Understand how different International Relations theories interpret the same historical events.
          Apply theoretical lenses to see how perspectives shape our understanding of global politics.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <Link
          to="/explorer"
          className="group bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all border-2 border-transparent hover:border-blue-500"
        >
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Map className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold ml-4 group-hover:text-blue-600 transition-colors">
              Theory Explorer
            </h2>
          </div>
          <p className="text-gray-600 mb-4">
            Select a historical event and apply different theoretical lenses to see how each theory
            interprets the same situation differently. Watch as the map transforms with each perspective.
          </p>
          <div className="flex items-center text-blue-600 font-semibold">
            Explore Now <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </div>
        </Link>

        <Link
          to="/scenarios"
          className="group bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition-all border-2 border-transparent hover:border-purple-500"
        >
          <div className="flex items-center mb-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Eye className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold ml-4 group-hover:text-purple-600 transition-colors">
              Test Your Lens
            </h2>
          </div>
          <p className="text-gray-600 mb-4">
            Answer scenario-based questions to discover which IR theory aligns with your worldview.
            Understand your own theoretical perspective through practical decision-making.
          </p>
          <div className="flex items-center text-purple-600 font-semibold">
            Take Quiz <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </div>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Select an Event</h3>
            <p className="text-gray-600">
              Choose from major historical events like the Cold War, WWI, Cuban Missile Crisis, and more.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Apply a Theory</h3>
            <p className="text-gray-600">
              Watch as the lens overlays the map, transforming your view through Realism, Liberalism, or other theories.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Understand Deeper</h3>
            <p className="text-gray-600">
              Explore data visualizations, key principles, and interpretations that bring theory to life.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Begin?</h2>
        <p className="text-xl mb-6 opacity-90">
          Start exploring how different theoretical perspectives shape our understanding of international relations.
        </p>
        <Link
          to="/explorer"
          className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
        >
          Launch Theory Explorer
        </Link>
      </div>
    </div>
  );
}

export default Home;

