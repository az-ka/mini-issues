import { json, error } from '@sveltejs/kit';
import { TRELLO_API_KEY, TRELLO_TOKEN } from '$env/static/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	const { userId } = locals.auth();
	if (!userId) error(401, 'Unauthorized');

	const res = await fetch(
		`https://api.trello.com/1/boards/${params.boardId}/lists?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}&fields=id,name&filter=open`
	);

	if (!res.ok) error(502, 'Gagal mengambil daftar list dari Trello.');

	const lists = (await res.json()) as { id: string; name: string }[];

	return json(lists.map((l) => ({ id: l.id, name: l.name })));
};
