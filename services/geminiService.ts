import { GoogleGenAI } from "@google/genai";
import { GenerateContentResponse } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

let genAI: GoogleGenAI | null = null;

function getAI() {
  if (!genAI) {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    genAI = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAI;
}

export async function generateSummary(text: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Summarize the following document text. Provide:
1. A concise overview.
2. 5 key points.
3. 3-5 action items if applicable.

Return ONLY a JSON object with keys: "summary", "key_points" (array), and "action_items" (array).

Document text:
${text.substring(0, 10000)}`, // Limit for token safety
    config: {
      responseMimeType: "application/json",
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse Gemini summary response", response.text);
    return { summary: response.text, key_points: [], action_items: [] };
  }
}

export async function getEmbedding(text: string): Promise<number[]> {
  const ai = getAI();
  const result = await ai.models.embedContent({
    model: "gemini-embedding-2-preview",
    contents: [{ parts: [{ text }] }],
  });
  return result.embeddings[0].values;
}

export async function generateAnswer(query: string, context: string) {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a helpful document assistant. Use the following context from the document to answer the user's question. 
If the answer is not in the context, say you don't know, but answer as best as you can based ONLY on the provided context.

Context:
${context}

User Question: ${query}`,
  });

  return response.text;
}
