import { json, error } from '@sveltejs/kit';
import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY } from '$env/static/private';
import { SYSTEM_PROMPT } from '$lib/server/systemPrompt';
import type { RequestHandler } from './$types';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Fallback chain: best quality first, high-RPM models as safety net
const MODEL_CHAIN = [
  'gemini-2.5-flash',       // RPD 20, RPM 5
  'gemini-2.5-flash-lite',  // RPD 20, RPM 10

  'gemini-3.1-flash-lite',  // RPD 500, RPM 15, TPM 250K

  'gemma-3-27b-it',
  'gemma-3-12b-it',
  'gemma-3-4b-it',
  'gemma-3-1b-it',
] as const;

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

	// All messages except the last become history for the chat session
	const history = messages.slice(0, -1).map((m) => ({
		role: m.role,
		parts: [{ text: m.text }]
	}));

	const lastMessage = messages.at(-1)!;
	let lastError: unknown;

	for (const model of MODEL_CHAIN) {
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
			// Only fall through to the next model on rate limit (429) or quota errors
			if (status === 429 || status === 503) {
				console.warn(`[/api/chat] Model ${model} rate-limited, trying next...`);
				lastError = err;
				continue;
			}
			// Other errors (auth, invalid request, etc.) — fail immediately
			console.error(`[/api/chat] Model ${model} error:`, err);
			error(500, 'Gagal menghubungi AI. Coba lagi.');
		}
	}

	console.error('[/api/chat] All models exhausted:', lastError);
	error(500, 'Gagal menghubungi AI. Coba lagi.');
};
