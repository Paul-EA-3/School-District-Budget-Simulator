
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

// Model constants
// Note: gemini-2.0-flash is currently a good default for this SDK
export const FAST_MODEL = "gemini-2.0-flash";
export const PRO_MODEL = "gemini-2.0-flash-thinking-exp"; // or "gemini-1.5-pro"

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

/**
 * Graceful initialization of GoogleGenAI.
 * If the API key is missing, we return null to allow the application to
 * load without crashing, while disabling AI-dependent features.
 */
let genAI: any = null;
if (apiKey && apiKey !== 'dummy' && apiKey !== 'your_gemini_api_key_here') {
    try {
        genAI = new GoogleGenAI(apiKey);
    } catch (e) {
        console.error("Failed to initialize GoogleGenAI:", e);
    }
} else {
    console.warn("VITE_GEMINI_API_KEY is not set or is using a placeholder. AI features will be unavailable.");
}

/**
 * Common safety settings
 */
export const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

/**
 * Helper: Safe JSON Parse with recovery
 */
export const safeJsonParse = (text: string) => {
    try {
        if (!text) return null;
        let clean = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
        clean = clean.replace(/[\n\r\t]/g, ' ');
        return JSON.parse(clean);
    } catch (e) {
        console.warn("JSON Parse Error, attempting recovery...", e);
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                return JSON.parse(match[0].replace(/[\n\r\t]/g, ' '));
            } catch (e2) {
                return null;
            }
        }
        return null;
    }
};

export default genAI;
