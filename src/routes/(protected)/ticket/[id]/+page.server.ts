import { error } from '@sveltejs/kit';
import { TRELLO_API_KEY, TRELLO_TOKEN } from '$env/static/private';
import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';
import type { PageServerLoad } from './$types';
import type { Id } from '../../../../convex/_generated/dataModel';

const TRELLO_BASE = 'https://api.trello.com/1';
const ONE_HOUR_MS = 60 * 60 * 1000;

export const load: PageServerLoad = async ({ params, locals }) => {
	const { getToken } = locals.auth();
	const token = await getToken({ template: 'convex' });
	if (!token) error(401, 'Unauthorized');

	const convex = new ConvexHttpClient(PUBLIC_CONVEX_URL);
	convex.setAuth(token);

	// Validate and fetch report — invalid Convex IDs throw ArgumentValidationError
	let report;
	try {
		report = await convex.query(api.reports.getById, {
			id: params.id as Id<'reports'>
		});
	} catch {
		error(404, 'Tiket tidak ditemukan');
	}

	if (!report) error(404, 'Tiket tidak ditemukan');

	// Fetch reporter name from users table
	let reporterName: string | undefined;
	try {
		const reporter = await convex.query(api.users.getById, { id: report.reporterId });
		reporterName = reporter?.name;
	} catch {
		// Non-critical — page still works without reporter name
	}

	// Only fetch Trello status if card has been sent and cooldown has passed
	const shouldFetch =
		report.trelloCardId &&
		(!report.trelloLastFetched || Date.now() - report.trelloLastFetched > ONE_HOUR_MS);

	if (shouldFetch) {
		try {
			const res = await fetch(
				`${TRELLO_BASE}/cards/${report.trelloCardId}?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}&fields=idList`,
				{ headers: { Accept: 'application/json' } }
			);

			if (res.ok) {
				const card = await res.json();

				// Fetch the list name from the list ID
				const listRes = await fetch(
					`${TRELLO_BASE}/lists/${card.idList}?key=${TRELLO_API_KEY}&token=${TRELLO_TOKEN}&fields=name`,
					{ headers: { Accept: 'application/json' } }
				);
				const listName: string | undefined = listRes.ok
					? (await listRes.json()).name
					: undefined;

				await convex.mutation(api.reports.updateTrelloStatus, {
					id: params.id as Id<'reports'>,
					trelloStatus: listName,
					trelloCardFound: true,
					trelloLastFetched: Date.now()
				});

				return { report: { ...report, trelloStatus: listName, trelloCardFound: true }, reporterName };
			} else if (res.status === 404) {
				await convex.mutation(api.reports.updateTrelloStatus, {
					id: params.id as Id<'reports'>,
					trelloStatus: undefined,
					trelloCardFound: false,
					trelloLastFetched: Date.now()
				});

				return { report: { ...report, trelloStatus: undefined, trelloCardFound: false }, reporterName };
			}
		} catch {
			// Trello fetch failed — return cached data, don't crash the page
		}
	}

	return { report, reporterName };
};
