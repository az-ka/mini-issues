import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { userId } = locals.auth();

	if (!userId) {
		redirect(307, '/');
	}

	const adminEmails = (process.env.ADMIN_EMAILS ?? '')
		.split(',')
		.map((s) => s.trim().toLowerCase())
		.filter(Boolean);

	return { userId, adminEmails };
};
