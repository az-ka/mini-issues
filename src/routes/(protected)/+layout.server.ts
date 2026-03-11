import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	const { userId } = locals.auth();

	if (!userId) {
		redirect(307, '/');
	}

	return { userId };
};
