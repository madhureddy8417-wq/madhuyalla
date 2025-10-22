import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Language, Location } from '../types';
import { UI_STRINGS, AGRI_MOCK_LOCATIONS, AQUA_MOCK_LOCATIONS } from '../constants';
import { GpsIcon, AgriIcon, AquaIcon, ChevronDownIcon } from './icons';
import { reverseGeocode } from '../services/geminiService';

const LANGUAGES: Record<Language, string> = {
  english: 'English',
  telugu: 'తెలుగు',
  hindi: 'हिन्दी',
  kannada: 'ಕನ್ನಡ',
  tamil: 'தமிழ்',
  malayalam: 'മലയാളം',
  marathi: 'मराठी',
};


// A reusable autocomplete input component
const AutocompleteInput = ({ 
  label, 
  value, 
  onChange, 
  suggestions,
  disabled = false,
}: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void; 
  suggestions: string[];
  disabled?: boolean;
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
        className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
        required
        disabled={disabled}
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
  appMode: 'agri' | 'aqua';
  onModeChange: (mode: 'agri' | 'aqua') => void;
}

const Header: React.FC<HeaderProps> = ({ language, onLanguageChange, onLocationSet, appMode, onModeChange }) => {
  const T = UI_STRINGS[language];
  const [village, setVillage] = useState('');
  const [mandal, setMandal] = useState('');
  const [district, setDistrict] = useState('');
  const [constituency, setConstituency] = useState('');
  
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [inputMode, setInputMode] = useState<'address' | 'coords'>('address');

  const [error, setError] = useState('');
  const [isFetchingGps, setIsFetchingGps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  
  const prevLangRef = useRef(language);
  const prevAppModeRef = useRef(appMode);

  useEffect(() => {
    if (prevLangRef.current !== language || prevAppModeRef.current !== appMode) {
        setVillage('');
        setMandal('');
        setDistrict('');
        setConstituency('');
        setLatitude('');
        setLongitude('');
        setError('');
    }
    prevLangRef.current = language;
    prevAppModeRef.current = appMode;
  }, [language, appMode]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { districtSuggestions, mandalSuggestions, villageSuggestions, constituencySuggestions } = useMemo(() => {
    const isAgri = appMode === 'agri';
    const currentLocations = isAgri ? AGRI_MOCK_LOCATIONS[language] : AQUA_MOCK_LOCATIONS[language];
    
    const uniqueDistricts = [...new Set(currentLocations.map(l => l.district))];

    if (isAgri) {
        const filteredByDistrict = district ? currentLocations.filter(l => l.district === district) : currentLocations;
        const uniqueMandals = [...new Set(filteredByDistrict.map(l => l.mandal))];
        const filteredByMandal = mandal ? filteredByDistrict.filter(l => l.mandal === mandal) : filteredByDistrict;
        const uniqueVillages = [...new Set(filteredByMandal.map(l => l.village))];
        return { districtSuggestions: uniqueDistricts, mandalSuggestions: uniqueMandals as string[], villageSuggestions: uniqueVillages as string[], constituencySuggestions: [] };
    } else { // aqua
        const filteredByDistrict = district ? currentLocations.filter(l => l.district === district) : currentLocations;
        const uniqueConstituencies = [...new Set(filteredByDistrict.map(l => l.constituency))];
        return { districtSuggestions: uniqueDistricts, mandalSuggestions: [], villageSuggestions: [], constituencySuggestions: uniqueConstituencies as string[] };
    }
  }, [district, mandal, language, appMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (inputMode === 'coords') {
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);

        if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            setError(T.invalidCoords);
            return;
        }

        setIsSubmitting(true);
        try {
            const locationData = await reverseGeocode({ latitude: lat, longitude: lon }, language);
            setDistrict(locationData.district || '');
            if (appMode === 'agri') {
                setMandal(locationData.mandal || '');
                setVillage(locationData.village || '');
                setConstituency(''); // Clear other mode's field
            } else {
                setConstituency(locationData.constituency || '');
                setMandal(''); // Clear other mode's fields
                setVillage('');
            }
            onLocationSet(locationData);
        } catch (e: any) {
            setError(e.message || 'Could not determine location from coordinates.');
        } finally {
            setIsSubmitting(false);
        }
    } else { // 'address' mode
        if (appMode === 'agri') {
            if (village && mandal && district) {
                onLocationSet({ village, mandal, district });
            } else {
                setError('Please fill all fields.');
            }
        } else { // 'aqua' mode
            if (constituency && district) {
                onLocationSet({ district, constituency });
            } else {
                setError('Please fill all fields.');
            }
        }
    }
  }
  
  const handleUseCurrentLocation = async () => {
    setIsFetchingGps(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setIsFetchingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const locationData = await reverseGeocode({ latitude, longitude }, language);
          setDistrict(locationData.district || '');
          if (appMode === 'agri') {
              setMandal(locationData.mandal || '');
              setVillage(locationData.village || '');
              setConstituency('');
          } else {
              setMandal('');
              setVillage('');
              setConstituency(locationData.constituency || '');
          }
          onLocationSet(locationData);
        } catch (e: any) {
          setError(e.message || 'Could not determine location. Please enter manually.');
        } finally {
          setIsFetchingGps(false);
        }
      },
      () => {
        setError('Unable to retrieve your location. Please enable location services and try again.');
        setIsFetchingGps(false);
      }
    );
  };

  const ModeButton: React.FC<{ mode: 'agri' | 'aqua'; label: string }> = ({ mode, label }) => (
    <button
      onClick={() => onModeChange(mode)}
      className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors w-full
        ${appMode === mode
          ? (mode === 'agri' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white')
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
    >
      {label}
    </button>
  );
  
  const handleLangSelect = (langCode: Language) => {
    onLanguageChange(langCode);
    setIsLangDropdownOpen(false);
  };

  const isFormDisabled = isFetchingGps || isSubmitting;

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-md sticky top-0 z-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            {appMode === 'agri' ? <AgriIcon /> : <AquaIcon />}
            <h1 className="text-2xl font-bold text-gray-800 ml-3">{T.title[appMode]}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex border border-gray-300 rounded-md p-0.5 w-40">
                <ModeButton mode="agri" label="AGRI" />
                <ModeButton mode="aqua" label="AQUA" />
            </div>
            <div ref={langDropdownRef} className="relative">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="px-3 py-1 text-sm font-semibold rounded-md transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300 flex items-center"
              >
                <span>{LANGUAGES[language]}</span>
                <ChevronDownIcon />
              </button>
              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-30">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    {(Object.keys(LANGUAGES) as Language[]).map(langCode => (
                      <button
                        key={langCode}
                        onClick={() => handleLangSelect(langCode)}
                        className={`block w-full text-left px-4 py-2 text-sm ${language === langCode ? 'bg-green-100 text-green-800' : 'text-gray-700'} hover:bg-gray-100`}
                        role="menuitem"
                      >
                        {LANGUAGES[langCode]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 bg-gray-200 rounded-lg mb-3 w-max">
            <button type="button" onClick={() => setInputMode('address')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${inputMode === 'address' ? 'bg-white shadow' : 'text-gray-600'}`}>{T.address}</button>
            <button type="button" onClick={() => setInputMode('coords')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${inputMode === 'coords' ? 'bg-white shadow' : 'text-gray-600'}`}>{T.coordinates}</button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-end gap-3">
            {inputMode === 'address' ? (
                <>
                    <AutocompleteInput label={T.district} value={district} onChange={setDistrict} suggestions={districtSuggestions} disabled={isFormDisabled} />
                    {appMode === 'agri' ? (
                        <>
                            <AutocompleteInput label={T.mandal} value={mandal} onChange={setMandal} suggestions={mandalSuggestions} disabled={isFormDisabled} />
                            <AutocompleteInput label={T.village} value={village} onChange={setVillage} suggestions={villageSuggestions} disabled={isFormDisabled} />
                        </>
                    ) : (
                        <AutocompleteInput label={T.constituency} value={constituency} onChange={setConstituency} suggestions={constituencySuggestions} disabled={isFormDisabled} />
                    )}
                </>
            ) : (
                <>
                    <div className="relative flex-1">
                        <label className="block text-green-800 text-xs font-bold mb-1">{T.latitude}</label>
                        <input
                            type="number"
                            step="any"
                            value={latitude}
                            onChange={(e) => setLatitude(e.target.value)}
                            className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                            required
                            disabled={isFormDisabled}
                        />
                    </div>
                    <div className="relative flex-1">
                        <label className="block text-green-800 text-xs font-bold mb-1">{T.longitude}</label>
                        <input
                            type="number"
                            step="any"
                            value={longitude}
                            onChange={(e) => setLongitude(e.target.value)}
                            className="shadow-sm appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                            required
                            disabled={isFormDisabled}
                        />
                    </div>
                    {/* Spacer to align buttons */}
                    {appMode === 'agri' && <div className="flex-1 hidden sm:block" />} 
                </>
            )}

            <div className="flex gap-3 w-full sm:w-auto">
                <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isFormDisabled}
                    title={T.useCurrentLocation}
                    className="w-full sm:w-auto bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-300 rounded-lg shadow-sm transition duration-300 disabled:opacity-50 disabled:cursor-wait flex items-center justify-center h-10"
                >
                    {isFetchingGps ? (
                        <svg className="animate-spin h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <GpsIcon />
                    )}
                    <span className="ml-2 sm:hidden md:inline">{isFetchingGps ? T.fetchingLocation : T.useCurrentLocation}</span>
                </button>
                <button type="submit" disabled={isFormDisabled} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300 h-10 flex items-center justify-center disabled:opacity-50">
                    {isSubmitting ? (
                         <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        T.setLocation
                    )}
                </button>
            </div>
        </form>
        {error && <p className="text-red-500 text-xs mt-1 text-center sm:text-left">{error}</p>}
      </div>
    </header>
  );
};

export default Header;