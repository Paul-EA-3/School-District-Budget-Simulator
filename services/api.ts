
import { FAST_MODEL, PRO_MODEL, safeJsonParse, safetySettings } from "./gemini";
import genAI from "./gemini";

export interface FinancialState {
  revenue: number;
  expenditure: number;
  salaries: number;
  federalRevenue: number;
  enrollment?: number; 
  source: string[];
}

export interface StateFiscalData {
  ppe: number;
  proficiency: { math: number; ela: number; composite: number };
  economicallyDisadvantaged: number;
  enrollment: number;
  source: string;
}

export interface StateApiDiscovery {
  state_abbreviation: string;
  finance_api_url: string;
  assessment_api_url: string;
  source_authority: string;
}

/**
 * Entry point for API discovery.
 * Uses Gemini 3 Pro (Thinking) to intelligently find specific State API endpoints.
 */
export const find_state_api = async (state_abbreviation: string): Promise<StateApiDiscovery | null> => {
  try {
    const response = await genAI.models.generateContent({
        model: PRO_MODEL,
        config: {
            tools: [{ googleSearch: {} }] as any,
            safetySettings
        },
        contents: `For the state with the abbreviation ${state_abbreviation}, find the most direct public URL for:
      1. District-Level Per-Pupil Expenditure (PPE) Data.
      2. District-Level Academic Assessment Proficiency Rates (e.g., state test scores).
      
      If a direct API is unavailable, find the public URL for the raw data file (CSV, JSON, XML) hosted on the state's official website or the most relevant structured federal API (e.g., NCES, Census). Use {DISTRICT_ID} as a placeholder for the URL's query parameter where applicable.
      
      RETURN JSON ONLY with the following properties:
      - state_abbreviation (string): The two-letter abbreviation of the state.
      - finance_api_url (string): The most relevant public API/raw data URL for PPE or finance data.
      - assessment_api_url (string): The most relevant public API/raw data URL for test/proficiency data.
      - source_authority (string): The name of the agency or portal that hosts the data.
    `});

    const text = response.text;
    if (!text) return null;
    
    return safeJsonParse(text) as StateApiDiscovery;
  } catch (e) {
    console.warn("API Discovery Failed", e);
    return null;
  }
};

/**
 * Fetches high-precision state-level data using AI as a live web scraper.
 * Queries State Department of Education data via Google Search using Thinking Mode.
 */
export const fetchStateLevelData = async (state: string, districtName: string): Promise<StateFiscalData | null> => {
    try {
        const response = await genAI.models.generateContent({
            model: PRO_MODEL,
            config: {
                tools: [{ googleSearch: {} }] as any,
                responseMimeType: "application/json",
                safetySettings
            },
            contents: `ACT AS A DATA SCRAPER.
          Task: Find official State Department of Education data for: "${districtName}" in ${state}.
          
          MANDATE: Perform a Google Search for these exact terms:
          1. "${districtName} ${state} school district report card 2024 per pupil expenditure"
          2. "${districtName} ${state} assessment proficiency rates math ela 2024"
          3. "${districtName} ${state} student demographics poverty rate"

          EXTRACT these EXACT values from the search snippets/results:
          - Per-Pupil Expenditure (PPE): Look for "Per Pupil Spending", "Current Expenditures per Student".
          - Proficiency: Math % and ELA % (e.g. MCAP, STAAR, CAASPP scores).
          - Poverty: % Economically Disadvantaged or Free/Reduced Lunch.
          - Enrollment: Total students.

          RETURN JSON ONLY:
          {
            "ppe": number (e.g. 15400),
            "proficiency": { "math": number (0-100), "ela": number (0-100), "composite": number },
            "economicallyDisadvantaged": number (decimal 0.0-1.0, e.g. 0.45 for 45%),
            "enrollment": number,
            "source": "String (e.g. 'Maryland State Dept of Education Report Card')"
          }
        `});

        const text = response.text;
        if (!text) return null;

        const data = safeJsonParse(text);

        // Basic Validation
        if (!data.ppe || !data.proficiency) return null;

        return data as StateFiscalData;

    } catch (error) {
        console.warn("State Data AI Fetch Failed:", error);
        return null;
    }
};

export const fetchUSAspending = async (districtName: string): Promise<{amount: number, source: string} | null> => {
    try {
        const url = `https://api.usaspending.gov/api/v2/references/keyword_search/?keyword=${encodeURIComponent(districtName)}&limit=5`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) return null;
        
        const data = await response.json();
        const recipient = data.results?.find((r: any) => 
            r.name.toLowerCase().includes(districtName.toLowerCase()) && 
            r.destination === "recipient"
        );

        if (recipient) {
            return {
                amount: 0, 
                source: `USAspending.gov (Recipient: ${recipient.name})`
            };
        }
        return null;
    } catch (error) {
        return null;
    }
}

export const fetchSocrataBudget = async (state: string, districtName: string): Promise<string | null> => {
  try {
    const query = `${districtName} school budget`;
    const url = `https://api.us.socrata.com/api/catalog/v1?q=${encodeURIComponent(query)}&limit=1`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].link;
    }
    return null;
  } catch (error) {
    return null;
  }
};