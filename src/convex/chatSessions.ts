import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';

async function getClerkId(ctx: {
	auth: { getUserIdentity: () => Promise<{ subject: string } | null> };
}) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) throw new ConvexError('Not authenticated');
	return identity.subject;
}

export const getSession = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		return await ctx.db
			.query('chatSessions')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
			.first();
	}
});

export const saveSession = mutation({
	args: {
		messages: v.string(),
		isChatDone: v.boolean(),
		reportId: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const clerkId = await getClerkId(ctx);

		const existing = await ctx.db
			.query('chatSessions')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkId))
			.first();

		const data = {
			clerkId,
			messages: args.messages,
			isChatDone: args.isChatDone,
			reportId: args.reportId,
			updatedAt: Date.now()
		};

		if (existing) {
			await ctx.db.patch(existing._id, data);
		} else {
			await ctx.db.insert('chatSessions', data);
		}
	}
});

export const clearSession = mutation({
	args: {},
	handler: async (ctx) => {
		const clerkId = await getClerkId(ctx);

		const existing = await ctx.db
			.query('chatSessions')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', clerkId))
			.first();

		if (existing) {
			await ctx.db.delete(existing._id);
		}
	}
});
