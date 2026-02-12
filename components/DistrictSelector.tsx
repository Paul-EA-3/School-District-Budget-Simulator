
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2, ArrowRight, Building2, School, AlertCircle, CheckCircle2 } from 'lucide-react';
import Logo from './Logo';
import genAI, { FAST_MODEL, generateAIContent } from '../services/gemini';

// Fix for missing google types
declare global {
  interface Window {
    google: any;
  }
}
declare var google: any;

interface DistrictContext {
  name: string;
  location: string;
  state: string;
  description?: string;
}

interface DistrictSelectorProps {
  onSelect: (context: DistrictContext) => void;
}

// --- Helper: Custom Autocomplete Component ---
interface AutocompleteProps {
  placeholder: string;
  onSelect: (placeId: string, description: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
}

const CustomPlacesAutocomplete: React.FC<AutocompleteProps> = ({ placeholder, onSelect, autoFocus, disabled, className }) => {
  const [inputValue, setInputValue] = useState('');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [mapsReady, setMapsReady] = useState(false);
  
  const autocompleteService = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Wait for Google API to load
  useEffect(() => {
    const startTime = Date.now();
    const timeout = 3000;
    let timeoutId: ReturnType<typeof setTimeout>;

    const waitForGoogle = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        setMapsReady(true);
      } else {
        if (Date.now() - startTime < timeout) {
          timeoutId = setTimeout(waitForGoogle, 200);
        }
      }
    };
    waitForGoogle();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (!value.trim() || !autocompleteService.current) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    autocompleteService.current.getPlacePredictions({
      input: value,
      componentRestrictions: { country: 'us' }
    }, (results: any, status: any) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        setPredictions(results);
        setIsOpen(true);
        setActiveIndex(-1);
      } else {
        setPredictions([]);
        setIsOpen(false);
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < predictions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && predictions[activeIndex]) {
        handleSelect(predictions[activeIndex]);
      } else if (predictions.length > 0) {
        handleSelect(predictions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (prediction: any) => {
    setInputValue(prediction.description);
    setIsOpen(false);
    onSelect(prediction.place_id, prediction.description);
  };

  const isDisabled = disabled || !mapsReady;

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative border-2 border-blue-400 rounded-lg bg-white shadow-[0_0_0_4px_rgba(96,165,250,0.2)] flex items-center overflow-hidden transition-all focus-within:border-blue-600">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={!mapsReady ? "Initializing Google Maps..." : placeholder}
          className="w-full h-[50px] px-4 text-lg outline-none text-slate-700 placeholder:text-slate-400 bg-transparent"
          autoFocus={autoFocus}
          disabled={isDisabled}
        />
        <div className="pr-4 text-slate-400">
            {isDisabled ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
        </div>
      </div>

      {isOpen && predictions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white mt-2 rounded-lg shadow-xl border border-slate-100 max-h-[300px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {predictions.map((prediction, index) => (
            <li
              key={prediction.place_id}
              className={`px-4 py-3 cursor-pointer flex items-start gap-3 border-b border-slate-50 last:border-0 transition-colors ${
                index === activeIndex ? 'bg-indigo-50' : 'hover:bg-slate-50'
              }`}
              onClick={() => handleSelect(prediction)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <div className="mt-1 p-1.5 bg-slate-100 rounded-full text-slate-500">
                <MapPin className="w-3 h-3" />
              </div>
              <div>
                <div className="font-bold text-sm text-slate-800">
                  {prediction.structured_formatting.main_text}
                </div>
                <div className="text-xs text-slate-500">
                  {prediction.structured_formatting.secondary_text}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};


// --- Main Component ---
const DistrictSelector: React.FC<DistrictSelectorProps> = ({ onSelect }) => {
  const [step, setStep] = useState<'search' | 'validate'>('search');
  
  // Data
  const [placeDetails, setPlaceDetails] = useState<any>(null);
  const [districtName, setDistrictName] = useState('');
  const [districtState, setDistrictState] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  
  // Loading States
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapsServiceReady, setMapsServiceReady] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  const placesService = useRef<any>(null);

  // Initialize Places Service Robustly with Timeout Fallback
  useEffect(() => {
    const startTime = Date.now();
    const timeout = 3000; // 3 seconds timeout
    let timeoutId: ReturnType<typeof setTimeout>;

    const initService = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        // Create a virtual map div as required by the PlacesService
        const mapDiv = document.createElement('div'); 
        placesService.current = new window.google.maps.places.PlacesService(mapDiv);
        setMapsServiceReady(true);
        setUseFallback(false);
      } else {
        if (Date.now() - startTime > timeout) {
          console.warn("Google Maps API failed to load within timeout. Using fallback mode.");
          setUseFallback(true);
        } else {
          timeoutId = setTimeout(initService, 200);
        }
      }
    };
    initService();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // -------------------------------------------------------------------------
  // LOGIC: Fetch Details & AI Identity
  // -------------------------------------------------------------------------
  const handleSearchSelect = (placeId: string, description: string) => {
    setIsLoadingDetails(true);
    setError(null);

    // Wait loop if service is somehow strictly null but map loaded
    if (!placesService.current) {
        // If not ready, try one emergency init or fail gracefully
        if (window.google && window.google.maps) {
             const mapDiv = document.createElement('div');
             placesService.current = new window.google.maps.places.PlacesService(mapDiv);
        } else {
             setError("Google Maps API not fully loaded. Please refresh.");
             setIsLoadingDetails(false);
             return;
        }
    }

    const request = {
      placeId: placeId,
      fields: ['name', 'formatted_address', 'address_components', 'geometry']
    };

    placesService.current?.getDetails(request, (place: any, status: any) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place) {
        setPlaceDetails(place);
        
        // Basic State Extraction
        const stateComponent = place.address_components?.find((c: any) => c.types.includes('administrative_area_level_1'));
        setDistrictState(stateComponent ? stateComponent.long_name : '');
        setDistrictName(place.name || ''); // Default to place name

        // AUTO PROGRESS
        setStep('validate');
        
        // Start AI Analysis
        identifyDistrictWithAI(place.name || '', place.formatted_address || '');
      } else {
        console.error("Places API Error:", status);
        setError("Failed to retrieve details. Please select a valid location.");
      }
      setIsLoadingDetails(false);
    });
  };

  const identifyDistrictWithAI = async (name: string, address: string) => {
    setIsIdentifying(true);
    try {
        const response = await generateAIContent(FAST_MODEL, `I have a user selecting a school in the United States.
            School Name: ${name}
            Address: ${address}
            
            Task: Identify the official name of the School District (LEA) that this specific school belongs to.
            If the selected place IS a school district, return its name.
            
            Return ONLY the School District Name (e.g., "Los Angeles Unified School District"). Do not add extra text.
        `);

        const text = response.text?.trim();
        if (text) setDistrictName(text);
    } catch (e) {
        console.error("AI Identification failed", e);
    } finally {
        setIsIdentifying(false);
    }
  };

  const handleDistrictSelect = (placeId: string, description: string) => {
      if (!placesService.current) return;
      
      placesService.current.getDetails({ placeId, fields: ['name', 'address_components'] }, (place: any, status: any) => {
          if (place && status === google.maps.places.PlacesServiceStatus.OK) {
              setDistrictName(place.name || '');
              const stateComponent = place.address_components?.find((c: any) => c.types.includes('administrative_area_level_1'));
              if (stateComponent) setDistrictState(stateComponent.long_name);
          }
      });
  };

  const handleConfirm = () => {
      onSelect({
          name: districtName,
          location: placeDetails?.formatted_address || `${districtName}, ${districtState}`,
          state: districtState,
          description: placeDetails?.formatted_address ? `Located in ${placeDetails.formatted_address}` : `Manual entry for ${districtName}, ${districtState}`
      });
  };

  const handleReset = () => {
      setStep('search');
      setPlaceDetails(null);
      setDistrictName('');
      setDistrictState('');
      setError(null);
  };

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-visible w-full max-w-3xl mx-auto flex flex-col animate-in zoom-in-95 duration-500 border border-slate-100 min-h-[500px]">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-100 p-6 flex justify-between items-center shrink-0 rounded-t-2xl">
        <div className="flex items-center gap-4">
            <Logo className="h-8" />
            <div className="hidden md:block w-px h-6 bg-slate-200"></div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">District Setup</div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 flex-1 flex flex-col relative">
        
        {step === 'search' && (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-8 max-w-lg">
                    <h2 className="text-3xl font-bold text-indigo-900 mb-3">Identify Your District</h2>
                    <p className="text-slate-600 leading-relaxed">
                        Search for a Public School or School District to initialize the simulation with real-world context from your state.
                    </p>
                </div>

                <div className="w-full max-w-lg relative z-50">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2 text-left">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {isLoadingDetails ? (
                        <div className="w-full h-[50px] border-2 border-blue-400 rounded-lg bg-blue-50 flex items-center justify-center gap-2 text-indigo-600 font-medium animate-pulse">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Retrieving School Details...
                        </div>
                    ) : useFallback ? (
                        <div className="w-full space-y-4 animate-in fade-in duration-500">
                             <div className="text-left">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">School District Name</label>
                                <input
                                    type="text"
                                    className="w-full border-2 border-blue-400 rounded-lg p-3 text-lg outline-none text-slate-700 focus:border-blue-600 transition-all shadow-[0_0_0_4px_rgba(96,165,250,0.1)]"
                                    placeholder="Enter District Name (e.g. Springfield Public Schools)"
                                    value={districtName}
                                    onChange={(e) => setDistrictName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="text-left">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">State</label>
                                <select
                                    className="w-full border-2 border-slate-200 rounded-lg p-3 text-lg outline-none text-slate-700 focus:border-blue-400 transition-all bg-white"
                                    value={districtState}
                                    onChange={(e) => setDistrictState(e.target.value)}
                                >
                                    <option value="">Select State</option>
                                    {["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"].map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={() => setStep('validate')}
                                disabled={!districtName || !districtState}
                                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                Continue <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <CustomPlacesAutocomplete 
                            placeholder="Search for your School or School District..."
                            onSelect={handleSearchSelect}
                            autoFocus={true}
                        />
                    )}
                </div>
            </div>
        )}

        {step === 'validate' && districtName && (
            <div className="flex-1 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300 w-full max-w-xl mx-auto">
                 <div className="w-full mb-6">
                    <button onClick={handleReset} className="text-xs text-slate-400 hover:text-indigo-600 mb-2 flex items-center gap-1">
                        ← Back to {useFallback ? 'Entry' : 'Search'}
                    </button>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start gap-3">
                        <div className="bg-white p-2 rounded-full shadow-sm text-emerald-600">
                            <School className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selected Location</div>
                            <div className="font-bold text-slate-900 text-lg">{placeDetails?.name || districtName}</div>
                            <div className="text-sm text-slate-500">{placeDetails?.formatted_address || `${districtName}, ${districtState}`}</div>
                        </div>
                    </div>
                </div>

                <div className="w-full space-y-6">
                     <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-indigo-900 text-lg flex items-center gap-2">
                                <Building2 className="w-5 h-5" /> District Context
                            </h3>
                            {isIdentifying && <span className="text-xs text-indigo-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Identifying...</span>}
                        </div>
                        
                        <div className="relative z-40">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">School District Name</label>
                            
                            {isIdentifying ? (
                                <div className="h-[50px] border border-slate-200 rounded-lg bg-slate-50 flex items-center px-3 text-slate-400 italic text-sm">
                                    AI is identifying district...
                                </div>
                            ) : useFallback ? (
                                <input
                                    type="text"
                                    className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-400 outline-none transition-all"
                                    value={districtName}
                                    onChange={(e) => setDistrictName(e.target.value)}
                                    placeholder="Enter School District Name..."
                                />
                            ) : (
                                <CustomPlacesAutocomplete 
                                    placeholder={districtName || "Search for your District..."}
                                    onSelect={handleDistrictSelect}
                                    disabled={isIdentifying}
                                />
                            )}
                            
                            {/* Display current selection below if using search as an editor */}
                            {!isIdentifying && districtName && (
                                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Current: {districtName}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">State Jurisdiction</label>
                            <input 
                                type="text" 
                                className="w-full border border-slate-300 rounded-lg p-3 text-sm bg-slate-50 text-slate-600 cursor-not-allowed font-bold"
                                value={districtState}
                                readOnly
                            />
                        </div>
                        
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                             <label className="flex items-center gap-3 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                    checked={isPublic}
                                    onChange={(e) => setIsPublic(e.target.checked)}
                                />
                                <div>
                                    <span className="font-bold text-blue-900 text-sm">This is a Public School / District</span>
                                    <p className="text-xs text-blue-700">
                                        Simulation applies public finance models (State/Local tax revenue).
                                    </p>
                                </div>
                            </label>
                        </div>
                     </div>
                </div>
            </div>
        )}
      </div>

      {/* Footer Actions */}
      {step === 'validate' && (
        <div className="p-6 bg-white border-t border-slate-100 flex justify-center items-center shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-10">
             <button
                onClick={handleConfirm}
                disabled={!isPublic || !districtName || isIdentifying}
                className="w-full max-w-md bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 text-lg"
            >
                {isIdentifying ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" /> Finalizing Context...
                    </>
                ) : (
                    <>
                        Initialize Simulation <ArrowRight className="w-5 h-5" />
                    </>
                )}
            </button>
        </div>
      )}
    </div>
  );
};

export default DistrictSelector;
