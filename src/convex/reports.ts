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

		// Compute next ticket number using MAX to avoid duplicates if any report is deleted
		const allReports = await ctx.db.query('reports').collect();
		const maxTicketNumber = allReports.reduce((max, r) => Math.max(max, r.ticketNumber ?? 0), 0);
		const ticketNumber = maxTicketNumber + 1;

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
			ticketNumber,
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

// Get a single report by ID — accessible to the reporter or any authenticated user (for developer view)
export const getById = query({
	args: { id: v.id('reports') },
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;
		return await ctx.db.get(args.id);
	}
});

// List reports for the current user, newest first, max 10
export const listByReporter = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];

		const user = await ctx.db
			.query('users')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
			.first();
		if (!user) return [];

		return await ctx.db
			.query('reports')
			.withIndex('by_reporter', (q) => q.eq('reporterId', user._id))
			.order('desc')
			.take(10);
	}
});

// List 10 most recent reports from all users, with reporter name joined
export const listRecent = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];

		const reports = await ctx.db.query('reports').order('desc').take(10);

		return await Promise.all(
			reports.map(async (report) => {
				const reporter = await ctx.db.get(report.reporterId);
				return { ...report, reporterName: reporter?.name ?? null };
			})
		);
	}
});

// List all reports newest first, with reporter name joined. Max 200.
export const listAll = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return { reports: [], reachedLimit: false };

		const currentUser = await ctx.db
			.query('users')
			.withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
			.first();

		const LIMIT = 200;
		const fetched = await ctx.db
			.query('reports')
			.order('desc')
			.take(LIMIT + 1);
		const reachedLimit = fetched.length > LIMIT;
		const page = fetched.slice(0, LIMIT);

		const reports = await Promise.all(
			page.map(async (report) => {
				const reporter = await ctx.db.get(report.reporterId);
				return {
					...report,
					reporterName: reporter?.name ?? null,
					isOwn: currentUser ? report.reporterId === currentUser._id : false
				};
			})
		);

		return { reports, reachedLimit };
	}
});

// Update Trello sync status (called from +page.server.ts after fetching Trello API)
export const updateTrelloStatus = mutation({
	args: {
		id: v.id('reports'),
		trelloStatus: v.optional(v.string()),
		trelloCardFound: v.boolean(),
		trelloArchived: v.optional(v.boolean()),
		trelloListIndex: v.optional(v.number()),
		trelloTotalLists: v.optional(v.number()),
		trelloLastFetched: v.number()
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) throw new ConvexError('Not authenticated');

		const report = await ctx.db.get(args.id);
		if (!report) throw new ConvexError('Report not found');

		await ctx.db.patch(args.id, {
			trelloStatus: args.trelloStatus,
			trelloCardFound: args.trelloCardFound,
			trelloArchived: args.trelloArchived,
			trelloListIndex: args.trelloListIndex,
			trelloTotalLists: args.trelloTotalLists,
			trelloLastFetched: args.trelloLastFetched,
			updatedAt: Date.now()
		});
	}
});
