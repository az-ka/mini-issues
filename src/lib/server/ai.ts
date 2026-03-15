import { env } from '$env/dynamic/private';
import { GoogleGenAI } from '@google/genai';

/**
 * Reads all Gemini API keys from env.
 * Supports GEMINI_API_KEYS (comma-separated) and/or GEMINI_API_KEY (single).
 * Deduplicates while preserving order — first key has highest priority.
 */
function getApiKeys(): string[] {
	const keys: string[] = [];

	if (env.GEMINI_API_KEYS) {
		keys.push(
			...env.GEMINI_API_KEYS.split(',')
				.map((k) => k.trim())
				.filter(Boolean)
		);
	}
	if (env.GEMINI_API_KEY) {
		keys.push(env.GEMINI_API_KEY.trim());
	}

	return [...new Set(keys)];
}

function isRateLimit(err: unknown): boolean {
	const status = (err as { status?: number })?.status;
	return status === 429 || status === 503;
}

function isAuthError(err: unknown): boolean {
	const status = (err as { status?: number })?.status;
	return status === 401 || status === 403;
}

/**
 * Generate a single text response.
 * Tries each (key × model) combination until one succeeds.
 * Throws a descriptive error if all are exhausted.
 */
export async function generateText(
	prompt: string,
	models: readonly string[],
	options?: { temperature?: number; maxOutputTokens?: number }
): Promise<string> {
	const keys = getApiKeys();
	if (keys.length === 0)
		throw new Error('[AI] No Gemini API keys configured (GEMINI_API_KEY or GEMINI_API_KEYS)');

	let lastError: unknown;

	for (const key of keys) {
		const ai = new GoogleGenAI({ apiKey: key });
		const keyHint = `...${key.slice(-4)}`;

		for (const model of models) {
			try {
				const result = await ai.models.generateContent({
					model,
					contents: prompt,
					config: options
				});
				return result.text ?? '';
			} catch (err) {
				if (isAuthError(err)) {
					console.warn(`[AI] Key ${keyHint} auth error — skipping key`);
					break; // next key
				}
				if (isRateLimit(err)) {
					console.warn(`[AI] ${model} (key ${keyHint}) rate-limited — trying next model`);
					lastError = err;
					continue;
				}
				console.error(`[AI] ${model} (key ${keyHint}) error:`, err);
				lastError = err;
				continue;
			}
		}
	}

	throw new Error(
		`[AI] Semua model Gemini tidak tersedia saat ini. Coba lagi beberapa saat. (${String(lastError)})`
	);
}

/**
 * Generate a chat response with conversation history.
 * Tries each (key × model) combination until one succeeds.
 * Throws a descriptive error if all are exhausted.
 */
export async function generateChatResponse(
	history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
	lastMessage: string,
	models: readonly string[],
	options?: {
		systemInstruction?: string;
		temperature?: number;
		maxOutputTokens?: number;
	}
): Promise<string> {
	const keys = getApiKeys();
	if (keys.length === 0)
		throw new Error('[AI] No Gemini API keys configured (GEMINI_API_KEY or GEMINI_API_KEYS)');

	let lastError: unknown;

	for (const key of keys) {
		const ai = new GoogleGenAI({ apiKey: key });
		const keyHint = `...${key.slice(-4)}`;

		for (const model of models) {
			try {
				const chat = ai.chats.create({
					model,
					config: {
						systemInstruction: options?.systemInstruction,
						temperature: options?.temperature ?? 0.7,
						maxOutputTokens: options?.maxOutputTokens ?? 1024
					},
					history
				});
				const response = await chat.sendMessage({ message: lastMessage });
				return response.text ?? '';
			} catch (err) {
				if (isAuthError(err)) {
					console.warn(`[AI] Key ${keyHint} auth error — skipping key`);
					break; // next key
				}
				if (isRateLimit(err)) {
					console.warn(`[AI] ${model} (key ${keyHint}) rate-limited — trying next model`);
					lastError = err;
					continue;
				}
				console.error(`[AI] ${model} (key ${keyHint}) error:`, err);
				lastError = err;
				continue;
			}
		}
	}

	throw new Error(
		`[AI] Semua model Gemini tidak tersedia saat ini. Coba lagi beberapa saat. (${String(lastError)})`
	);
}
