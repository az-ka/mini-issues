import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted so vi.mock factories can reference them
const mockEnv = vi.hoisted(() => ({}) as Record<string, string | undefined>);
const mockGenerateContent = vi.hoisted(() => vi.fn());
const mockSendMessage = vi.hoisted(() => vi.fn());
const mockChatsCreate = vi.hoisted(() => vi.fn());

vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));

vi.mock('@google/genai', () => ({
	GoogleGenAI: class {
		models = { generateContent: mockGenerateContent };
		chats = { create: mockChatsCreate };
	}
}));

import { generateText, generateChatResponse } from './ai';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeRateLimitError(status: 429 | 503 = 429) {
	const err = new Error('Rate limited');
	(err as { status?: number }).status = status;
	return err;
}

function makeAuthError() {
	const err = new Error('Unauthorized');
	(err as { status?: number }).status = 401;
	return err;
}

// ─── generateText ────────────────────────────────────────────────────────────

describe('generateText', () => {
	beforeEach(() => {
		Object.keys(mockEnv).forEach((k) => delete mockEnv[k as keyof typeof mockEnv]);
		vi.resetAllMocks(); // also clears queued mockOnce values between tests
	});

	it('throws immediately if no API keys are configured', async () => {
		await expect(generateText('prompt', ['model-1'])).rejects.toThrow(
			'No Gemini API keys configured'
		);
	});

	it('returns text on first successful call', async () => {
		mockEnv.GEMINI_API_KEY = 'key-a';
		mockGenerateContent.mockResolvedValue({ text: 'hello' });

		const result = await generateText('prompt', ['model-1']);
		expect(result).toBe('hello');
		expect(mockGenerateContent).toHaveBeenCalledOnce();
	});

	it('retries next model on 429 rate limit', async () => {
		mockEnv.GEMINI_API_KEY = 'key-a';
		mockGenerateContent
			.mockRejectedValueOnce(makeRateLimitError(429))
			.mockResolvedValueOnce({ text: 'ok from model-2' });

		const result = await generateText('prompt', ['model-1', 'model-2']);
		expect(result).toBe('ok from model-2');
		expect(mockGenerateContent).toHaveBeenCalledTimes(2);
	});

	it('retries next model on 503 service unavailable', async () => {
		mockEnv.GEMINI_API_KEY = 'key-a';
		mockGenerateContent
			.mockRejectedValueOnce(makeRateLimitError(503))
			.mockResolvedValueOnce({ text: 'ok' });

		const result = await generateText('prompt', ['model-1', 'model-2']);
		expect(result).toBe('ok');
	});

	it('skips to next key entirely on auth error (401)', async () => {
		mockEnv.GEMINI_API_KEYS = 'key-bad,key-good';
		mockGenerateContent
			.mockRejectedValueOnce(makeAuthError()) // key-bad fails with 401
			.mockResolvedValueOnce({ text: 'from key-good' }); // key-good succeeds

		const result = await generateText('prompt', ['model-1']);
		expect(result).toBe('from key-good');
		expect(mockGenerateContent).toHaveBeenCalledTimes(2);
	});

	it('moves to second key when first key exhausts all models via rate limit', async () => {
		mockEnv.GEMINI_API_KEYS = 'key-1,key-2';
		mockGenerateContent
			.mockRejectedValueOnce(makeRateLimitError()) // key-1, model-1
			.mockRejectedValueOnce(makeRateLimitError()) // key-1, model-2
			.mockResolvedValueOnce({ text: 'from key-2' }); // key-2, model-1

		const result = await generateText('prompt', ['model-1', 'model-2']);
		expect(result).toBe('from key-2');
		expect(mockGenerateContent).toHaveBeenCalledTimes(3);
	});

	it('deduplicates keys from GEMINI_API_KEYS and GEMINI_API_KEY', async () => {
		// key-a appears in both — should only be tried once
		mockEnv.GEMINI_API_KEYS = 'key-a,key-b';
		mockEnv.GEMINI_API_KEY = 'key-a';

		mockGenerateContent
			.mockRejectedValueOnce(makeRateLimitError()) // key-a (once)
			.mockRejectedValueOnce(makeRateLimitError()) // key-b
			// If no dedup: key-a would be tried again and succeed ← should NOT happen
			.mockResolvedValueOnce({ text: 'should not reach here' });

		// With deduplication: only 2 unique keys → both exhausted → throws
		await expect(generateText('prompt', ['model-1'])).rejects.toThrow(
			'Semua model Gemini tidak tersedia'
		);
		expect(mockGenerateContent).toHaveBeenCalledTimes(2); // not 3
	});

	it('reads GEMINI_API_KEYS comma-separated list as multiple keys', async () => {
		mockEnv.GEMINI_API_KEYS = 'key-1, key-2, key-3'; // with spaces
		mockGenerateContent
			.mockRejectedValueOnce(makeRateLimitError()) // key-1
			.mockRejectedValueOnce(makeRateLimitError()) // key-2
			.mockResolvedValueOnce({ text: 'from key-3' }); // key-3

		const result = await generateText('prompt', ['model-1']);
		expect(result).toBe('from key-3');
	});

	it('throws a descriptive error when all keys and models are exhausted', async () => {
		mockEnv.GEMINI_API_KEY = 'only-key';
		mockGenerateContent.mockRejectedValue(makeRateLimitError());

		await expect(generateText('prompt', ['model-1', 'model-2'])).rejects.toThrow(
			'Semua model Gemini tidak tersedia'
		);
	});

	it('passes prompt and options to generateContent', async () => {
		mockEnv.GEMINI_API_KEY = 'key-a';
		mockGenerateContent.mockResolvedValue({ text: '0' });

		await generateText('select a board', ['fast-model'], {
			temperature: 0,
			maxOutputTokens: 5
		});

		expect(mockGenerateContent).toHaveBeenCalledWith(
			expect.objectContaining({
				model: 'fast-model',
				contents: 'select a board',
				config: { temperature: 0, maxOutputTokens: 5 }
			})
		);
	});
});

// ─── generateChatResponse ────────────────────────────────────────────────────

describe('generateChatResponse', () => {
	const history = [{ role: 'user' as const, parts: [{ text: 'hi' }] }];

	beforeEach(() => {
		Object.keys(mockEnv).forEach((k) => delete mockEnv[k as keyof typeof mockEnv]);
		vi.resetAllMocks(); // also clears queued mockOnce values between tests
		mockChatsCreate.mockImplementation(() => ({ sendMessage: mockSendMessage }));
	});

	it('throws immediately if no API keys are configured', async () => {
		await expect(generateChatResponse(history, 'hello', ['model-1'])).rejects.toThrow(
			'No Gemini API keys configured'
		);
	});

	it('returns text on success and passes history + message correctly', async () => {
		mockEnv.GEMINI_API_KEY = 'key-a';
		mockSendMessage.mockResolvedValue({ text: 'AI reply' });

		const result = await generateChatResponse(history, 'hello', ['model-1'], {
			systemInstruction: 'You are helpful',
			temperature: 0.7
		});

		expect(result).toBe('AI reply');
		expect(mockChatsCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				model: 'model-1',
				history,
				config: expect.objectContaining({ temperature: 0.7 })
			})
		);
		expect(mockSendMessage).toHaveBeenCalledWith({ message: 'hello' });
	});

	it('retries next model on rate limit', async () => {
		mockEnv.GEMINI_API_KEY = 'key-a';
		mockSendMessage
			.mockRejectedValueOnce(makeRateLimitError())
			.mockResolvedValueOnce({ text: 'ok on model-2' });

		const result = await generateChatResponse(history, 'msg', ['model-1', 'model-2']);
		expect(result).toBe('ok on model-2');
		expect(mockChatsCreate).toHaveBeenCalledTimes(2);
	});

	it('tries next key on auth error', async () => {
		mockEnv.GEMINI_API_KEYS = 'expired-key,valid-key';
		mockSendMessage.mockRejectedValueOnce(makeAuthError()).mockResolvedValueOnce({ text: 'ok' });

		const result = await generateChatResponse(history, 'msg', ['model-1']);
		expect(result).toBe('ok');
	});

	it('throws descriptive error when all keys and models exhausted', async () => {
		mockEnv.GEMINI_API_KEY = 'only-key';
		mockSendMessage.mockRejectedValue(makeRateLimitError());

		await expect(generateChatResponse(history, 'msg', ['model-1'])).rejects.toThrow(
			'Semua model Gemini tidak tersedia'
		);
	});
});
