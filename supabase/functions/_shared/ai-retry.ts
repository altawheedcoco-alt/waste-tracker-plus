/**
 * Shared AI retry utility - Uses Google Gemini API directly (free tier).
 * Falls back to Lovable AI Gateway if GOOGLE_GEMINI_API_KEY is not set.
 */

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const LOVABLE_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "gemini-2.0-flash";
const LOVABLE_DEFAULT_MODEL = "google/gemini-3-flash-preview";
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
  apiKeyOrLovableKey: string,
  options: AIRequestOptions
): Promise<Response> {
  // Check if we have a direct Google Gemini API key
  const geminiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
  
  if (geminiKey) {
    return callGeminiDirect(geminiKey, options);
  }
  
  // Fallback to Lovable AI Gateway
  return callLovableGateway(apiKeyOrLovableKey, options);
}

async function callGeminiDirect(
  apiKey: string,
  options: AIRequestOptions
): Promise<Response> {
  const { model = DEFAULT_MODEL, ...rest } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${GEMINI_API_URL}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, ...rest }),
      });

      if (response.status === 429) {
        console.warn(`Gemini rate limit hit, attempt ${attempt}/${MAX_RETRIES}`);
        if (attempt < MAX_RETRIES) {
          await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
          continue;
        }
        return response;
      }
      
      if (response.status >= 500 && attempt < MAX_RETRIES) {
        const text = await response.text();
        console.warn(`Gemini attempt ${attempt}/${MAX_RETRIES} failed with ${response.status}: ${text.substring(0, 100)}`);
        lastError = new Error(`Gemini error: ${response.status}`);
        await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Gemini attempt ${attempt}/${MAX_RETRIES} network error: ${lastError.message}`);
      if (attempt < MAX_RETRIES) {
        await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
      }
    }
  }

  throw lastError || new Error("All Gemini retries failed");
}

async function callLovableGateway(
  apiKey: string,
  options: AIRequestOptions
): Promise<Response> {
  const { model = LOVABLE_DEFAULT_MODEL, ...rest } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(LOVABLE_GATEWAY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, ...rest }),
      });

      if (response.status === 429 || response.status === 402) {
        return response;
      }
      
      if (response.status >= 500 && attempt < MAX_RETRIES) {
        const text = await response.text();
        console.warn(`AI Gateway attempt ${attempt}/${MAX_RETRIES} failed: ${text.substring(0, 100)}`);
        lastError = new Error(`AI gateway error: ${response.status}`);
        await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
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
  try {
    return JSON.parse(content);
  } catch {}

  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1].trim());
    } catch {}
  }

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

export { GEMINI_API_URL as AI_GATEWAY_URL, DEFAULT_MODEL };
