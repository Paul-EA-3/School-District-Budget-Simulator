
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2, CheckCircle2, ArrowRight, Building2, School, X, BrainCircuit } from 'lucide-react';
import Logo from './Logo';
import { GoogleGenAI } from "@google/genai";

interface DistrictContext {
  name: string;
  location: string;
  state: string;
  description?: string;
}

interface DistrictSelectorProps {
  onSelect: (context: DistrictContext) => void;
}

const DistrictSelector: React.FC<DistrictSelectorProps> = ({ onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [loadingMaps, setLoadingMaps] = useState(false);
  
  // Validation State
  const [districtName, setDistrictName] = useState('');
  const [districtState, setDistrictState] = useState('');
  const [isPublic, setIsPublic] = useState(true); 
  const [isIdentifying, setIsIdentifying] = useState(false);
  
  // Refs for Autocomplete
  const searchInputRef = useRef<HTMLInputElement>(null);
  const districtInputRef = useRef<HTMLInputElement>(null);
  
  const searchAutocomplete = useRef<any>(null);
  const districtAutocomplete = useRef<any>(null);

  // Initialize Search Autocomplete (Step 1 - Schools Only)
  useEffect(() => {
    const initSearchAutocomplete = () => {
      const win = window as any;
      if (win.google && win.google.maps && win.google.maps.places && searchInputRef.current) {
        searchAutocomplete.current = new win.google.maps.places.Autocomplete(searchInputRef.current, {
          types: ['school'], // Broad filter for schools and districts
          componentRestrictions: { country: 'us' },
          fields: ['name', 'formatted_address', 'address_components', 'geometry']
        });

        searchAutocomplete.current.addListener('place_changed', () => {
          const place = searchAutocomplete.current?.getPlace();
          if (place && place.name) {
            handlePlaceSelection(place);
          }
        });
        setLoadingMaps(false);
      } else {
        setTimeout(initSearchAutocomplete, 500);
      }
    };

    setLoadingMaps(true);
    initSearchAutocomplete();
  }, []);

  // Initialize District Validation Autocomplete (Step 2 - Districts/Regions)
  useEffect(() => {
    if (selectedPlace && districtInputRef.current) {
        const win = window as any;
        if (win.google && win.google.maps && win.google.maps.places) {
            // We remove strict type filtering here because "School Districts" are often 
            // classified as 'administrative_area_level_3' or 'establishment', not 'school'.
            districtAutocomplete.current = new win.google.maps.places.Autocomplete(districtInputRef.current, {
                componentRestrictions: { country: 'us' },
                fields: ['name', 'formatted_address', 'address_components']
            });

            districtAutocomplete.current.addListener('place_changed', () => {
                const place = districtAutocomplete.current?.getPlace();
                if (place && place.name) {
                    setDistrictName(place.name);
                    extractState(place); 
                }
            });
        }
    }
  }, [selectedPlace]);

  const extractState = (place: any) => {
      if (place.address_components) {
        for (const component of place.address_components) {
            if (component.types.includes('administrative_area_level_1')) {
                setDistrictState(component.long_name);
            }
        }
    }
  };

  const identifyDistrictWithAI = async (place: any) => {
    setIsIdentifying(true);
    setDistrictName(''); // Clear previous

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `
            I have a user selecting a school in the United States.
            School Name: ${place.name}
            Address: ${place.formatted_address}
            
            Task: Identify the official name of the School District (LEA) that this specific school belongs to.
            If the selected place IS a school district, return its name.
            
            Return ONLY the School District Name (e.g., "Los Angeles Unified School District"). Do not add extra text.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        const text = response.text?.trim();
        if (text) {
            setDistrictName(text);
        } else {
            // Fallback if AI is silent
            setDistrictName(place.name); 
        }
    } catch (error) {
        console.error("Failed to identify district via AI:", error);
        // Fallback to just using the school name so they can edit it
        setDistrictName(place.name);
    } finally {
        setIsIdentifying(false);
    }
  };

  const handlePlaceSelection = (place: any) => {
    setSelectedPlace(place);
    extractState(place);
    
    // Use AI to identify the actual district instead of guessing strings
    identifyDistrictWithAI(place);
  };

  const handleConfirm = () => {
    if (!selectedPlace || !isPublic) return;

    const context: DistrictContext = {
      name: districtName || selectedPlace.name,
      location: selectedPlace.formatted_address || '',
      state: districtState || 'Unknown State',
      description: `Located in ${selectedPlace.formatted_address}`
    };
    onSelect(context);
  };

  const handleReset = () => {
      setSelectedPlace(null);
      setSearchTerm('');
      setDistrictName('');
      setDistrictState('');
      setIsPublic(true);
      setIsIdentifying(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-3xl mx-auto flex flex-col animate-in zoom-in-95 duration-500 border border-slate-100">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-100 p-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
            <Logo className="h-8" />
            <div className="hidden md:block w-px h-6 bg-slate-200"></div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">District Setup</div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-8 min-h-[400px] flex flex-col justify-center">
        
        {!selectedPlace ? (
            /* STEP 1: SEARCH */
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-8 max-w-lg">
                    <h2 className="text-3xl font-bold text-indigo-900 mb-3">Identify Your District</h2>
                    <p className="text-slate-600 leading-relaxed">
                        Search for a Public School or School District to initialize the simulation with real-world context from your state.
                    </p>
                </div>

                <div className="w-full max-w-lg relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                        ref={searchInputRef}
                        type="text"
                        className="block w-full pl-11 pr-4 py-4 border border-slate-200 rounded-xl bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg shadow-sm transition-all"
                        placeholder={loadingMaps ? "Connecting to Maps API..." : "Search by School or School District..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        disabled={loadingMaps}
                    />
                    {loadingMaps && (
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                            <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
                        </div>
                    )}
                </div>
            </div>
        ) : (
            /* STEP 2: VALIDATION */
            <div className="flex-1 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300 w-full max-w-xl mx-auto">
                 <div className="w-full mb-6">
                    <button onClick={handleReset} className="text-xs text-slate-400 hover:text-indigo-600 mb-2 flex items-center gap-1">
                        ← Back to Search
                    </button>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start gap-3">
                        <div className="bg-white p-2 rounded-full shadow-sm text-emerald-600">
                            <School className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Selected Location</div>
                            <div className="font-bold text-slate-900 text-lg">{selectedPlace.name}</div>
                            <div className="text-sm text-slate-500">{selectedPlace.formatted_address}</div>
                        </div>
                    </div>
                </div>

                <div className="w-full space-y-6">
                     <div className="space-y-4">
                        <h3 className="font-bold text-indigo-900 text-lg flex items-center gap-2">
                            <Building2 className="w-5 h-5" /> Validate District Context
                        </h3>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">School District Name</label>
                            <div className="relative">
                                <input 
                                    ref={districtInputRef}
                                    type="text" 
                                    className={`w-full border border-slate-300 rounded-lg p-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none ${isIdentifying ? 'bg-slate-50 text-slate-400' : ''}`}
                                    value={districtName}
                                    onChange={(e) => setDistrictName(e.target.value)}
                                    placeholder={isIdentifying ? "AI Identifying District..." : "Search for your District..."}
                                    disabled={isIdentifying}
                                />
                                {isIdentifying ? (
                                     <div className="absolute right-3 top-3 animate-spin text-indigo-600">
                                        <Loader2 className="w-4 h-4" />
                                     </div>
                                ) : districtName && (
                                    <button 
                                        onClick={() => setDistrictName('')}
                                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                {isIdentifying ? (
                                    <>
                                        <BrainCircuit className="w-3 h-3" /> AI is identifying the district...
                                    </>
                                ) : (
                                    "Confirm or Search to select the official School District entity."
                                )}
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">State Jurisdiction</label>
                            <input 
                                type="text" 
                                className="w-full border border-slate-300 rounded-lg p-3 text-sm bg-slate-50 text-slate-600 cursor-not-allowed"
                                value={districtState}
                                readOnly
                            />
                             <p className="text-[10px] text-slate-400 mt-1">
                                Budget simulation will apply {districtState} state funding formulas and regulations.
                            </p>
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
                                        This simulation is designed for public finance models (State/Local tax revenue).
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
      <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-center items-center min-h-[88px]">
         {selectedPlace && (
             <button
                onClick={handleConfirm}
                disabled={!isPublic || !districtName || isIdentifying}
                className="bg-indigo-600 text-white px-10 py-4 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
            >
                {isIdentifying ? 'Please Wait...' : 'Initialize Simulation'} <ArrowRight className="w-5 h-5" />
            </button>
         )}
      </div>
    </div>
  );
};

export default DistrictSelector;
