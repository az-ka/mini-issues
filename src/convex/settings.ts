import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';

const DEFAULTS = {
	notifyOnNew: true
};

// Get settings — returns defaults if not yet configured
export const get = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return DEFAULTS;

		const settings = await ctx.db.query('settings').first();
		return settings ?? DEFAULTS;
	}
});

// Update settings (admin only — caller must ensure admin check on client)
export const update = mutation({
	args: {
		notifyOnNew: v.boolean()
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new ConvexError('Not authenticated');

		const existing = await ctx.db.query('settings').first();
		if (existing) {
			await ctx.db.patch(existing._id, args);
		} else {
			await ctx.db.insert('settings', args);
		}
	}
});
