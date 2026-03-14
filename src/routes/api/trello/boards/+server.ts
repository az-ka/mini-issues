import { json, error } from '@sveltejs/kit';
import { TRELLO_API_KEY, TRELLO_TOKEN } from '$env/static/private';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const { userId } = locals.auth();
	if (!userId) error(401, 'Unauthorized');

	const workspaceId = env.TRELLO_WORKSPACE_ID?.trim();

	const url = workspaceId
		? `https://api.trello.com/1/organizations/${workspaceId}/boards?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}&fields=id,name&filter=open`
		: `https://api.trello.com/1/members/me/boards?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}&fields=id,name&filter=open`;

	const res = await fetch(url);

	if (!res.ok) {
		const msg = workspaceId
			? `Gagal mengambil board dari workspace "${workspaceId}". Pastikan TRELLO_WORKSPACE_ID benar.`
			: 'Gagal mengambil daftar board dari Trello.';
		error(502, msg);
	}

	const boards = (await res.json()) as { id: string; name: string }[];

	return json(boards.map((b) => ({ id: b.id, name: b.name })));
};
