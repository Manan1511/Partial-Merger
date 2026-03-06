/**
 * AI Service — Provider-agnostic wrapper for LLM-based diff analysis.
 *
 * Supports: OpenAI (gpt-4o), Anthropic (claude-sonnet-4-20250514), Gemini (gemini-2.0-flash).
 * All calls use native `fetch` — no extra npm packages needed.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** localStorage key for the user's AI configuration */
export const AI_STORAGE_KEY = "partial_merger_ai_config";

/** Supported LLM providers with their API details */
export const SUPPORTED_PROVIDERS = [
    {
        id: "gemini",
        name: "Google Gemini",
        model: "gemini-2.5-flash",
        // Gemini uses a query-param key; endpoint is built at call-time.
        endpoint: "https://generativelanguage.googleapis.com/v1beta/models",
    },
    {
        id: "openai",
        name: "OpenAI",
        model: "gpt-4o",
        endpoint: "https://api.openai.com/v1/chat/completions",
    },
    {
        id: "anthropic",
        name: "Anthropic",
        model: "claude-sonnet-4-20250514",
        endpoint: "https://api.anthropic.com/v1/messages",
        // NOTE: Anthropic does NOT set CORS headers, so browser-side calls
        // will fail without a proxy. We still include it for completeness.
    },
];

// ---------------------------------------------------------------------------
// System prompt — tells the LLM exactly what JSON to return
// ---------------------------------------------------------------------------

export const AI_SYSTEM_PROMPT = `You are a code-review assistant. You will receive a unified diff from a GitHub Pull Request.

Each changed line in the diff is pre-annotated with its unique ID in the format:
  [ID: fileName:old:lineNumber] for deletions (lines starting with -)
  [ID: fileName:new:lineNumber] for additions  (lines starting with +)
Context lines (unchanged, starting with a space) have NO [ID:] tag. Ignore them.

Your task:
1. Read every annotated line (lines that have an [ID:] tag).
2. Group them into logical "features" — a feature is a self-contained unit of functionality (e.g., "Add user authentication", "Fix pagination bug").
3. For each feature, copy the EXACT IDs from the [ID:] tags into the lineIds array.
4. Identify dependencies between features.

CRITICAL RULES:
- You MUST include EVERY annotated line ID in exactly one feature. No line may be skipped.
- Before responding, COUNT the total lineIds across all features and verify it equals the total number of annotated lines. If not, find and add the missing ones.
- Feature names should be short, human-readable labels.
- If a feature has no dependencies, map it to an empty array.
- Do NOT include context lines (lines without [ID:] tags).
- Do NOT wrap the JSON in markdown code fences.

Respond with ONLY valid JSON in this exact schema:

{
  "features": {
    "<feature_name>": {
      "description": "<one-sentence summary>",
      "lineIds": ["fileName:old:lineNumber", "fileName:new:lineNumber"]
    }
  },
  "dependencies": {
    "<feature_name>": ["<dependency_feature_name>"]
  }
}`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Reads the saved AI config from localStorage.
 * @returns {{ provider: string, apiKey: string } | null}
 */
export const getAIConfig = () => {
    try {
        const raw = localStorage.getItem(AI_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed?.provider && parsed?.apiKey) return parsed;
        return null;
    } catch {
        return null;
    }
};

/**
 * Saves the AI config to localStorage.
 * @param {string} provider  — one of 'openai' | 'anthropic' | 'gemini'
 * @param {string} apiKey
 */
export const saveAIConfig = (provider, apiKey) => {
    localStorage.setItem(AI_STORAGE_KEY, JSON.stringify({ provider, apiKey }));
};

/**
 * Removes the AI config from localStorage.
 */
export const clearAIConfig = () => {
    localStorage.removeItem(AI_STORAGE_KEY);
};

// ---------------------------------------------------------------------------
// Annotated diff builder — pre-computes line IDs for the AI
// ---------------------------------------------------------------------------

/**
 * Parse a raw unified diff and annotate each addition/deletion line with its
 * exact ID, so the AI doesn't have to compute IDs itself.
 *
 * @param {string} rawDiff — the raw unified diff string
 * @returns {{ annotatedDiff: string, allLineIds: string[] }}
 */
const buildAnnotatedDiff = (rawDiff) => {
    const allLineIds = [];
    const outputLines = [];

    const files = rawDiff.split('diff --git a/');
    for (const fileChunk of files) {
        if (!fileChunk.trim()) continue;

        const lines = fileChunk.split('\n');
        const headerLine = lines[0];
        const fileName = headerLine.split(' b/')[0];

        // Re-add the diff header
        outputLines.push(`diff --git a/${headerLine}`);

        const chunkStartIndex = lines.findIndex(line => line.startsWith('@@'));
        if (chunkStartIndex === -1) {
            // No hunks — just push the header lines
            for (let i = 1; i < lines.length; i++) outputLines.push(lines[i]);
            continue;
        }

        // Push lines between diff header and first chunk (e.g., ---/+++ lines)
        for (let i = 1; i < chunkStartIndex; i++) outputLines.push(lines[i]);

        let oldLineNum = 0;
        let newLineNum = 0;

        for (let i = chunkStartIndex; i < lines.length; i++) {
            const line = lines[i];

            if (line.startsWith('@@')) {
                const match = line.match(/@@ \-(\d+),?\d* \+(\d+),?\d* @@/);
                if (match) {
                    oldLineNum = parseInt(match[1]) - 1;
                    newLineNum = parseInt(match[2]) - 1;
                }
                outputLines.push(line);
                continue;
            }

            if (line.startsWith('\\')) {
                outputLines.push(line);
                continue;
            }

            if (line.startsWith('-')) {
                oldLineNum++;
                const id = `${fileName}:old:${oldLineNum}`;
                allLineIds.push(id);
                outputLines.push(`[ID: ${id}] ${line}`);
            } else if (line.startsWith('+')) {
                newLineNum++;
                const id = `${fileName}:new:${newLineNum}`;
                allLineIds.push(id);
                outputLines.push(`[ID: ${id}] ${line}`);
            } else {
                // Context line — increment both counters, no annotation
                if (line !== '') {
                    oldLineNum++;
                    newLineNum++;
                }
                outputLines.push(line);
            }
        }
    }

    return { annotatedDiff: outputLines.join('\n'), allLineIds };
};

// ---------------------------------------------------------------------------
// Post-response validation — catch missed lines
// ---------------------------------------------------------------------------

/**
 * Compare the AI's returned lineIds against the full set of addition/deletion
 * IDs. Any missed lines are grouped into an auto-generated "Uncategorized
 * Changes" feature.
 *
 * @param {object} parsed       — the AI's parsed response { features, dependencies }
 * @param {string[]} allLineIds — every addition/deletion ID from the diff
 * @returns {object}            — the validated (and possibly augmented) response
 */
const validateCoverage = (parsed, allLineIds) => {
    // Collect every ID the AI returned
    const coveredIds = new Set();
    for (const feature of Object.values(parsed.features)) {
        for (const id of (feature.lineIds || [])) {
            coveredIds.add(id);
        }
    }

    // Find which IDs are missing
    const missedIds = allLineIds.filter(id => !coveredIds.has(id));

    if (missedIds.length > 0) {
        parsed.features["Uncategorized Changes"] = {
            description: `${missedIds.length} line(s) the AI did not assign to any feature.`,
            lineIds: missedIds,
        };
        if (!parsed.dependencies["Uncategorized Changes"]) {
            parsed.dependencies["Uncategorized Changes"] = [];
        }
    }

    return parsed;
};

// ---------------------------------------------------------------------------
// Provider-specific request builders
// ---------------------------------------------------------------------------

/**
 * Build a fetch request for the selected provider.
 * @param {string} providerId
 * @param {string} apiKey
 * @param {string} annotatedDiff — the diff with [ID:] annotations
 * @returns {{ url: string, options: RequestInit }}
 */
const buildRequest = (providerId, apiKey, annotatedDiff) => {
    const userMessage = `Here is the annotated unified diff. Each changed line is tagged with its [ID:]. Use these exact IDs in your response.\n\n${annotatedDiff}`;

    switch (providerId) {
        case "openai": {
            return {
                url: "https://api.openai.com/v1/chat/completions",
                options: {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model: "gpt-4o",
                        response_format: { type: "json_object" },
                        messages: [
                            { role: "system", content: AI_SYSTEM_PROMPT },
                            { role: "user", content: userMessage },
                        ],
                        temperature: 0.2,
                    }),
                },
            };
        }

        case "anthropic": {
            return {
                url: "https://api.anthropic.com/v1/messages",
                options: {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": apiKey,
                        "anthropic-version": "2023-06-01",
                        // Required for browser-side calls (may still be blocked by CORS)
                        "anthropic-dangerous-direct-browser-access": "true",
                    },
                    body: JSON.stringify({
                        model: "claude-sonnet-4-20250514",
                        max_tokens: 4096,
                        system: AI_SYSTEM_PROMPT,
                        messages: [
                            { role: "user", content: userMessage },
                        ],
                    }),
                },
            };
        }

        case "gemini": {
            const model = "gemini-2.5-flash";
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            return {
                url,
                options: {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        systemInstruction: {
                            parts: [{ text: AI_SYSTEM_PROMPT }],
                        },
                        contents: [
                            {
                                role: "user",
                                parts: [{ text: userMessage }],
                            },
                        ],
                        generationConfig: {
                            temperature: 0.2,
                            responseMimeType: "application/json",
                        },
                    }),
                },
            };
        }

        default:
            throw new Error(`Unsupported AI provider: ${providerId}`);
    }
};

// ---------------------------------------------------------------------------
// Provider-specific response extractors
// ---------------------------------------------------------------------------

/**
 * Extract the raw text content from each provider's response shape.
 * @param {string} providerId
 * @param {object} json — parsed response body
 * @returns {string}
 */
const extractContent = (providerId, json) => {
    switch (providerId) {
        case "openai":
            return json?.choices?.[0]?.message?.content ?? "";
        case "anthropic":
            return json?.content?.[0]?.text ?? "";
        case "gemini":
            return json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        default:
            return "";
    }
};

// ---------------------------------------------------------------------------
// User-friendly error parser
// ---------------------------------------------------------------------------

/** Provider display names for error messages */
const PROVIDER_NAMES = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    gemini: "Google Gemini",
};

/**
 * Parse a failed API response into a short, actionable error message.
 * @param {number} status        — HTTP status code
 * @param {string} rawBody       — raw response body text
 * @param {string} providerId    — 'openai' | 'anthropic' | 'gemini'
 * @returns {string}             — user-friendly error message
 */
const parseAPIError = (status, rawBody, providerId) => {
    const name = PROVIDER_NAMES[providerId] ?? "AI provider";

    // Try to pull a short message from the JSON body
    let shortMessage = "";
    try {
        const json = JSON.parse(rawBody);
        // Each provider nests the message differently
        shortMessage =
            json?.error?.message ??  // OpenAI & Gemini
            json?.error?.error?.message ??
            json?.message ??         // Anthropic
            "";
    } catch {
        // body wasn't JSON — that's fine, we'll use status-based messages
    }

    // --- Status-based user-friendly messages ---
    switch (status) {
        case 401:
            return `Invalid API key. Please check your ${name} key in AI Settings and try again.`;

        case 403:
            return `Access denied by ${name}. Your API key may not have the required permissions.`;

        case 429: {
            // Extract retry delay if available
            let retryHint = "";
            try {
                const json = JSON.parse(rawBody);
                const retryInfo = json?.error?.details?.find(
                    (d) => d["@type"]?.includes("RetryInfo")
                );
                if (retryInfo?.retryDelay) {
                    retryHint = ` Try again in ${retryInfo.retryDelay}.`;
                }
            } catch {
                // ignore
            }

            // Check for quota-specific messages
            if (shortMessage.toLowerCase().includes("quota")) {
                return `You've exceeded your ${name} API quota. Check your plan and billing at your ${name} dashboard.${retryHint}`;
            }
            return `Rate limit reached for ${name}. Please wait a moment and try again.${retryHint}`;
        }

        case 400:
            return `Bad request sent to ${name}. The diff may be too large for this model. Try a smaller PR.`;

        case 404:
            return `${name} model not found. The model may have been deprecated or your plan may not include it.`;

        case 500:
        case 502:
        case 503:
            return `${name} is temporarily unavailable. Please try again in a few moments.`;

        default:
            // Fallback: trim the short message to something reasonable
            if (shortMessage.length > 0 && shortMessage.length < 200) {
                return `${name} error: ${shortMessage}`;
            }
            return `${name} returned an error (HTTP ${status}). Please try again or switch providers.`;
    }
};

// ---------------------------------------------------------------------------
// Main public function
// ---------------------------------------------------------------------------

/**
 * Send the diff to the configured AI provider and get back feature groupings.
 *
 * @param {string} diffText — the raw unified diff string
 * @param {{ provider: string, apiKey: string }} [configOverride] — optional session-only config
 * @returns {Promise<{ features: object, dependencies: object }>}
 * @throws {Error} if not configured, network fails, or response is invalid JSON.
 */
export const analyzeWithAI = async (diffText, configOverride = null) => {
    const config = configOverride || getAIConfig();
    if (!config) {
        throw new Error("AI is not configured. Please set up a provider and API key first.");
    }

    // Pre-annotate the diff with [ID:] tags so the AI copies exact IDs
    const { annotatedDiff, allLineIds } = buildAnnotatedDiff(diffText);

    const { provider, apiKey } = config;
    const { url, options } = buildRequest(provider, apiKey, annotatedDiff);

    let response;
    try {
        response = await fetch(url, options);
    } catch (networkErr) {
        if (provider === "anthropic") {
            throw new Error(
                "Could not reach Anthropic's API. Anthropic blocks direct browser requests (CORS). Use Gemini or OpenAI instead."
            );
        }
        throw new Error(
            "Could not connect to the AI provider. Check your internet connection and try again."
        );
    }

    if (!response.ok) {
        const rawBody = await response.text().catch(() => "");
        throw new Error(parseAPIError(response.status, rawBody, provider));
    }

    const responseJson = await response.json();
    const rawContent = extractContent(provider, responseJson);

    // Parse the JSON that the LLM returned
    let parsed;
    try {
        parsed = typeof rawContent === "string" ? JSON.parse(rawContent) : rawContent;
    } catch {
        throw new Error("The AI returned an invalid response. Please try again.");
    }

    // Basic shape validation
    if (!parsed?.features || typeof parsed.features !== "object") {
        throw new Error("The AI response was missing expected data. Please try again.");
    }

    // Ensure dependencies key exists
    if (!parsed.dependencies || typeof parsed.dependencies !== "object") {
        parsed.dependencies = {};
    }

    // Validate coverage — auto-create "Uncategorized Changes" for missed lines
    parsed = validateCoverage(parsed, allLineIds);

    return parsed;
};
