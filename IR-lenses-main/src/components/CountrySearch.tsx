import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MapPin, Sparkles } from 'lucide-react';
import { getCountriesForEvent, getCountryInfo, CountryInfo } from '../data/countries';

interface CountrySearchProps {
  currentEvent: string | null;
  currentTheory: string | null;
  onCountrySelect: (country: CountryInfo) => void;
}

function CountrySearch({ currentEvent, onCountrySelect }: CountrySearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const availableCountries = currentEvent ? getCountriesForEvent(currentEvent) : [];
  
  const filteredCountries = availableCountries.filter(country =>
    country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCountryClick = (countryName: string) => {
    if (!currentEvent) return;
    
    const countryInfo = getCountryInfo(countryName, currentEvent);
    if (countryInfo) {
      onCountrySelect(countryInfo);
      setSelectedCountries(prev => 
        prev.includes(countryName) ? prev : [...prev, countryName]
      );
      setSearchTerm('');
      setIsOpen(false);
    }
  };

  const removeCountry = (countryName: string) => {
    setSelectedCountries(prev => prev.filter(c => c !== countryName));
  };

  return (
    <div className="mb-6">
      {/* Search Bar */}
      <div className="relative">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder={currentEvent ? "Search for a country (e.g., Syria, Turkey, Brazil)..." : "Select an event first"}
              disabled={!currentEvent}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-serif text-sm disabled:bg-gray-100"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setIsOpen(false);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:bg-gray-100 rounded p-1"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
          
          {selectedCountries.length > 0 && (
            <div className="text-sm font-serif text-gray-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
              <Sparkles className="inline w-4 h-4 mr-1" />
              {selectedCountries.length} selected
            </div>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        <AnimatePresence>
          {isOpen && filteredCountries.length > 0 && searchTerm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto"
            >
              <div className="p-2">
                <div className="text-xs uppercase tracking-wide font-semibold text-gray-500 px-3 py-2 font-serif">
                  Available Countries ({filteredCountries.length})
                </div>
                {filteredCountries.map((country) => {
                  const countryInfo = getCountryInfo(country, currentEvent!);
                  const isSelected = selectedCountries.includes(country);
                  
                  return (
                    <button
                      key={country}
                      onClick={() => handleCountryClick(country)}
                      className={`w-full text-left px-4 py-3 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-between ${
                        isSelected ? 'bg-blue-100' : ''
                      }`}
                    >
                      <div>
                        <div className="font-semibold font-serif text-gray-900">{country}</div>
                        {countryInfo && (
                          <div className="text-xs text-gray-600 font-serif mt-0.5">
                            {countryInfo.region} • {countryInfo.events[currentEvent!].role}
                          </div>
                        )}
                      </div>
                      <MapPin className="w-4 h-4 text-blue-600" />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Selected Countries Pills */}
      {selectedCountries.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedCountries.map(country => (
            <motion.div
              key={country}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full border border-blue-300"
            >
              <MapPin className="w-3 h-3" />
              <span className="text-sm font-semibold font-serif">{country}</span>
              <button
                onClick={() => removeCountry(country)}
                className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
          {selectedCountries.length > 1 && (
            <button
              onClick={() => setSelectedCountries([])}
              className="text-xs text-gray-600 hover:text-gray-900 font-serif underline"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Quick Suggestions */}
      {!searchTerm && currentEvent === 'cold-war' && selectedCountries.length === 0 && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xs uppercase tracking-wide font-semibold text-gray-600 mb-2 font-serif">
            Popular Searches:
          </div>
          <div className="flex flex-wrap gap-2">
            {['Syria', 'Turkey', 'Egypt', 'Israel', 'Cuba', 'Vietnam'].map(country => (
              <button
                key={country}
                onClick={() => handleCountryClick(country)}
                className="text-xs px-3 py-1.5 bg-white border border-gray-300 hover:border-blue-500 hover:bg-blue-50 rounded-full font-serif transition-colors"
              >
                {country}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CountrySearch;

