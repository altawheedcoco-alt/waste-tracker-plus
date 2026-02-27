/**
 * Shared AI Gateway retry utility for all edge functions.
 * Retries up to 3 times with exponential backoff on 500/502/503/504 errors.
 */

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3-flash-preview";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

interface AIRequestOptions {
  messages: Array<{ role: string; content: any }>;
  model?: string;
  temperature?: number;
  stream?: boolean;
  tools?: any[];
  tool_choice?: any;
}

export async function callAIWithRetry(
  apiKey: string,
  options: AIRequestOptions
): Promise<Response> {
  const { model = DEFAULT_MODEL, ...rest } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(AI_GATEWAY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, ...rest }),
      });

      // Don't retry on client errors (except 429 which we handle separately)
      if (response.status === 429) {
        return response; // Let caller handle rate limit
      }
      if (response.status === 402) {
        return response; // Let caller handle payment required
      }
      
      // Retry on server errors
      if (response.status >= 500 && attempt < MAX_RETRIES) {
        const text = await response.text();
        console.warn(`AI Gateway attempt ${attempt}/${MAX_RETRIES} failed with ${response.status}: ${text.substring(0, 100)}`);
        lastError = new Error(`AI gateway error: ${response.status}`);
        await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`AI Gateway attempt ${attempt}/${MAX_RETRIES} network error: ${lastError.message}`);
      if (attempt < MAX_RETRIES) {
        await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
      }
    }
  }

  throw lastError || new Error("All AI gateway retries failed");
}

/**
 * Helper to parse JSON from AI response content, handling markdown code blocks
 */
export function parseAIJsonResponse(content: string): any {
  // Try direct parse first
  try {
    return JSON.parse(content);
  } catch {}

  // Try extracting JSON from markdown code block
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch {}
  }

  // Try extracting any JSON object
  const objMatch = content.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]);
    } catch {}
  }

  throw new Error("Failed to parse AI JSON response");
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export { AI_GATEWAY_URL, DEFAULT_MODEL };
