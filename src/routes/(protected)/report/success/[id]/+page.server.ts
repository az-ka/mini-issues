import { error } from '@sveltejs/kit';
import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../convex/_generated/api';
import type { PageServerLoad } from './$types';
import type { Id } from '../../../../../convex/_generated/dataModel';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { getToken } = locals.auth();
	const token = await getToken({ template: 'convex' });
	if (!token) error(401, 'Unauthorized');

	const convex = new ConvexHttpClient(PUBLIC_CONVEX_URL);
	convex.setAuth(token);

	let report;
	try {
		report = await convex.query(api.reports.getById, {
			id: params.id as Id<'reports'>
		});
	} catch {
		error(404, 'Tiket tidak ditemukan');
	}

	if (!report) error(404, 'Tiket tidak ditemukan');

	return { report };
};
