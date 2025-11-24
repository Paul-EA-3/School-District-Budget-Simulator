
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PieChart, CheckCircle, XCircle, RefreshCcw, ArrowRight, ExternalLink, MessageSquare, RotateCcw, Loader2, BrainCircuit, Info, Send, User, Users } from 'lucide-react';
import { SCENARIOS, CARD_POOL, EDUCATION_STATS, PoolCard } from './constants';
import { GameState, School, Card, SelectionState } from './types';
import ScenarioCard from './components/ScenarioCard';
import OnboardingModal from './components/OnboardingModal';
import Cockpit from './components/Cockpit';
import Scatterplot from './components/Scatterplot';
import TheGrid from './components/TheGrid';
import NarrativeBuilder from './components/NarrativeBuilder';
import Logo from './components/Logo';
import EdunomicsLogo from './components/EdunomicsLogo';
import DistrictSelector from './components/DistrictSelector';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { fetchCensusFinance, fetchSocrataBudget } from './services/api';

const App: React.FC = () => {
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  
  // Loading States
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false); // Phase 1
  const [isGeneratingSim, setIsGeneratingSim] = useState(false); // Phase 2
  const [loadingMessage, setLoadingMessage] = useState("Initializing...");
  
  const [loadingFact, setLoadingFact] = useState(EDUCATION_STATS[0]);
  const [loadingSeconds, setLoadingSeconds] = useState(5);

  // Scroll State for Compact Header
  const [isCompact, setIsCompact] = useState(false);

  // Base State (Start of current Year)
  const [baseGameState, setBaseGameState] = useState<GameState | null>(null);
  const [schools, setSchools] = useState<School[]>([]);

  // Computed/Active State
  const [gameState, setGameState] = useState<GameState | null>(null);
  
  // History & Decisions
  const [decisions, setDecisions] = useState<Card[]>([]);
  const [history, setHistory] = useState<Card[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [fundedUniqueIds, setFundedUniqueIds] = useState<Set<string>>(new Set<string>());
  const [oneTimeUsed, setOneTimeUsed] = useState(0);
  
  // AI Board State
  const [simulationEnded, setSimulationEnded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalNarrative, setFinalNarrative] = useState('');
  const [boardFeedback, setBoardFeedback] = useState<{approved: boolean, feedback: string, voteCount: string} | null>(null);

  // Board Chat State
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // AI Context
  const [customContext, setCustomContext] = useState<{name: string, location: string, state: string} | null>(null);
  
  // Real Data Sources
  const [censusSource, setCensusSource] = useState<string | null>(null);


  // --- Scroll Listener ---
  useEffect(() => {
    const handleScroll = () => {
      const threshold = 50;
      setIsCompact(window.scrollY > threshold);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, simulationEnded]);

  // --- Proposal Generator Logic (Helper) ---
  const generateProposals = (scenarioId: string, structuralGap: number, fundedIds: Set<string>): Card[] => {
    const TARGET_COUNT = 8;
    
    // 1. Filter Pool by Scenario Compatibility
    let eligibleCards = CARD_POOL.filter(card => 
        card.validScenarios.includes('all') || card.validScenarios.includes(scenarioId as any)
    );

    // 2. Remove "Unique" cards that have already been funded
    eligibleCards = eligibleCards.filter(card => 
        !card.unique || !fundedIds.has(card.id)
    );

    // 3. Contextual Selection Logic
    // If Gap is worse than -$1M, ensure we have Savings options
    const isDeficitCrisis = structuralGap < -1000000;
    
    let finalSelection: PoolCard[] = [];
    const savingsCards = eligibleCards.filter(c => c.cost < 0);
    
    if (isDeficitCrisis) {
        // Force 3 Savings cards
        const shuffledSavings = [...savingsCards].sort(() => Math.random() - 0.5);
        finalSelection.push(...shuffledSavings.slice(0, 3));
    } else {
        // Ensure at least 1 savings card regardless
        const shuffledSavings = [...savingsCards].sort(() => Math.random() - 0.5);
        finalSelection.push(...shuffledSavings.slice(0, 1));
    }

    // Fill the rest randomly from remaining pool
    const chosenIds = new Set(finalSelection.map(c => c.id));
    
    const remainingPool = eligibleCards.filter(c => !chosenIds.has(c.id));
    const shuffledRemaining = [...remainingPool].sort(() => Math.random() - 0.5);
    
    const remainingCount = Math.max(0, TARGET_COUNT - finalSelection.length);
    finalSelection.push(...shuffledRemaining.slice(0, remainingCount));

    // 4. Map to Card type (add selected: 'None') and Shuffle final hand
    return finalSelection
        .map(c => ({
            id: c.id,
            title: c.title,
            description: c.description,
            cost: c.cost,
            studentsServed: c.studentsServed,
            isRecurring: c.isRecurring,
            riskFactor: c.riskFactor,
            riskDescription: c.riskDescription,
            category: c.category,
            selected: 'None' as SelectionState
        }))
        .sort(() => Math.random() - 0.5);
  };

  // --- AI Facts Generator ---
  const generateAIFact = async () => {
     try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = "Generate a single, surprising, one-sentence statistic about US school district finance or budgeting. It should be educational.";
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      
      const text = response.text;
      if (text) {
          setLoadingFact(text.trim());
      }
    } catch (e) {
      console.log("AI Fact Generation failed, using static.");
    }
  };

  // --- Phase 2 Loading Screen Logic ---
  useEffect(() => {
    if (isGeneratingSim) {
        setLoadingSeconds(15); 
        generateAIFact(); 

        const timer = setInterval(() => {
            setLoadingSeconds(prev => Math.max(0, prev - 1));
        }, 1000);
        
        const factRotator = setInterval(() => {
            setLoadingFact(EDUCATION_STATS[Math.floor(Math.random() * EDUCATION_STATS.length)]);
        }, 4000);

        return () => {
            clearInterval(timer);
            clearInterval(factRotator);
        };
    }
  }, [isGeneratingSim]);

  // --- AI Director Phase 1: Briefing Generation ---
  const generateBriefingData = async (districtContext: { name: string, location: string, state: string }) => {
    setIsGeneratingBriefing(true);
    setCustomContext(districtContext);

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Act as a Forensic Education Financial Auditor for the state of ${districtContext.state}.
      
      OBJECTIVE: Retrieve ACTUAL PUBLIC RECORDS for:
      District: ${districtContext.name}
      Location: ${districtContext.location}
      
      INSTRUCTIONS:
      1. **Structural Deficit**: Search your knowledge base for recent (2023-2025) news articles, state audit reports, or board meeting minutes regarding this specific district's budget.
         - If they have a reported deficit, use that EXACT number (e.g., -$35M).
         - If no specific news exists, estimate based on the ${districtContext.state} per-pupil funding formula and recent enrollment trends for this area.
      2. **Community Trust**: Assess trust based on HEADLINES. (e.g., recent strikes? failed bonds? superintendent turnover? = Low Trust).
      3. **Federal Grants**: Estimate the remaining ESSER III / ARPA cliff based on Title I allocations for this district.
      
      RETURN ONLY RAW JSON:
      {
        "archetype": "urban" | "suburban" | "rural",
        "title": "String (e.g. 'Urban / $35M Structural Deficit')",
        "description": "String (2-3 sentences citing the specific context/news if available)",
        "initialState": {
             "year": 2025,
             "enrollment": number, // Actual enrollment
             "revenue": { "local": number, "state": number, "federalOneTime": number },
             "expenditures": { "personnel": number, "operations": number, "fixed": number },
             "fundBalance": number,
             "structuralGap": number, // Negative if deficit
             "communityTrust": number
        }
      }
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            config: { responseMimeType: 'application/json' },
            contents: prompt
        });
        
        const text = response.text;
        if(!text) throw new Error("Empty AI Response");
        const data = JSON.parse(text.replace(/^```json\s*/, '').replace(/\s*```$/, ''));
        
        const archetypeId = data.archetype || 'suburban';
        const validId = ['urban', 'suburban', 'rural'].includes(archetypeId) ? archetypeId : 'suburban';

        // Create Preliminary Scenario (No schools/cards yet)
        const briefingScenario = {
            id: validId,
            title: data.title,
            description: data.description,
            icon: SCENARIOS[validId].icon,
            difficulty: 'Custom',
            initialState: data.initialState,
            initialSchools: [], 
            initialCards: [] 
        };

        SCENARIOS[validId] = briefingScenario as any;
        setBaseGameState(data.initialState);
        setScenarioId(validId); // Shows Briefing Screen

    } catch (e) {
        console.error("Briefing Generation Failed:", e);
        // Fallback
        handleSelectScenario('suburban');
    } finally {
        setIsGeneratingBriefing(false);
    }
  };

  // --- AI Director Phase 2: Deep Simulation Generation ---
  const generateSimulationData = async () => {
    if (!scenarioId || !customContext) return;
    
    setIsGeneratingSim(true);
    const currentScenario = SCENARIOS[scenarioId];
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        // --- STEP 1: Resolve NCES ID & Real Financials ---
        setLoadingMessage("Querying NCES Database...");
        
        let realFinancials = null;
        
        // Ask AI for the NCES ID first (Client-side heuristic)
        const ncesPrompt = `Return the 7-digit NCES District ID for "${customContext.name}" in ${customContext.state}. Return ONLY the 7-digit string.`;
        const idResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: ncesPrompt
        });
        const ncesId = idResponse.text?.trim().replace(/[^0-9]/g, '');

        if (ncesId && ncesId.length === 7) {
            setLoadingMessage("Fetching Real Census Data (F-33)...");
            realFinancials = await fetchCensusFinance(ncesId);
            if (realFinancials) {
                setCensusSource(realFinancials.source);
            }
        }

        // --- STEP 2: Generate Simulation with Real Data Injection ---
        setLoadingMessage("Building District Model...");
        
        const simPrompt = `
          Context: We are simulating ${customContext.name} in ${customContext.state}.
          
          ${realFinancials ? `
          *** KNOWN FINANCIAL FACTS (FROM US CENSUS) ***
          - Total Revenue: $${realFinancials.revenue.toLocaleString()}
          - Total Expenditure: $${realFinancials.expenditure.toLocaleString()}
          - Salary Expenditure: $${realFinancials.salaries.toLocaleString()}
          - Federal Rev (Proxy for Grants): $${realFinancials.federalRevenue.toLocaleString()}
          
          INSTRUCTION: Use these EXACT numbers for the financial baseline. Do not estimate them. 
          Use your knowledge to fill in the remaining qualitative gaps (like 'Community Trust' or specific cuts needed).
          ` : ''}
          
          TASK: RETRIEVE THE OFFICIAL SCHOOL ROSTER (NCES / State Dept of Education Data).
          
          1. List EVERY SINGLE SCHOOL in this district. 
          2. **DO NOT TRUNCATE THE LIST**. If the district has 50 schools, list all 50. If 100, list 100.
          3. For each school, provide:
             - Real Name (e.g., "Lincoln High")
             - Type (Elementary/Middle/High)
             - Estimated Enrollment
             - Poverty Rate (Free/Reduced Lunch %)
             - Academic Proficiency (Math/ELA %) based on ${customContext.state} standardized test averages for that demographic.
          
          RETURN ONLY RAW JSON:
          {
            "initialSchools": [
                { "id": "s1", "name": "String", "type": "High"|"Middle"|"Elementary", "enrollment": number, "spendingPerPupil": number, "academicOutcome": { "math": number, "ela": number }, "povertyRate": number, "principal": "String", "staffing": { "senior": number, "junior": number } }
            ]
          }
        `;

        // 1. Generate Schools
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            config: { 
                responseMimeType: 'application/json',
                maxOutputTokens: 8192 // Max tokens to ensure full roster isn't cut off
            },
            contents: simPrompt
        });
        
        const text = response.text;
        if(!text) throw new Error("Empty AI Response");
        const data = JSON.parse(text.replace(/^```json\s*/, '').replace(/\s*```$/, ''));
        
        // 2. Generate Cards (Local Logic)
        const initialProposals = generateProposals(scenarioId, currentScenario.initialState.structuralGap, new Set<string>());

        // 3. Update State (Merge Real Financials if available)
        setSchools(data.initialSchools);
        
        if (realFinancials && baseGameState) {
            const updatedState = {
                ...baseGameState,
                revenue: {
                    ...baseGameState.revenue,
                    local: Math.max(0, realFinancials.revenue - realFinancials.federalRevenue - 10000000), // Estimate state/local split
                    state: 10000000, // Placeholder split if unknown
                    federalOneTime: realFinancials.federalRevenue
                },
                expenditures: {
                    ...baseGameState.expenditures,
                    personnel: realFinancials.salaries,
                    operations: Math.max(0, realFinancials.expenditure - realFinancials.salaries - 1000000),
                    fixed: 1000000
                },
                // Recalculate gap based on real expenditure vs revenue
                structuralGap: realFinancials.revenue - realFinancials.expenditure
            };
            setBaseGameState(updatedState);
            setGameState(updatedState); // Ensure active state matches base
        }

        setDecisions(initialProposals);
        setHistory([initialProposals]);
        setHistoryIndex(0);
        setFundedUniqueIds(new Set<string>());
        
        // 4. Start
        setStarted(true);

    } catch (e) {
        console.error("Sim Generation Failed:", e);
        // Fallback Schools
        setSchools(SCENARIOS['suburban'].initialSchools);
        setDecisions(generateProposals(scenarioId, -1000000, new Set()));
        setStarted(true);
    } finally {
        setIsGeneratingSim(false);
    }
  };

  const handleDistrictSelect = (context: { name: string, location: string, state: string }) => {
      generateBriefingData(context);
  };

  const handleAcceptAssignment = () => {
      generateSimulationData();
  };


  // --- Scenario Initialization (Legacy/Fallback) ---
  const handleSelectScenario = async (id: string) => {
    // Legacy fallback code...
    const scenario = SCENARIOS[id];
    const initialProposals = generateProposals(id, scenario.initialState.structuralGap, new Set<string>());
    setSchools(scenario.initialSchools);
    setBaseGameState(scenario.initialState);
    setDecisions(initialProposals);
    setHistory([initialProposals]);
    setHistoryIndex(0);
    setScenarioId(id);
    setStarted(false); // Go to Briefing
  };

  // Compute Game State based on Decisions
  useEffect(() => {
    if (!baseGameState || !scenarioId) return;

    const fundedRecurring = decisions.filter(d => d.selected === 'Fund');
    const fundedOneTime = decisions.filter(d => d.selected === 'OneTime');
    const allFunded = [...fundedRecurring, ...fundedOneTime];
    
    const totalOneTimeSpend = fundedOneTime.reduce((acc, curr) => acc + curr.cost, 0);
    setOneTimeUsed(totalOneTimeSpend);

    // Calculate Structural Gap
    const initialGap = baseGameState.structuralGap;
    const recurringCostAdjustment = decisions.reduce((acc, curr) => {
      if ((curr.selected === 'Fund' || curr.selected === 'OneTime') && curr.isRecurring) {
        return acc + curr.cost;
      }
      return acc;
    }, 0);
    const newStructuralGap = initialGap - recurringCostAdjustment;

    // Calculate Fund Balance
    const initialFundBalance = baseGameState.fundBalance;
    const availableOneTime = baseGameState.revenue.federalOneTime;
    
    const excessOneTimeSpend = Math.max(0, totalOneTimeSpend - availableOneTime);
    const recurringSpend = fundedRecurring.reduce((acc, curr) => acc + curr.cost, 0);
    
    const netFundBalanceChange = -(recurringSpend + excessOneTimeSpend);
    const newFundBalance = initialFundBalance + netFundBalanceChange;

    // Calculate Trust
    let trustChange = 0;
    allFunded.forEach(d => {
      if (d.riskFactor === 'High') trustChange -= 10;
      if (d.riskFactor === 'Medium') trustChange -= 5;
    });
    
    const initialTrust = baseGameState.communityTrust;

    setGameState({
      ...baseGameState,
      structuralGap: newStructuralGap,
      fundBalance: newFundBalance,
      communityTrust: Math.max(0, Math.min(100, initialTrust + trustChange)),
    });

  }, [decisions, baseGameState, scenarioId]);

  // Computed Schools for rendering
  const derivedSchools = useMemo(() => {
     if(!schools.length) return [];
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
      if (decisions.find(d => d.title.includes('Arts') && d.cost < 0 && d.selected === 'Fund')) {
             newEla -= 2; 
      }

      return { ...s, spendingPerPupil: newSpend, academicOutcome: { math: newMath, ela: newEla } };
     });
  }, [decisions, schools]);


  const updateDecisions = (newDecisions: Card[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newDecisions);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setDecisions(newDecisions);
  };

  const handleMoveCard = (id: string, dest: SelectionState) => {
    const newDecisions = decisions.map(c => c.id === id ? { ...c, selected: dest } : c);
    updateDecisions(newDecisions);
  };

  const handleAddProposal = (newCard: Card) => {
    const newDecisions = [...decisions, newCard];
    updateDecisions(newDecisions);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setDecisions(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setDecisions(history[newIndex]);
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || !gameState || !scenarioId) return;
    
    setIsChatting(true);
    const userMessage = chatInput.trim();
    
    // Optimistically update UI
    const newHistory = [...chatHistory, { role: 'user' as const, text: userMessage }];
    setChatHistory(newHistory);
    setChatInput('');

    const scenario = SCENARIOS[scenarioId];
    const activeProposals = decisions.filter(d => d.selected !== 'None');

    const prompt = `
      You are the School Board for a ${scenario.title} school district.
      
      Context:
      - We just voted on the Superintendent's budget.
      - Result: ${boardFeedback?.voteCount} (${boardFeedback?.approved ? 'Approved' : 'Rejected'}).
      - Board's Initial Feedback: "${boardFeedback?.feedback}"
      
      Financial Snapshot:
      - Structural Deficit: $${gameState.structuralGap.toLocaleString()}
      - Trust: ${gameState.communityTrust}/100
      
      The Budget Proposal in question:
      ${activeProposals.map(d => 
        `- ${d.selected === 'Reject' ? 'REJECTED/CUT' : `FUNDED via ${d.selected}`}: ${d.title}`
      ).join('\n')}
      
      User Question: "${userMessage}"
      
      Task: Respond conversationally as the School Board. 
      - Be professional but firm.
      - If the user asks for advice, explain WHY specific choices (like cutting popular programs or failing to balance the deficit) caused the vote result.
      - Keep response concise (2-3 sentences).
    `;

    try {
       const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
       const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
       });
       
       const text = response.text || "The Board has no further comment.";
       setChatHistory([...newHistory, { role: 'model', text: text }]);
    } catch (e) {
        console.error("Chat failed", e);
        setChatHistory([...newHistory, { role: 'model', text: "Board members are currently unavailable for comment." }]);
    } finally {
        setIsChatting(false);
    }
  };

  const handleSubmit = async (narrative: string) => {
    setIsSubmitting(true);
    setFinalNarrative(narrative);
    setChatHistory([]); 
    
    if (!gameState || !scenarioId) return;

    const scenario = SCENARIOS[scenarioId];
    const activeProposals = decisions.filter(d => d.selected !== 'None');

    const prompt = `
      You are the School Board for a ${scenario.title} school district.
      
      Context: ${scenario.description}
      
      Current Financial State:
      - Structural Deficit: $${gameState.structuralGap.toLocaleString()} (Positive is surplus, Negative is deficit)
      - Projected Fund Balance: $${gameState.fundBalance.toLocaleString()}
      - Community Trust: ${gameState.communityTrust}/100
      
      The Superintendent has proposed the following:
      ${activeProposals.map(d => 
        `- ${d.selected === 'Reject' ? 'REJECTED/CUT' : `FUNDED via ${d.selected}`}: ${d.title} (Impact: $${d.cost.toLocaleString()}) [Risk: ${d.riskFactor}]`
      ).join('\n')}
      
      Superintendent's Narrative to the Board:
      "${narrative}"
      
      Your Task: Vote on this budget proposal.
      
      Guidelines for your vote:
      1. If the Structural Deficit is significantly negative (worse than -$1M), you should likely REJECT it unless the narrative is incredibly persuasive or trust is very high.
      2. If Community Trust is below 50, you are skeptical and looking for reasons to reject.
      3. If 'Fiscal Cliff' moves (paying recurring costs with one-time money) are present, mention them as a concern.
      4. If they cut popular programs (High Risk) without good justification, reject it.
      5. If the budget is balanced and invests in students, approve it enthusiastically, but always explain your specific reasons in the feedback.
      
      CRITICAL: Return a raw JSON object (and nothing else). Do not use markdown code blocks.
      Structure:
      {
        "approved": boolean,
        "voteCount": string, // e.g. "7-0", "4-3", "2-5"
        "feedback": string // Detailed paragraph (4-5 sentences) explaining the vote.
      }
    `;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        config: {
          maxOutputTokens: 8192, 
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          ],
        },
        contents: prompt 
      });

      let text = response.text;
      
      if (!text) {
        throw new Error("AI returned empty response");
      }

      text = text.trim();
      text = text.replace(/^```json\s*/g, '').replace(/^```\s*/g, '').replace(/\s*```$/g, '');
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }

      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
         console.error("JSON Parse Error:", e, "Text:", text);
         throw new Error("Failed to parse AI response as JSON");
      }

      setBoardFeedback(result);
      setChatHistory([{ role: 'model', text: result.feedback }]);
      setSimulationEnded(true);
    } catch (error) {
      console.error("AI Evaluation failed:", error);
      const fallbackResult = {
        approved: true,
        voteCount: "Pass (Manual Override)",
        feedback: "The AI Board Service was unavailable, so the budget passes by default. However, the State Auditor notes this is irregular."
      };
      setBoardFeedback(fallbackResult);
      setChatHistory([{ role: 'model', text: fallbackResult.feedback }]);
      setSimulationEnded(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevise = () => {
    setSimulationEnded(false);
    setBoardFeedback(null);
    setChatHistory([]);
  };

  const handleNextYear = async () => {
    if (!gameState || !scenarioId) return;

    setIsGeneratingSim(true); 

    const newlyFundedUniqueIds = new Set<string>(fundedUniqueIds);
    decisions.forEach(d => {
        const poolCard = CARD_POOL.find(p => p.id === d.id);
        if (poolCard && poolCard.unique && (d.selected === 'Fund' || d.selected === 'OneTime')) {
            newlyFundedUniqueIds.add(d.id);
        }
    });
    setFundedUniqueIds(newlyFundedUniqueIds);

    const fiscalCliff = decisions
      .filter(d => d.selected === 'OneTime' && d.isRecurring)
      .reduce((acc, d) => acc + d.cost, 0);

    const prevStructuralGap = gameState.structuralGap;
    const inflation = 1500000;
    const newStartGap = prevStructuralGap - fiscalCliff - inflation;

    // In standard mode, scenarioId is the key (urban/suburban/rural)
    const staticHand = generateProposals(scenarioId, newStartGap, newlyFundedUniqueIds);
    
    setBaseGameState({
      ...gameState,
      year: gameState.year + 1,
      structuralGap: newStartGap,
      revenue: {
        ...gameState.revenue,
        federalOneTime: 0 
      },
      expenditures: gameState.expenditures,
      communityTrust: gameState.communityTrust
    });

    setDecisions(staticHand);
    setHistory([staticHand]);
    setHistoryIndex(0);
    setSimulationEnded(false);
    setBoardFeedback(null);
    setChatHistory([]);
    setOneTimeUsed(0);
    
    setIsGeneratingSim(false);
  };

  const handleRestart = () => {
    setScenarioId(null);
    setStarted(false);
    setGameState(null);
    setBaseGameState(null);
    setSimulationEnded(false);
    setBoardFeedback(null);
    setChatHistory([]);
    setDecisions([]);
    setHistory([]);
    setHistoryIndex(-1);
    setOneTimeUsed(0);
    setFundedUniqueIds(new Set<string>());
  };

  // 1. Loading Screen (Phase 1: Briefing or Phase 2: Sim)
  if (isGeneratingBriefing || isGeneratingSim) {
      return (
        <div className="min-h-screen bg-indigo-900 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2"></div>
            </div>
            
            <a 
                href="mailto:paul@education.associates?subject=Simulator Feedback" 
                className="absolute top-6 right-6 z-50 flex items-center gap-2 text-blue-300 hover:text-white transition-colors text-xs font-medium"
            >
                <MessageSquare className="w-4 h-4" /> Feedback
            </a>

            <div className="z-10 flex flex-col items-center max-w-2xl w-full text-center">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
                    <BrainCircuit className="w-20 h-20 text-blue-300 relative z-10" />
                </div>

                <h2 className="text-3xl font-bold mb-2 tracking-tight">
                    {isGeneratingBriefing ? "Analyzing Public Records..." : "Researching School Data..."}
                </h2>
                <p className="text-blue-200 mb-4">
                    {loadingMessage}
                </p>

                <div className="w-full max-w-md h-1 bg-indigo-800 rounded-full overflow-hidden mb-8">
                    <div className="h-full bg-blue-400 animate-progress"></div>
                </div>
                
                <div className="bg-indigo-800/50 border border-indigo-700 p-6 rounded-xl max-w-lg w-full animate-in slide-in-from-bottom-4 fade-in duration-700">
                    <div className="flex items-center justify-center gap-2 mb-3 text-blue-300 text-xs font-bold uppercase tracking-widest">
                        <Info className="w-4 h-4" /> Did you know?
                    </div>
                    <p key={loadingFact} className="text-lg font-serif leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-500">
                        "{loadingFact}"
                    </p>
                </div>

                <div className="mt-8 font-mono text-xs text-indigo-400">
                    Launch in T-{loadingSeconds}s
                </div>
            </div>
            
            <style>{`
                @keyframes progress {
                    0% { width: 0% }
                    100% { width: 100% }
                }
                .animate-progress {
                    animation: progress ${isGeneratingBriefing ? '6s' : '12s'} linear forwards;
                }
            `}</style>
        </div>
      );
  }

  // 2. District Selection (Main Entry)
  if (!scenarioId) {
      return (
          <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-900 via-orange-400 to-indigo-900"></div>
             <div className="w-full max-w-3xl z-10">
                <DistrictSelector onSelect={handleDistrictSelect} />
             </div>
             
             <div className="mt-12 py-6 text-center z-10 flex flex-col items-center justify-center">
                 <div className="flex items-center gap-2 mb-2 text-slate-400 opacity-70">
                     <span className="text-xs">Simulator by</span>
                     <Logo className="h-6" />
                 </div>
             </div>
          </div>
      )
  }

  // 3. Onboarding Modal
  if (!started && scenarioId) {
    return <OnboardingModal 
        scenario={SCENARIOS[scenarioId]} 
        onStart={handleAcceptAssignment} 
        onBack={() => setScenarioId(null)}
    />;
  }

  // 4. Main Loading State (Fallback)
  if (!gameState) return <div>Loading...</div>;

  const oneTimeRemaining = gameState.revenue.federalOneTime - oneTimeUsed;
  const allProposalsSorted = decisions.every(d => d.selected !== 'None');

  // 5. Simulation Result (Board Vote)
  if (simulationEnded && boardFeedback) {
    const isApproved = boardFeedback.approved;
    
    return (
      <div className={`min-h-screen ${isApproved ? 'bg-emerald-50' : 'bg-orange-50'} p-0 flex flex-col`}>
         <header className="bg-white text-slate-900 p-4 shadow-sm z-40 border-b border-slate-200">
            <div className="max-w-2xl mx-auto flex justify-between items-center w-full">
              <div className="flex items-center gap-4">
                <Logo className="h-8" />
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={handleRestart}
                  className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors text-xs font-medium"
                >
                    <RotateCcw className="w-4 h-4" /> Start Over
                </button>
                <a 
                    href="mailto:paul@education.associates?subject=Simulator Feedback" 
                    className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors text-xs font-medium"
                >
                    <MessageSquare className="w-4 h-4" /> Feedback
                </a>
              </div>
            </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-8">
            <div className="bg-white max-w-2xl w-full p-8 rounded-2xl shadow-xl text-center border-t-8 border-t-indigo-900">
            <div className="mb-6 flex justify-center">
                {isApproved ? (
                <CheckCircle className="w-20 h-20 text-emerald-500" />
                ) : (
                <XCircle className="w-20 h-20 text-orange-500" />
                )}
            </div>
            
            <h2 className="text-3xl font-bold text-indigo-900 mb-2">
                {isApproved ? 'Budget Adopted' : 'Budget Rejected'}
            </h2>
            <p className="text-xl font-mono text-slate-500 mb-6 font-bold">Vote Count: {boardFeedback.voteCount}</p>
            
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-left mb-8 shadow-inner">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Board Feedback</h4>
                <p className="text-slate-700 leading-relaxed italic">
                "{boardFeedback.feedback}"
                </p>
            </div>

            <div className="grid grid-cols-2 gap-6 text-left mb-8">
                <div className="bg-white p-4 rounded border border-slate-100 shadow-sm">
                <p className="text-xs text-slate-400 uppercase font-bold">Final Structural Balance</p>
                <p className={`text-2xl font-bold ${gameState.structuralGap >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {gameState.structuralGap < 0 ? '-' : '+'}${Math.abs(gameState.structuralGap).toLocaleString()}
                </p>
                </div>
                <div className="bg-white p-4 rounded border border-slate-100 shadow-sm">
                <p className="text-xs text-slate-400 uppercase font-bold">Community Trust</p>
                <p className="text-2xl font-bold text-indigo-600">{gameState.communityTrust}%</p>
                </div>
            </div>

            {/* Chat Interface */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex flex-col h-[400px] mb-8 shadow-inner">
                <div className="bg-slate-100 p-3 border-b border-slate-200 flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-900" />
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Boardroom Discussion</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {chatHistory.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-white border border-slate-200 text-slate-600'}`}>
                                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                            </div>
                            <div className={`p-3 rounded-lg text-sm max-w-[80%] ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                     {isChatting && (
                        <div className="flex gap-3">
                             <div className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0">
                                <Users className="w-4 h-4" />
                             </div>
                             <div className="bg-white border border-slate-200 p-3 rounded-lg">
                                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                             </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
                    <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
                        placeholder="Ask the Board for advice or clarification..."
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled={isChatting}
                    />
                    <button 
                        onClick={handleChatSubmit}
                        disabled={!chatInput.trim() || isChatting}
                        className="bg-indigo-900 text-white p-2 rounded-lg hover:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex gap-4 justify-center">
                {!isApproved && (
                <button onClick={handleRevise} className="bg-white border-2 border-slate-200 text-slate-700 px-6 py-3 rounded-lg hover:border-orange-500 hover:text-orange-600 font-bold transition-colors flex items-center gap-2">
                    <RefreshCcw className="w-4 h-4" /> Revise Proposal
                </button>
                )}
                {isApproved ? (
                    <button onClick={handleNextYear} className="bg-indigo-900 text-white px-6 py-3 rounded-lg hover:bg-indigo-800 font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
                        Advance to Year {gameState.year + 1} <ArrowRight className="w-4 h-4" />
                    </button>
                ) : (
                    <button onClick={handleRestart} className="bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-700 font-bold shadow-lg transition-all flex items-center gap-2">
                    Give Up / Restart
                    </button>
                )}
            </div>
            </div>
        </div>

        <footer className="py-6 text-center border-t border-emerald-100/50 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 mb-2 text-slate-400 opacity-70">
                <span className="text-xs">Simulator by</span>
                <Logo className="h-6" />
            </div>
        </footer>
      </div>
    );
  }

  // 6. Simulation Dashboard
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans pb-20">
      <header className="bg-white text-slate-900 p-4 shadow-sm sticky top-0 z-40 border-b border-slate-200">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Logo className="h-10" />
            <div className="hidden md:block h-8 w-px bg-slate-300 mx-2"></div>
            <div className="hidden md:block">
              <h1 className="font-bold text-sm leading-tight text-slate-500 uppercase tracking-widest">School District Budget Simulator</h1>
              <p className="text-xs text-indigo-600 font-bold">{SCENARIOS[scenarioId].title} • Year {gameState.year}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
             <button 
                onClick={handleRestart}
                className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors text-xs font-medium"
             >
                <RotateCcw className="w-4 h-4" /> Start Over
             </button>
             <a 
                href="mailto:paul@education.associates?subject=Simulator Feedback" 
                className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors text-xs font-medium"
            >
                <MessageSquare className="w-4 h-4" /> Feedback
            </a>
            {!isCompact && (
                <div className="hidden md:block text-right border-l border-slate-200 pl-6">
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">Est. Fund Balance</div>
                    <div className={`font-mono font-bold text-xl ${gameState.fundBalance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    ${gameState.fundBalance.toLocaleString()}
                    </div>
                </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 mt-0">
        {/* Sticky Cockpit */}
        <div className={`sticky top-[73px] z-30 bg-slate-100/90 backdrop-blur-sm transition-all duration-300 border-b border-slate-200/50 ${isCompact ? 'py-2 shadow-md' : 'pt-4 pb-2 -mx-4 px-4 mb-4 shadow-sm'}`}>
            <div className={isCompact ? 'max-w-6xl mx-auto' : ''}>
               <Cockpit state={gameState} schools={derivedSchools} compact={isCompact} />
            </div>
        </div>

        <div className="space-y-8">
          <Scatterplot schools={derivedSchools} />
          <TheGrid 
              cards={decisions} 
              onMoveCard={handleMoveCard} 
              fundOneTimeRemaining={oneTimeRemaining}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={historyIndex > 0}
              canRedo={historyIndex < history.length - 1}
              onAddProposal={handleAddProposal}
          />
          <NarrativeBuilder 
              decisions={decisions} 
              onSubmit={handleSubmit} 
              isSubmitting={isSubmitting} 
              allSorted={allProposalsSorted}
          />
        </div>
      </main>

      <footer className="max-w-6xl mx-auto py-6 text-center flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 mb-2 text-slate-400 opacity-70">
            <span className="text-xs">Simulator by</span>
            <Logo className="h-6" />
        </div>
        {censusSource && (
            <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                <Info className="w-3 h-3" /> Financial Data Sourced from: {censusSource}
            </p>
        )}
      </footer>
    </div>
  );
}

export default App;
