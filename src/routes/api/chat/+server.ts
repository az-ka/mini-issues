import { json, error } from '@sveltejs/kit';
import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import { GEMINI_API_KEY } from '$env/static/private';
import { env } from '$env/dynamic/private';
import { SYSTEM_PROMPT } from '$lib/server/systemPrompt';
import type { RequestHandler } from './$types';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Fallback chain: best quality first, high-RPM models as safety net
const GEMINI_MODELS = [
	'gemini-2.5-flash', // RPD 20, RPM 5
	'gemini-2.5-flash-lite', // RPD 20, RPM 10
	'gemini-3.1-flash-lite', // RPD 500, RPM 15, TPM 250K
	'gemma-3-27b-it',
	'gemma-3-12b-it',
	'gemma-3-4b-it',
	'gemma-3-1b-it'
] as const;

// Groq fallback — only used when GROQ_API_KEY is set and all Gemini models are exhausted
const GROQ_MODELS = [
	'llama-3.3-70b-versatile', // 1K RPD, 12K TPM
	'llama-3.1-8b-instant' // 14.4K RPD — high volume safety net
] as const;

function getGroqClient(): Groq | null {
	const key = env.GROQ_API_KEY;
	if (!key) return null;
	return new Groq({ apiKey: key });
}

export interface ChatMessage {
	role: 'user' | 'model';
	text: string;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const { userId } = locals.auth();
	if (!userId) {
		error(401, 'Unauthorized');
	}

	let body: { messages: ChatMessage[] };
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON body');
	}

	const { messages } = body;

	if (!messages || !Array.isArray(messages) || messages.length === 0) {
		error(400, 'messages must be a non-empty array');
	}

	const history = messages.slice(0, -1).map((m) => ({
		role: m.role,
		parts: [{ text: m.text }]
	}));

	const lastMessage = messages.at(-1)!;
	let lastError: unknown;

	// 1. Try all Gemini models
	for (const model of GEMINI_MODELS) {
		try {
			const chat = ai.chats.create({
				model,
				config: {
					systemInstruction: SYSTEM_PROMPT,
					temperature: 0.7,
					maxOutputTokens: 1024
				},
				history
			});

			const response = await chat.sendMessage({ message: lastMessage.text });
			return json({ text: response.text });
		} catch (err) {
			const status = (err as { status?: number })?.status;
			if (status === 429 || status === 503) {
				console.warn(`[/api/chat] Gemini ${model} rate-limited, trying next...`);
				lastError = err;
				continue;
			}
			console.error(`[/api/chat] Gemini ${model} error:`, err);
			error(500, 'Gagal menghubungi AI. Coba lagi.');
		}
	}

	// 2. All Gemini models exhausted — try Groq if API key is configured
	const groq = getGroqClient();
	if (groq) {
		const groqHistory = messages.slice(0, -1).map((m) => ({
			role: m.role === 'model' ? ('assistant' as const) : ('user' as const),
			content: m.text
		}));

		for (const model of GROQ_MODELS) {
			try {
				console.warn(`[/api/chat] Falling back to Groq ${model}...`);
				const response = await groq.chat.completions.create({
					model,
					messages: [
						{ role: 'system', content: SYSTEM_PROMPT },
						...groqHistory,
						{ role: 'user', content: lastMessage.text }
					],
					temperature: 0.7,
					max_tokens: 1024
				});
				return json({ text: response.choices[0].message.content ?? '' });
			} catch (err) {
				const status = (err as { status?: number })?.status;
				if (status === 429 || status === 503) {
					console.warn(`[/api/chat] Groq ${model} rate-limited, trying next...`);
					lastError = err;
					continue;
				}
				console.error(`[/api/chat] Groq ${model} error:`, err);
				break;
			}
		}
	}

	console.error('[/api/chat] All models exhausted:', lastError);
	error(500, 'Gagal menghubungi AI. Coba lagi.');
};
