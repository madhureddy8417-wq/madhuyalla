import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Language, Location } from '../types';
import { UI_STRINGS, MOCK_LOCATIONS } from '../constants';
import { GpsIcon } from './icons';
import { reverseGeocode } from '../services/geminiService';

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
    setShowSuggestions(!!userInput);
  };

  const handleClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
  };

  const filteredSuggestions = useMemo(() => 
    suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 10),
    [suggestions, value]
  );

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <label className="block text-green-800 text-xs font-bold mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => { if(value) setShowSuggestions(true); }}
        className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500"
        required
      />
      {showSuggestions && value && filteredSuggestions.length > 0 && (
        <ul className="absolute z-30 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-48 overflow-auto shadow-lg">
          {filteredSuggestions.map((suggestion) => (
            <li key={suggestion} onClick={() => handleClick(suggestion)} className="p-2 cursor-pointer hover:bg-green-100">
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};


interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onLocationSet: (location: Location) => void;
}

const Header: React.FC<HeaderProps> = ({ language, onLanguageChange, onLocationSet }) => {
  const T = UI_STRINGS[language];
  const [village, setVillage] = useState('');
  const [mandal, setMandal] = useState('');
  const [district, setDistrict] = useState('');
  const [error, setError] = useState('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  
  // FIX: Initialize useRef with null to provide an initial argument.
  const prevLangRef = useRef<Language | null>(null);
  useEffect(() => {
    if (prevLangRef.current && prevLangRef.current !== language) {
        setVillage('');
        setMandal('');
        setDistrict('');
        setError('');
    }
    prevLangRef.current = language;
  }, [language]);

  const { districtSuggestions, mandalSuggestions, villageSuggestions } = useMemo(() => {
    const currentLocations = MOCK_LOCATIONS[language];
    const uniqueDistricts = [...new Set(currentLocations.map(l => l.district))];
    const filteredByDistrict = district ? currentLocations.filter(l => l.district === district) : currentLocations;
    const uniqueMandals = [...new Set(filteredByDistrict.map(l => l.mandal))];
    const filteredByMandal = mandal ? filteredByDistrict.filter(l => l.mandal === mandal) : filteredByDistrict;
    const uniqueVillages = [...new Set(filteredByMandal.map(l => l.village))];
    return { districtSuggestions: uniqueDistricts, mandalSuggestions: uniqueMandals, villageSuggestions: uniqueVillages };
  }, [district, mandal, language]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (village && mandal && district) {
        setError('');
        onLocationSet({ village, mandal, district });
    } else {
        setError('Please fill all fields.');
    }
  }
  
  const handleUseCurrentLocation = async () => {
    setIsFetchingLocation(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setIsFetchingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const locationData = await reverseGeocode({ latitude, longitude }, language);
          setDistrict(locationData.district);
          setMandal(locationData.mandal);
          setVillage(locationData.village);
        } catch (e: any) {
          setError(e.message || 'Could not determine location. Please enter manually.');
        } finally {
          setIsFetchingLocation(false);
        }
      },
      () => {
        setError('Unable to retrieve your location. Please enable location services and try again.');
        setIsFetchingLocation(false);
      }
    );
  };

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.8 4.879A2 2 0 0110 4h4a2 2 0 011.752.879l1.4 2.8A2 2 0 0115.752 11H8.248a2 2 0 01-1.4-3.321l1.4-2.8zM5 19h14" />
            </svg>
            <h1 className="text-2xl font-bold text-gray-800 ml-3">{T.title}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => onLanguageChange('english')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${language === 'english' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>English</button>
            <button onClick={() => onLanguageChange('telugu')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${language === 'telugu' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>తెలుగు</button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-end gap-3">
            <AutocompleteInput label={T.district} value={district} onChange={setDistrict} suggestions={districtSuggestions} />
            <AutocompleteInput label={T.mandal} value={mandal} onChange={setMandal} suggestions={mandalSuggestions} />
            <AutocompleteInput label={T.village} value={village} onChange={setVillage} suggestions={villageSuggestions} />
            <div className="flex gap-3 w-full sm:w-auto">
                <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isFetchingLocation}
                    title={T.useCurrentLocation}
                    className="w-full sm:w-auto bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded-lg shadow-sm transition duration-300 disabled:opacity-50 disabled:cursor-wait flex items-center justify-center h-10"
                >
                    {isFetchingLocation ? (
                        <svg className="animate-spin h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <GpsIcon />
                    )}
                    <span className="ml-2 sm:hidden md:inline">{isFetchingLocation ? T.fetchingLocation : T.useCurrentLocation}</span>
                </button>
                <button type="submit" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300 h-10">{T.setLocation}</button>
            </div>
        </form>
        {error && <p className="text-red-500 text-xs mt-1 text-center sm:text-left">{error}</p>}
      </div>
    </header>
  );
};

export default Header;