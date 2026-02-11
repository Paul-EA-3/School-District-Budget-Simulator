import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle, XCircle, RefreshCcw, ArrowRight, MessageSquare, RotateCcw, Loader2, Info, BrainCircuit, Bot, Terminal, LogOut } from 'lucide-react';
import { SCENARIOS, CARD_POOL, EDUCATION_STATS, PoolCard } from './constants';
import { GameState, School, Card, SelectionState, Scenario } from './types';
import OnboardingModal from './components/OnboardingModal';
import Cockpit from './components/Cockpit';
import Scatterplot from './components/Scatterplot';
import TheGrid from './components/TheGrid';
import NarrativeBuilder from './components/NarrativeBuilder';
import Logo from './components/Logo';
import DistrictSelector from './components/DistrictSelector';
import ChatOverlay from './components/ChatOverlay';
import LoadingScreen from './components/LoadingScreen';
import SimulationResults from './components/SimulationResults';
import Login from './components/Login';
import { fetchUSAspending, fetchSocrataBudget, fetchStateLevelData, find_state_api, StateFiscalData, StateApiDiscovery } from './services/api';
import { harmonize_api_data } from './services/harmonizer';
import genAI, { FAST_MODEL, PRO_MODEL, safeJsonParse, safetySettings, generateAIContent, createAIChat } from './services/gemini';
import { useAuth } from './hooks/useAuth';
import LoginPage from './components/LoginPage';

const App: React.FC = () => {
  const { user } = useAuth();
  // --- 1. STATE INITIALIZATION ---
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('is_authenticated') === 'true';
  });
  const [districtContext, setDistrictContext] = useState<{name: string, location: string, state: string} | null>(null);
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  
  // Loading & Logs
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);
  const [isGeneratingSim, setIsGeneratingSim] = useState(false);
  const [simGenerationComplete, setSimGenerationComplete] = useState(false);
  const [loadingFact, setLoadingFact] = useState(EDUCATION_STATS[0]);
  const [loadingLog, setLoadingLog] = useState<string[]>([]); // New: Action Log

  // Data Models
  const [baseGameState, setBaseGameState] = useState<GameState | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  
  // External Data Sources
  const [stateData, setStateData] = useState<StateFiscalData | null>(null);
  const [dataSources, setDataSources] = useState<string[]>([]);
  const [discoveredApi, setDiscoveredApi] = useState<StateApiDiscovery | null>(null);

  // Gameplay
  const [decisions, setDecisions] = useState<Card[]>([]);
  const [history, setHistory] = useState<Card[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [fundedUniqueIds, setFundedUniqueIds] = useState<Set<string>>(new Set<string>());
  const [oneTimeUsed, setOneTimeUsed] = useState(0);
  
  // Results
  const [simulationEnded, setSimulationEnded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalNarrative, setFinalNarrative] = useState('');
  const [boardFeedback, setBoardFeedback] = useState<{approved: boolean, feedback: string, voteCount: string} | null>(null);
  
  // UI & Chat
  const [isCompact, setIsCompact] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [isChatTyping, setIsChatTyping] = useState(false);

  // --- 2. EFFECT HOOKS ---

  useEffect(() => {
    localStorage.setItem('is_authenticated', isAuthenticated.toString());
  }, [isAuthenticated]);

  useEffect(() => {
    const handleScroll = () => setIsCompact(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (scenarioId && !simGenerationComplete && !isGeneratingSim && !started) {
        generateSimulationData();
    }
  }, [scenarioId, started]);

  // Loading Logic
  useEffect(() => {
    let isActive = true;
    let factInterval: ReturnType<typeof setInterval>;

    if (isGeneratingBriefing || (isGeneratingSim && started)) {
        const fetchFact = async () => {
            if (!isActive) return;
            try {
                // Keep Fact Gen on Flash for speed
                const response = await generateAIContent(FAST_MODEL, "Generate a single, fascinating, one-sentence statistic about US school district finance.");
                const text = response.text;
                if (text && isActive) setLoadingFact(text.trim());
            } catch(e) {
                if (isActive) setLoadingFact(EDUCATION_STATS[Math.floor(Math.random() * EDUCATION_STATS.length)]);
            }
        };
        fetchFact();
        factInterval = setInterval(fetchFact, 4000);
    }

    return () => {
        isActive = false;
        clearInterval(factInterval);
    };
  }, [isGeneratingBriefing, isGeneratingSim, started]);

  // --- 3. MEMOIZED VALUES ---
  const derivedSchools = useMemo(() => {
     if(!schools || schools.length === 0) return [];
     return schools.map(s => {
      let newSpend = s.spendingPerPupil;
      let newMath = s.academicOutcome.math;
      let newEla = s.academicOutcome.ela;

      if (decisions.find(d => d.title.includes('Reading') && (d.selected === 'Fund' || d.selected === 'OneTime')) && s.povertyRate > 0.6) {
        newEla += 5;
        newSpend += 200;
      }
      if (decisions.find(d => d.title.includes('Class Size') && (d.selected === 'Fund' || d.selected === 'OneTime'))) {
        newMath += 2;
        newEla += 2;
        newSpend += 500;
      }
      if (decisions.find(d => d.title.includes('Tutoring') && (d.selected === 'Fund' || d.selected === 'OneTime'))) {
        newMath += 4;
      }
      if (decisions.find(d => d.title.includes('Arts') && d.selected === 'Fund')) { 
             newEla -= 2; 
      }

      return { ...s, spendingPerPupil: newSpend, academicOutcome: { math: newMath, ela: newEla } };
     });
  }, [decisions, schools]);


  // --- 4. ACTION HANDLERS ---

  // Helper: Append Log
  const addLog = (msg: string) => {
      setLoadingLog(prev => [...prev, `> ${msg}`]);
  };


  /**
   * Helper: Fetch District Data from discovered APIs.
   */
  const fetch_district_data = async (district_id: string, api_urls: StateApiDiscovery) => {
      try {
          const financeUrl = api_urls.finance_api_url.replace('{DISTRICT_ID}', district_id);
          const assessmentUrl = api_urls.assessment_api_url.replace('{DISTRICT_ID}', district_id);

          const [financeRes, assessmentRes] = await Promise.all([
              fetch(financeUrl).catch(e => ({ ok: false, statusText: e.message })),
              fetch(assessmentUrl).catch(e => ({ ok: false, statusText: e.message }))
          ]);

          let financeData = null;
          let assessmentData = null;

          if ((financeRes as Response).ok) {
              financeData = await (financeRes as Response).json();
          } else {
              console.warn(`Finance API Failed: ${(financeRes as any).statusText}`);
          }

          if ((assessmentRes as Response).ok) {
              assessmentData = await (assessmentRes as Response).json();
          } else {
              console.warn(`Assessment API Failed: ${(assessmentRes as any).statusText}`);
          }

          return { financeData, assessmentData };

      } catch (e) {
          console.error("fetch_district_data Critical Error:", e);
          return null; 
      }
  };

  // Phase 1: Briefing
  const handleDistrictSelect = async (context: {name: string, location: string, state: string}) => {
    setDistrictContext(context);
    setIsGeneratingBriefing(true);
    setLoadingLog([`> Initiating forensic analysis for ${context.name}...`]);
    
    let localStateData: StateFiscalData | null = null;
    let externalApiData: any = null;
    const sourcesFound: string[] = [];

    // LEVEL 0.5: API DISCOVERY
    try {
        addLog(`Locating ${context.state} Education Data Portals...`);
        const foundApi = await find_state_api(context.state);
        
        if (foundApi) {
            setDiscoveredApi(foundApi);
            addLog(`Found Data Source: ${foundApi.source_authority}`);
            sourcesFound.push(foundApi.source_authority);
            
            if (foundApi.finance_api_url.includes('?') || foundApi.assessment_api_url.includes('?')) {
                 addLog(`Querying External API: ${foundApi.source_authority}...`);
                 externalApiData = await fetch_district_data(encodeURIComponent(context.name), foundApi);
                 
                 if (externalApiData?.financeData || externalApiData?.assessmentData) {
                     addLog("External API Data Retrieved Successfully.");
                     const harmonizedSchools = harmonize_api_data(externalApiData.financeData, externalApiData.assessmentData);
                     if (harmonizedSchools.length > 0) {
                         setSchools(harmonizedSchools);
                         addLog(`Harmonized ${harmonizedSchools.length} schools from live data.`);
                     }
                 }
            }
        }
    } catch(e) { console.warn("API Discovery Failed", e); }

    // LEVEL 1: STATE DATA SCRAPER (Gold Standard)
    if (!externalApiData) {
        try {
            addLog(`Querying ${context.state} Department of Education...`);
            localStateData = await fetchStateLevelData(context.state, context.name);
            if (localStateData) {
                setStateData(localStateData);
                sourcesFound.push(localStateData.source);
                addLog(`Found State Report Card: PPE $${localStateData.ppe}`);
            } else {
                addLog(`State specific data not found, estimating from regional averages...`);
            }
        } catch (e) { console.warn("State Data Fetch Failed", e); }
    }

    // LEVEL 2: USAspending
    try {
        addLog("Verifying Federal Grant Allocations...");
        const federalContext = await fetchUSAspending(context.name);
        if (federalContext) {
            sourcesFound.push(federalContext.source);
            addLog("USAspending.gov entry found.");
        }
    } catch (e) { console.warn("USAspending Fetch Failed", e); }

    setDataSources(sourcesFound);
    addLog("Synthesizing Strategic Briefing...");
    
    const prompt = `
      Act as a Forensic Auditor for ${context.state}. Target: ${context.name} (${context.location})
      
      *** DATA SOURCES ***
      ${localStateData ? `[x] STATE DATA (PRIORITY): PPE $${localStateData.ppe}, Poverty ${(localStateData.economicallyDisadvantaged*100).toFixed(0)}%, Proficiency ${localStateData.proficiency.composite}%` : '[ ] State Data Missing - Estimate based on typical district'}
      ${externalApiData ? `[x] EXTERNAL API: ${JSON.stringify(externalApiData).substring(0, 1000)}` : ''}

      INSTRUCTIONS:
      1. Deficit: ${localStateData ? "Use PPE * Enrollment to calc Budget. Assume 1-3% structural deficit." : "Estimate based on recent news/inflation."}
      2. Trust: ${localStateData ? `Start with baseline derived from Proficiency (${localStateData.proficiency.composite}%). Low scores = Lower Trust.` : "Search news."}
      3. Archetype: 'urban'|'suburban'|'rural'.

      RETURN JSON:
      {
        "archetype": "urban"|"suburban"|"rural",
        "title": "String",
        "description": "String",
        "initialState": {
             "year": 2025,
             "enrollment": number, 
             "revenue": { "local": number, "state": number, "federalOneTime": number },
             "expenditures": { "personnel": number, "operations": number, "fixed": number },
             "fundBalance": number,
             "structuralGap": number,
             "communityTrust": number
        }
      }
    `;

    try {
        const response = await generateAIContent(PRO_MODEL, prompt, {
            tools: [{ googleSearch: {} }] as any,
            responseMimeType: 'application/json',
            safetySettings
        });

        const text = response.text;
        if (!text) throw new Error("No AI Response");
        
        const data = safeJsonParse(text);
        if(!data) throw new Error("Invalid JSON from AI");

        const validId = ['urban', 'suburban', 'rural'].includes(data.archetype) ? data.archetype : 'suburban';
        
        SCENARIOS[validId] = {
            ...SCENARIOS[validId],
            title: data.title,
            description: data.description,
            initialState: data.initialState,
            initialSchools: schools.length > 0 ? schools : SCENARIOS[validId].initialSchools
        };

        setBaseGameState(data.initialState);
        setScenarioId(validId); 
        
    } catch (e) {
        console.error("Briefing Gen Error", e);
        setScenarioId('suburban');
        setBaseGameState(SCENARIOS['suburban'].initialState);
    } finally {
        setIsGeneratingBriefing(false);
    }
  };

  // Phase 2: Simulation
  const generateSimulationData = async () => {
    if (!scenarioId || !districtContext) return;
    
    // If we already have schools from Phase 1 (Harmonized API), skip expensive AI gen
    if (schools.length > 0) {
        const gap = baseGameState?.structuralGap || 0;
        const newCards = generateProposals(scenarioId, gap, new Set());
        setDecisions(newCards);
        setHistory([newCards]);
        setHistoryIndex(0);
        setGameState(baseGameState);
        setSimGenerationComplete(true);
        return;
    }
    
    setIsGeneratingSim(true);
    // NOTE: This runs in background usually

    try {
        const prompt = `
          CRITICAL: Data API. Output JSON only.
          Context: ${districtContext.name}, ${districtContext.state}.
          
          TASK: RETRIEVE OFFICIAL SCHOOL ROSTER.
          1. List EVERY SINGLE SCHOOL in this district.
          2. **DO NOT TRUNCATE**.
          
          ${stateData ? `
          *** MANDATORY STATE DATA ALIGNMENT ***
          - Average Spending Per Pupil must be close to: $${stateData.ppe}
          - Average Proficiency (Math/ELA) must be close to: ${state.proficiency.composite}%
          - Average Poverty Rate must be close to: ${(stateData.economicallyDisadvantaged * 100).toFixed(0)}%
          ` : ''}
          
          RETURN JSON:
          {
            "initialSchools": [
                { "id": "s1", "name": "String", "type": "High"|"Middle"|"Elementary", "enrollment": number, "spendingPerPupil": number, "academicOutcome": { "math": number, "ela": number }, "povertyRate": number, "principal": "String", "staffing": { "senior": number, "junior": number } }
            ]
          }
        `;

        const response = await generateAIContent(PRO_MODEL, prompt, {
            tools: [{ googleSearch: {} }] as any,
            responseMimeType: 'application/json',
            safetySettings
        });

        let text = response.text;
        if(!text) throw new Error("Empty AI Response");
        
        let data = safeJsonParse(text);
        if (!data) throw new Error("Invalid JSON");

        // Merge Strategy: Use Harmonized External Data if available, else AI data
        let finalSchools = data.initialSchools;

        if (!finalSchools || !Array.isArray(finalSchools) || finalSchools.length === 0) {
             throw new Error("No schools returned");
        }

        const gap = baseGameState?.structuralGap || 0;
        const newCards = generateProposals(scenarioId, gap, new Set());

        setSchools(finalSchools);
        setDecisions(newCards);
        setHistory([newCards]);
        setHistoryIndex(0);
        
        // Final State Reconciliation
        if (stateData && baseGameState) {
             const realTotalBudget = stateData.ppe * stateData.enrollment;
             const updatedState = {
                ...baseGameState,
                enrollment: stateData.enrollment,
                revenue: {
                    local: realTotalBudget * 0.45,
                    state: realTotalBudget * 0.45, 
                    federalOneTime: realTotalBudget * 0.10
                },
                expenditures: {
                    personnel: realTotalBudget * 0.85,
                    operations: realTotalBudget * 0.10,
                    fixed: realTotalBudget * 0.05
                },
                structuralGap: baseGameState.structuralGap
            };
            setBaseGameState(updatedState);
            setGameState(updatedState);
        } else {
            setGameState(baseGameState);
        }

        setSimGenerationComplete(true);

    } catch (e) {
        console.error("Sim Gen Failed", e);
        setSchools(SCENARIOS[scenarioId].initialSchools); 
        setDecisions(generateProposals(scenarioId, -1000000, new Set()));
        setGameState(baseGameState);
        setSimGenerationComplete(true);
    } finally {
        setIsGeneratingSim(false);
    }
  };

  const handleAcceptAssignment = () => {
      setStarted(true);
  };

  // --- Helper Functions ---
  const generateProposals = (scenarioId: string, structuralGap: number, fundedIds: Set<string>): Card[] => {
    const TARGET_COUNT = 8;
    let eligibleCards = CARD_POOL.filter(card => 
        card.validScenarios.includes('all') || card.validScenarios.includes(scenarioId as any)
    ).filter(card => !card.unique || !fundedIds.has(card.id));

    const isDeficitCrisis = structuralGap < -1000000;
    let finalSelection: PoolCard[] = [];
    const savingsCards = eligibleCards.filter(c => c.cost < 0);
    
    if (isDeficitCrisis) {
        finalSelection.push(...[...savingsCards].sort(() => Math.random() - 0.5).slice(0, 3));
    } else {
        finalSelection.push(...[...savingsCards].sort(() => Math.random() - 0.5).slice(0, 1));
    }

    const remainingPool = eligibleCards.filter(c => !finalSelection.find(f => f.id === c.id));
    finalSelection.push(...[...remainingPool].sort(() => Math.random() - 0.5).slice(0, TARGET_COUNT - finalSelection.length));

    return finalSelection.map(c => ({ ...c, selected: 'None' as SelectionState })).sort(() => Math.random() - 0.5);
  };

  const handleMoveCard = (id: string, dest: SelectionState) => {
    const newDecisions = decisions.map(c => c.id === id ? { ...c, selected: dest } : c);
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newDecisions]);
    setHistoryIndex(prev => prev + 1);
    setDecisions(newDecisions);
  };

  const handleAddProposal = (newCard: Card) => {
      const newDecisions = [newCard, ...decisions];
      setHistory(prev => [...prev.slice(0, historyIndex + 1), newDecisions]);
      setHistoryIndex(prev => prev + 1);
      setDecisions(newDecisions);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setDecisions(history[historyIndex - 1]);
      setHistoryIndex(prev => prev - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setDecisions(history[historyIndex + 1]);
      setHistoryIndex(prev => prev + 1);
    }
  };

  const handleSubmit = async (narrative: string) => {
    setIsSubmitting(true);
    setFinalNarrative(narrative);
    
    if (!gameState || !scenarioId) return;

    const activeProposals = decisions.filter(d => d.selected !== 'None');
    const prompt = `
      You are the School Board.
      District: ${districtContext?.name}
      Deficit: $${gameState.structuralGap}
      
      Proposals:
      ${activeProposals.map(d => `- ${d.selected === 'Reject' ? 'CUT' : `FUNDED (${d.selected})`}: ${d.title} ($${d.cost})`).join('\n')}
      
      Narrative: "${narrative}"
      
      Vote on this budget.
      RETURN JSON: { "approved": boolean, "voteCount": string, "feedback": string }
    `;

    try {
        const response = await generateAIContent(PRO_MODEL, prompt, {
            responseMimeType: 'application/json',
            safetySettings
        });
        const text = response.text;
        const data = safeJsonParse(text);
        if(!data) throw new Error("Invalid JSON");
        setBoardFeedback(data);
        setSimulationEnded(true);
    } catch (e) {
        setBoardFeedback({ approved: true, voteCount: "Pass (Override)", feedback: "AI Unavailable." });
        setSimulationEnded(true);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleChatSend = async (msg: string) => {
    setIsChatTyping(true);
    setChatHistory(p => [...p, { role: 'user', text: msg }]);
    try {
        const chat = createAIChat(PRO_MODEL, chatHistory.map(m => ({ role: m.role, parts: [{ text: m.text }] })), {
            safetySettings
        });
        const response = await chat.sendMessage(msg);
        setChatHistory(p => [...p, { role: 'model', text: response.text || "..." }]);
    } catch(e) {
        setChatHistory(p => [...p, { role: 'model', text: "Connection error." }]);
    } finally {
        setIsChatTyping(false);
    }
  };

  const handleRestart = () => {
      setDistrictContext(null);
      setScenarioId(null);
      setStarted(false);
      setStateData(null);
      setDataSources([]);
      setDecisions([]);
      setHistory([]);
      setHistoryIndex(-1);
      setSimulationEnded(false);
      setBoardFeedback(null);
      setSimGenerationComplete(false);
      setLoadingLog([]); // Reset log
  };

  // --- 5. RENDER LOGIC (Conditional Returns) ---

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }
  
  if (!user) {
    return <LoginPage />;
  }

  if (isGeneratingBriefing) {
      return (
        <LoadingScreen
            title="Forensic Analysis..."
            loadingLog={loadingLog}
            loadingFact={loadingFact}
        />
      );
  }

  if (started && !simGenerationComplete) {
      return (
        <LoadingScreen
            title="Building Simulation..."
            subtitle="Processing School Rosters & Financials..."
            loadingFact={loadingFact}
        />
      );
  }

  if (!scenarioId) {
      return (
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-900 via-orange-400 to-indigo-900"></div>
             <div className="w-full max-w-3xl z-50">
                <DistrictSelector onSelect={handleDistrictSelect} />
             </div>
             <div className="mt-12 flex flex-col items-center gap-4">
                 <div className="flex items-center gap-2 text-slate-400 opacity-70">
                     <span className="text-xs">Simulator by</span>
                     <Logo className="h-6" />
                 </div>
                 <button
                    onClick={() => setIsAuthenticated(false)}
                    className="flex items-center gap-2 text-slate-400 hover:text-red-600 text-xs font-medium transition-colors"
                 >
                    <LogOut className="w-3 h-3" /> Logout
                 </button>
             </div>
          </div>
      );
  }

  if (!started) {
      return (
        <>
            <OnboardingModal 
                scenario={SCENARIOS[scenarioId]} 
                onStart={handleAcceptAssignment} 
                onBack={() => setScenarioId(null)} 
            />
            <ChatOverlay 
                isOpen={isChatOpen} 
                onToggle={() => setIsChatOpen(!isChatOpen)} 
                history={chatHistory} 
                onSend={handleChatSend} 
                isTyping={isChatTyping} 
                contextLabel="Briefing Advisor"
            />
        </>
      );
  }

  // Simulation (Started & Ready)
  if (gameState) {
      return (
        <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 pb-20">
            <header className="bg-white text-slate-900 p-4 shadow-sm sticky top-0 z-40 border-b border-slate-200">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Logo className="h-8" />
                        <div className="hidden md:block w-px h-6 bg-slate-200"></div>
                        <div className="hidden md:block text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {districtContext?.name}
                        </div>
                    </div>
                    <div className="flex gap-6">
                        <button onClick={handleRestart} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 text-xs font-medium transition-colors">
                            <RotateCcw className="w-4 h-4" /> Restart
                        </button>
                        <button onClick={() => { handleRestart(); setIsAuthenticated(false); }} className="flex items-center gap-2 text-slate-400 hover:text-red-600 text-xs font-medium transition-colors">
                            <LogOut className="w-4 h-4" /> Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 space-y-6">
                <div className={`sticky top-[73px] z-30 bg-slate-100/90 backdrop-blur-sm transition-all duration-300 border-b border-slate-200/50 ${isCompact ? 'py-2 shadow-md' : 'pt-4 pb-2 -mx-4 px-4 mb-4 shadow-sm'}`}>
                    <div className={isCompact ? 'max-w-6xl mx-auto' : ''}>
                        <Cockpit state={gameState} schools={derivedSchools} compact={isCompact} />
                    </div>
                </div>

                {simulationEnded && boardFeedback ? (
                    <SimulationResults feedback={boardFeedback} onRestart={handleRestart} />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <TheGrid 
                                cards={decisions} 
                                onMoveCard={handleMoveCard} 
                                fundOneTimeRemaining={gameState.revenue.federalOneTime - oneTimeUsed}
                                onUndo={handleUndo}
                                onRedo={handleRedo}
                                canUndo={historyIndex > 0}
                                canRedo={historyIndex < history.length - 1}
                                onAddProposal={handleAddProposal}
                            />
                        </div>
                        <div className="space-y-6">
                            <Scatterplot schools={derivedSchools} />
                            <NarrativeBuilder 
                                decisions={decisions} 
                                onSubmit={handleSubmit} 
                                isSubmitting={isSubmitting}
                                allSorted={decisions.every(c => c.selected !== 'None')}
                            />
                        </div>
                    </div>
                )}
            </main>

            <footer className="max-w-6xl mx-auto py-6 text-center">
                <div className="flex flex-col items-center justify-center gap-2 mb-2 text-slate-400 opacity-70">
                    <div className="flex items-center gap-2">
                        <span className="text-xs">Simulator by</span>
                        <Logo className="h-6" />
                    </div>
                    {dataSources.length > 0 && (
                        <p className="text-[10px] text-slate-400 flex flex-wrap justify-center gap-2 mt-2">
                            <span className="flex items-center gap-1 font-bold"><Info className="w-3 h-3" /> Sources:</span> 
                            {dataSources.join(" • ")}
                        </p>
                    )}
                </div>
            </footer>

            <ChatOverlay 
                isOpen={isChatOpen} 
                onToggle={() => setIsChatOpen(!isChatOpen)} 
                history={chatHistory} 
                onSend={handleChatSend} 
                isTyping={isChatTyping} 
            />
        </div>
      );
  }

  // Fallback return if something goes wrong
  return null;
};

export default App;
