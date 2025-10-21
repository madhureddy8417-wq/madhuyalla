
import React, { useState, useMemo, useRef, useEffect } from 'react';
// FIX: The 'MOCK_LOCATIONS' export does not exist. This component appears to be for 'agri' mode,
// so AGRI_MOCK_LOCATIONS is imported and aliased to MOCK_LOCATIONS.
import { UI_STRINGS, AGRI_MOCK_LOCATIONS as MOCK_LOCATIONS } from '../constants';
import type { Language } from '../types';

interface LocationFormProps {
  language: Language;
  onSubmit: (location: { village: string; mandal: string; district: string }) => void;
  isLoading: boolean;
}

// A reusable autocomplete input component
const AutocompleteInput = ({ 
  label, 
  value, 
  onChange, 
  suggestions 
}: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void; 
  suggestions: string[];
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const userInput = e.currentTarget.value;
    onChange(userInput);
    
    if (userInput) {
      const filtered = suggestions.filter(
        suggestion => suggestion.toLowerCase().includes(userInput.toLowerCase())
      );
      setFilteredSuggestions(filtered.slice(0, 10)); // Limit suggestions
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
    setActiveIndex(-1);
  };

  const handleClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prevIndex => (prevIndex < filteredSuggestions.length - 1 ? prevIndex + 1 : prevIndex));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prevIndex => (prevIndex > 0 ? prevIndex - 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex > -1 && filteredSuggestions[activeIndex]) {
          handleClick(filteredSuggestions[activeIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-green-800 text-sm font-bold mb-2">{label}</label>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { if(value) setShowSuggestions(true); }}
        className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500"
        required
      />
      {showSuggestions && value && filteredSuggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-auto shadow-lg">
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              onClick={() => handleClick(suggestion)}
              className={`p-2 cursor-pointer hover:bg-green-100 ${index === activeIndex ? 'bg-green-100' : ''}`}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};


const LocationForm: React.FC<LocationFormProps> = ({ language, onSubmit, isLoading }) => {
  const [village, setVillage] = useState('');
  const [mandal, setMandal] = useState('');
  const [district, setDistrict] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const T = UI_STRINGS[language];

  // FIX: Initialize useRef with null to provide an initial argument.
  const prevLangRef = useRef<Language | null>(null);
  useEffect(() => {
    if (prevLangRef.current && prevLangRef.current !== language) {
        setVillage('');
        setMandal('');
        setDistrict('');
    }
    prevLangRef.current = language;
  }, [language]);

  const { districtSuggestions, mandalSuggestions, villageSuggestions } = useMemo(() => {
    const currentLocations = MOCK_LOCATIONS[language];

    const uniqueDistricts = [...new Set(currentLocations.map(l => l.district))];
    
    let filteredMandals = currentLocations;
    if (district) {
        filteredMandals = filteredMandals.filter(l => l.district === district);
    }
    const uniqueMandals = [...new Set(filteredMandals.map(l => l.mandal))];

    let filteredVillages = currentLocations;
    if (district) {
        filteredVillages = filteredVillages.filter(l => l.district === district);
    }
    if (mandal) {
        filteredVillages = filteredVillages.filter(l => l.mandal === mandal);
    }
    const uniqueVillages = [...new Set(filteredVillages.map(l => l.village))];

    return { 
        districtSuggestions: uniqueDistricts, 
        mandalSuggestions: uniqueMandals, 
        villageSuggestions: uniqueVillages 
    };
  }, [district, mandal, language]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (village && mandal && district) {
      setFormError(null);
      onSubmit({ village, mandal, district });
    } else {
      // FIX: Replace alert with a state-based error for better UX and to avoid potential side effects.
      setFormError("Please fill in all location fields.");
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AutocompleteInput label={T.district} value={district} onChange={setDistrict} suggestions={districtSuggestions} />
          <AutocompleteInput label={T.mandal} value={mandal} onChange={setMandal} suggestions={mandalSuggestions} />
          <AutocompleteInput label={T.village} value={village} onChange={setVillage} suggestions={villageSuggestions} />
        </div>
        
        <div>
          {formError && <p className="text-sm text-red-600 text-center mb-4">{formError}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-4 rounded-lg transition duration-300 disabled:bg-green-400 disabled:cursor-not-allowed flex items-center justify-center text-lg"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {T.generatingReport}
              </>
            ) : (
              T.generateReport
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LocationForm;