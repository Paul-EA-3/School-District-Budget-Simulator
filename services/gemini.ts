
import {
    getAI,
    getGenerativeModel,
    GoogleAIBackend,
    HarmCategory,
    HarmBlockThreshold
} from "firebase/ai";
import { app } from "../firebase";

// Model constants
// Note: gemini-2.0-flash is currently a good default for this SDK
export const FAST_MODEL = "gemini-2.0-flash";
export const PRO_MODEL = "gemini-2.0-flash-thinking-exp"; // or "gemini-1.5-pro"

// Initialize the Firebase AI Logic service
const ai = getAI(app, { backend: new GoogleAIBackend() });

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

/**
 * Core AI interaction helpers using Firebase AI Logic
 */

/**
 * Generates content using the specified model and contents.
 */
export async function generateAIContent(modelName: string, contents: any, options: any = {}) {
    const { tools, safetySettings: configSafety, ...generationConfig } = options;
    const model = getGenerativeModel(ai, {
        model: modelName,
        generationConfig,
        safetySettings: configSafety || safetySettings,
        tools
    });
    const result = await model.generateContent(contents);
    return {
        text: result.response.text(),
        response: result.response
    };
}

/**
 * Creates a chat session.
 */
export function createAIChat(modelName: string, history: any[], options: any = {}) {
    const { tools, safetySettings: configSafety, ...generationConfig } = options;
    const model = getGenerativeModel(ai, {
        model: modelName,
        generationConfig,
        safetySettings: configSafety || safetySettings,
        tools
    });
    const chatSession = model.startChat({
        history: history.map(m => ({
            role: m.role,
            parts: Array.isArray(m.parts) ? m.parts : [{ text: m.text || m.parts }]
        }))
    });

    return {
        sendMessage: async (message: any) => {
            const result = await chatSession.sendMessage(message);
            return {
                text: result.response.text(),
                response: result.response
            };
        }
    };
}

/**
 * genAI compatibility object for existing call sites.
 */
const genAI = {
    models: {
        generateContent: async (args: { model: string, contents: any, config?: any }) => {
            return generateAIContent(args.model, args.contents, args.config);
        }
    },
    chats: {
        create: (args: { model: string, history: any[], config?: any }) => {
            return createAIChat(args.model, args.history, args.config);
        }
    }
};

export default genAI;
