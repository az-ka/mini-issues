import { json, error } from '@sveltejs/kit';
import { TRELLO_API_KEY, TRELLO_TOKEN } from '$env/static/private';
import type { RequestHandler } from './$types';

interface TrelloList {
	id: string;
	name: string;
}

interface TrelloBoard {
	id: string;
	name: string;
	lists: TrelloList[];
}

interface TrelloWorkspace {
	id: string;
	name: string;
	boards: TrelloBoard[];
}

const BASE = 'https://api.trello.com/1';
const AUTH = `key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}`;

async function fetchJson<T>(url: string): Promise<T> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Trello API error ${res.status}: ${url}`);
	return res.json();
}

export const GET: RequestHandler = async ({ locals }) => {
	const { userId } = locals.auth();
	if (!userId) error(401, 'Unauthorized');

	try {
		// 1. Fetch all workspaces the member belongs to
		const orgs = await fetchJson<{ id: string; displayName: string }[]>(
			`${BASE}/members/me/organizations?${AUTH}&fields=id,displayName`
		);

		// 2. Fetch boards for each workspace in parallel
		const workspacesWithBoards = await Promise.all(
			orgs.map(async (org) => {
				const boards = await fetchJson<{ id: string; name: string }[]>(
					`${BASE}/organizations/${org.id}/boards?${AUTH}&fields=id,name&filter=open`
				);

				// 3. Fetch lists for each board in parallel
				const boardsWithLists = await Promise.all(
					boards.map(async (board) => {
						const lists = await fetchJson<TrelloList[]>(
							`${BASE}/boards/${board.id}/lists?${AUTH}&fields=id,name&filter=open`
						);
						return { id: board.id, name: board.name, lists } satisfies TrelloBoard;
					})
				);

				return {
					id: org.id,
					name: org.displayName,
					boards: boardsWithLists
				} satisfies TrelloWorkspace;
			})
		);

		return json(workspacesWithBoards);
	} catch (err) {
		const msg = err instanceof Error ? err.message : 'Gagal sinkronisasi dari Trello.';
		error(502, msg);
	}
};
