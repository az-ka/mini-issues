import { mutation, query } from './_generated/server';
import { v, ConvexError } from 'convex/values';
import type { MutationCtx, QueryCtx } from './_generated/server';

/**
 * Parse ADMIN_EMAILS env var — must be set in the Convex dashboard
 * (separate from the SvelteKit .env file).
 * Format: "email1@co.com,email2@co.com"
 */
function getAdminEmails(): string[] {
	return (process.env.ADMIN_EMAILS ?? '')
		.split(',')
		.map((s) => s.trim().toLowerCase())
		.filter(Boolean);
}

/** Throw if the caller is not an authenticated admin */
async function assertAdmin(ctx: QueryCtx | MutationCtx): Promise<void> {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) throw new ConvexError('Tidak terautentikasi.');

	const email = identity.email?.toLowerCase().trim();
	if (!email || !getAdminEmails().includes(email)) {
		throw new ConvexError('Akses ditolak: hanya admin yang dapat melakukan ini.');
	}
}

/** Check if a specific email is whitelisted — public query used by layout guard */
export const isAllowed = query({
	args: { email: v.string() },
	handler: async (ctx, { email }) => {
		const entry = await ctx.db
			.query('whitelist')
			.withIndex('by_email', (q) => q.eq('email', email.toLowerCase().trim()))
			.unique();

		return entry !== null;
	}
});

/**
 * Check if the current authenticated user is allowed to access the app.
 * Returns true if user is an admin (via ADMIN_EMAILS) OR is in the whitelist.
 * Used for server-side layout guard.
 */
export const isCurrentUserAllowed = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return false;

		const email = identity.email?.toLowerCase().trim();
		if (!email) return false;

		if (getAdminEmails().includes(email)) return true;

		const entry = await ctx.db
			.query('whitelist')
			.withIndex('by_email', (q) => q.eq('email', email))
			.unique();

		return entry !== null;
	}
});

/** Check if the current authenticated user is an admin — used for admin page guard */
export const isCurrentUserAdmin = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return false;

		const email = identity.email?.toLowerCase().trim();
		if (!email) return false;

		return getAdminEmails().includes(email);
	}
});

/** List all whitelisted emails — admin only */
export const list = query({
	args: {},
	handler: async (ctx) => {
		await assertAdmin(ctx);
		return await ctx.db.query('whitelist').order('desc').collect();
	}
});

/** Add an email to the whitelist — admin only */
export const add = mutation({
	args: {
		email: v.string(),
		name: v.string()
	},
	handler: async (ctx, { email, name }) => {
		await assertAdmin(ctx);

		const normalized = email.toLowerCase().trim();

		const existing = await ctx.db
			.query('whitelist')
			.withIndex('by_email', (q) => q.eq('email', normalized))
			.unique();

		if (existing !== null) {
			throw new ConvexError(`Email ${normalized} sudah terdaftar di whitelist.`);
		}

		return await ctx.db.insert('whitelist', {
			email: normalized,
			name: name.trim(),
			addedAt: Date.now()
		});
	}
});

/** Remove an email from the whitelist by document ID — admin only */
export const remove = mutation({
	args: { id: v.id('whitelist') },
	handler: async (ctx, { id }) => {
		await assertAdmin(ctx);
		await ctx.db.delete(id);
	}
});
