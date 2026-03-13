import { json, error } from '@sveltejs/kit';
import { GoogleGenAI } from '@google/genai';
import { GEMINI_API_KEY } from '$env/static/private';
import type { RequestHandler } from './$types';

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export interface ChatMessage {
	role: 'user' | 'model';
	text: string;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	// Must be authenticated
	const { userId } = locals.auth();
	if (!userId) {
		error(401, 'Unauthorized');
	}

	let body: { messages: ChatMessage[]; systemInstruction: string };
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid JSON body');
	}

	const { messages, systemInstruction } = body;

	if (!messages || !Array.isArray(messages) || messages.length === 0) {
		error(400, 'messages must be a non-empty array');
	}

	// Convert to Gemini history format (all messages except the last one)
	const history = messages.slice(0, -1).map((m) => ({
		role: m.role,
		parts: [{ text: m.text }]
	}));

	const lastMessage = messages.at(-1)!;

	try {
		const chat = ai.chats.create({
			model: 'gemini-2.5-flash',
			config: {
				systemInstruction,
				temperature: 0.7,
				maxOutputTokens: 1024
			},
			history
		});

		const response = await chat.sendMessage({ message: lastMessage.text });

		return json({ text: response.text });
	} catch (err) {
		console.error('[/api/chat] Gemini error:', err);
		error(500, 'Gagal menghubungi AI. Coba lagi.');
	}
};
