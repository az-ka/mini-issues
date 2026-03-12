import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

/** List all whitelisted emails — admin only */
export const list = query({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query('whitelist').order('desc').collect();
	}
});

/** Check if a specific email is whitelisted */
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

/** Add an email to the whitelist */
export const add = mutation({
	args: {
		email: v.string(),
		name: v.string()
	},
	handler: async (ctx, { email, name }) => {
		const normalized = email.toLowerCase().trim();

		// Prevent duplicates
		const existing = await ctx.db
			.query('whitelist')
			.withIndex('by_email', (q) => q.eq('email', normalized))
			.unique();

		if (existing !== null) {
			throw new Error(`Email ${normalized} sudah terdaftar di whitelist.`);
		}

		return await ctx.db.insert('whitelist', {
			email: normalized,
			name: name.trim(),
			addedAt: Date.now()
		});
	}
});

/** Remove an email from the whitelist by document ID */
export const remove = mutation({
	args: { id: v.id('whitelist') },
	handler: async (ctx, { id }) => {
		await ctx.db.delete(id);
	}
});
