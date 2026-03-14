import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	// Whitelist: Email addresses allowed to access the app
	whitelist: defineTable({
		email: v.string(),
		name: v.string(),
		addedAt: v.number()
	}).index('by_email', ['email']),

	// Users: Synced from Clerk identities
	users: defineTable({
		name: v.optional(v.string()),
		email: v.optional(v.string()),
		picture: v.optional(v.string()),
		clerkId: v.string() // The 'subject' from Clerk JWT
	}).index('by_clerk_id', ['clerkId']),

	reports: defineTable({
		title: v.string(),
		type: v.union(v.literal('bug'), v.literal('feature'), v.literal('improvement')),
		reporterId: v.id('users'),
		status: v.string(),

		// Common fields
		module: v.optional(v.string()),
		description: v.optional(v.string()),
		businessImpact: v.optional(v.string()),

		// Bug-specific fields
		priority: v.optional(v.string()),
		stepsToReproduce: v.optional(v.string()),
		frequency: v.optional(v.string()),
		expectedResult: v.optional(v.string()),
		actualResult: v.optional(v.string()),

		createdAt: v.number(),
		updatedAt: v.number(),

		// Trello integration
		trelloCardId: v.optional(v.string()),
		trelloCardUrl: v.optional(v.string()),
		attachmentUrls: v.optional(v.string()), // JSON array of { name, url }
		trelloStatus: v.optional(v.string()), // Name of the Trello list the card is in
		trelloCardFound: v.optional(v.boolean()), // false if card was deleted (404) on last fetch
		trelloArchived: v.optional(v.boolean()), // true if card.closed === true (archived in Trello)
		trelloListIndex: v.optional(v.number()), // 0-based index of the card's list (sorted by pos)
		trelloTotalLists: v.optional(v.number()), // Total open lists on the board at time of fetch
		trelloLastFetched: v.optional(v.number()), // Epoch ms of last Trello status fetch
		ticketNumber: v.optional(v.number()) // Sequential MI-XXX number
	})
		.index('by_reporter', ['reporterId'])
		.index('by_status', ['status']),

	// One active chat session per user — persists across refreshes and devices
	chatSessions: defineTable({
		clerkId: v.string(),
		messages: v.string(), // JSON-serialized Message[]
		isChatDone: v.boolean(),
		reportId: v.optional(v.string()),
		updatedAt: v.number()
	}).index('by_clerk_id', ['clerkId'])
});
