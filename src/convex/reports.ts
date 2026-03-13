import { ConvexError, v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { MutationCtx } from './_generated/server';

const TYPE_MAP: Record<string, 'bug' | 'feature' | 'improvement'> = {
	Bug: 'bug',
	'Feature Request': 'feature',
	Improvement: 'improvement'
};

async function requireUser(ctx: MutationCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) throw new ConvexError('Not authenticated');

	const user = await ctx.db
		.query('users')
		.withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
		.first();

	if (!user) throw new ConvexError('User not found. Please refresh and try again.');
	return user;
}

export const saveDraft = mutation({
	args: {
		title: v.string(),
		type: v.string(),
		priority: v.string(),
		module: v.string(),
		description: v.string(),
		stepsToReproduce: v.optional(v.array(v.string())),
		expectedBehavior: v.optional(v.string()),
		actualBehavior: v.optional(v.string()),
		frequency: v.optional(v.string()),
		businessImpact: v.string()
	},
	handler: async (ctx, args) => {
		const user = await requireUser(ctx);
		const now = Date.now();

		return await ctx.db.insert('reports', {
			title: args.title.slice(0, 80),
			type: TYPE_MAP[args.type] ?? 'bug',
			status: 'draft',
			reporterId: user._id,
			voteCount: 0,
			priority: args.priority.toLowerCase(),
			module: args.module,
			description: args.description,
			stepsToReproduce: args.stepsToReproduce?.join('\n'),
			expectedResult: args.expectedBehavior,
			actualResult: args.actualBehavior,
			frequency: args.frequency,
			businessImpact: args.businessImpact,
			createdAt: now,
			updatedAt: now
		});
	}
});

export const getDraft = query({
	args: { id: v.id('reports') },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;

		const report = await ctx.db.get(args.id);
		if (!report) return null;

		// Only the reporter can view their own draft
		const user = await ctx.db
			.query('users')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
			.first();

		if (!user || report.reporterId !== user._id) return null;

		return report;
	}
});

export const markSentToTrello = mutation({
	args: {
		id: v.id('reports'),
		trelloCardId: v.string(),
		trelloCardUrl: v.string(),
		attachmentUrls: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new ConvexError('Not authenticated');

		const report = await ctx.db.get(args.id);
		if (!report) throw new ConvexError('Report not found');

		const user = await ctx.db
			.query('users')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
			.first();

		if (!user || report.reporterId !== user._id) throw new ConvexError('Unauthorized');

		await ctx.db.patch(args.id, {
			status: 'open',
			trelloCardId: args.trelloCardId,
			trelloCardUrl: args.trelloCardUrl,
			attachmentUrls: args.attachmentUrls,
			updatedAt: Date.now()
		});
	}
});
