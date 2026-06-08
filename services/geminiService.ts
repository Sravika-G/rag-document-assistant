import { GoogleGenAI } from "@google/genai";
import { GenerateContentResponse } from "@google/genai";

let genAI: GoogleGenAI | null = null;

function getAI() {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not configured. Please supply a valid Google Gemini API Key in the settings.");
    }
    genAI = new GoogleGenAI({ 
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAI;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000,
  backoffFactor = 2
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      console.warn(`Gemini API call failed (attempt ${attempt}/${maxRetries}):`, error);
      
      const isTransient = 
        !error.status || 
        error.status === 503 || 
        error.status === 429 || 
        error.status >= 500 ||
        (error.message && (
          error.message.includes("503") || 
          error.message.includes("429") || 
          error.message.includes("UNAVAILABLE") || 
          error.message.includes("busy") || 
          error.message.includes("overloaded") || 
          error.message.includes("Resource has been exhausted") ||
          error.message.includes("rate limit")
        ));
      
      if (attempt >= maxRetries) {
        if (isTransient) {
          throw new Error("Gemini is busy, please try again in a moment.");
        }
        throw error;
      }
      
      const waitTime = delayMs * Math.pow(backoffFactor, attempt - 1) + Math.random() * 200;
      console.log(`Waiting ${Math.round(waitTime)}ms before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

/**
 * Executes a text generation model call with fallback and retries.
 */
async function generateContentWithFallback(params: {
  model?: string;
  contents: any;
  config?: any;
}): Promise<GenerateContentResponse> {
  const ai = getAI();
  const primaryModel = params.model || "gemini-3.5-flash";
  const fallbackModel = "gemini-3.1-flash-lite";

  try {
    console.log(`[Gemini API] Requesting primary model: ${primaryModel}`);
    return await retryWithBackoff(() => 
      ai.models.generateContent({
        ...params,
        model: primaryModel,
      }),
      2,
      800
    );
  } catch (primaryErr: any) {
    console.warn(`[Gemini API] Primary model ${primaryModel} failed. Retrying with fallback ${fallbackModel}...`, primaryErr);
    try {
      return await retryWithBackoff(() =>
        ai.models.generateContent({
          ...params,
          model: fallbackModel,
        }),
        2,
        1000
      );
    } catch (fallbackErr: any) {
      console.error(`[Gemini API] Both primary and fallback models failed.`);
      throw fallbackErr;
    }
  }
}

export async function generateSummary(text: string) {
  const response = await generateContentWithFallback({
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
    console.error("Failed to parse Gemini summary response:", response.text);
    return { 
      summary: response.text || "Summary unavailable at this moment.", 
      key_points: [], 
      action_items: [] 
    };
  }
}

export async function getEmbedding(text: string): Promise<number[]> {
  const ai = getAI();
  const result = await retryWithBackoff(() =>
    ai.models.embedContent({
      model: "gemini-embedding-2-preview",
      contents: [{ parts: [{ text }] }],
    })
  );
  return result.embeddings[0].values;
}

export async function generateAnswer(query: string, context: string) {
  const response = await generateContentWithFallback({
    contents: `You are a helpful document assistant. Use the following context from the document to answer the user's question. 
If the answer is not in the context, say you don't know, but answer as best as you can based ONLY on the provided context.

Context:
${context}

User Question: ${query}`,
  });

  return response.text || "I was unable to retrieve a response from the model. Please try again.";
}
