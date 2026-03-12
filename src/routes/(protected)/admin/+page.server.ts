import { redirect } from '@sveltejs/kit';
import { ConvexHttpClient } from 'convex/browser';
import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { api } from '../../../convex/_generated/api';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const auth = locals.auth();
	const { userId } = auth;

	if (!userId) redirect(307, '/');

	// Strict admin-only guard — no token = no entry
	const token = await auth.getToken({ template: 'convex' });
	if (!token) redirect(307, '/dashboard');

	const convex = new ConvexHttpClient(PUBLIC_CONVEX_URL);
	convex.setAuth(token);

	const isAdmin = await convex.query(api.whitelist.isCurrentUserAdmin, {});
	if (!isAdmin) redirect(307, '/dashboard');
};
