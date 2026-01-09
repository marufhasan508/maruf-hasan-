
import { GoogleGenAI, Type } from "@google/genai";
import { SpeechAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_PROMPT = `
You are Lumina, a friendly and premium English speaking coach. 
Evaluate the following user transcription. 

CRITICAL RULES:
1. Detect the language. If the user speaks in Bengali (even partially), status must be 'wrong_language'.
2. If the user speaks in English, check for grammar, pronunciation hints (from text context), and natural phrasing.
3. If it is perfect English, status is 'correct'.
4. If there are any mistakes, status is 'mistake'. Provide the corrected sentence and a short friendly feedback.
5. Always provide a short, conversational reply to what the user said to keep the conversation going.

Response must be in JSON format.
`;

export async function analyzeSpeech(transcript: string): Promise<SpeechAnalysis> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: transcript,
      config: {
        systemInstruction: ANALYSIS_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: {
              type: Type.STRING,
              description: "Status: 'correct', 'mistake', or 'wrong_language'",
            },
            correction: {
              type: Type.STRING,
              description: "The full corrected sentence if it was a mistake",
            },
            feedback: {
              type: Type.STRING,
              description: "Short feedback explaining why it was a mistake or encouraging the user",
            },
            reply: {
              type: Type.STRING,
              description: "A short conversational reply from Lumina",
            },
          },
          propertyOrdering: ["status", "correction", "feedback", "reply"],
          required: ["status", "correction", "feedback", "reply"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result as SpeechAnalysis;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      status: 'correct',
      correction: '',
      feedback: 'I missed that, could you say it again?',
      reply: "I'm sorry, I had a small technical glitch. What were you saying?"
    };
  }
}
