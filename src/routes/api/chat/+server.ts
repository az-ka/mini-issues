import { json, error } from '@sveltejs/kit';
import { SYSTEM_PROMPT } from '$lib/server/systemPrompt';
import { generateChatResponse } from '$lib/server/ai';
import type { RequestHandler } from './$types';

// Best quality first, high-RPM models as safety net
const GEMINI_MODELS = [
	'gemini-2.5-flash', // RPD 20, RPM 5
	'gemini-2.5-flash-lite', // RPD 20, RPM 10
	'gemini-3.1-flash-lite', // RPD 500, RPM 15
	'gemma-3-27b-it',
	'gemma-3-12b-it',
	'gemma-3-4b-it',
	'gemma-3-1b-it'
] as const;

export interface ChatMessage {
	role: 'user' | 'model';
	text: string;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const { userId } = locals.auth();
	if (!userId) error(401, 'Unauthorized');

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

	try {
		const text = await generateChatResponse(history, lastMessage.text, GEMINI_MODELS, {
			systemInstruction: SYSTEM_PROMPT,
			temperature: 0.4,
			maxOutputTokens: 1024
		});
		return json({ text });
	} catch (err) {
		console.error('[/api/chat] All models exhausted:', err);
		error(500, 'Semua model AI sedang tidak tersedia. Coba lagi beberapa saat.');
	}
};
