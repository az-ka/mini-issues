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
		clerkId: v.string(), // The 'subject' from Clerk JWT
		role: v.union(v.literal('reporter'), v.literal('developer'), v.literal('admin')),
		departmentId: v.optional(v.id('departments'))
	}).index('by_clerk_id', ['clerkId']),

	departments: defineTable({
		name: v.string(),
		slug: v.string(),
		isActive: v.boolean()
	}).index('by_slug', ['slug']),

	reports: defineTable({
		title: v.string(),
		type: v.union(v.literal('bug'), v.literal('feature'), v.literal('improvement')),
		departmentId: v.optional(v.id('departments')),
		reporterId: v.id('users'),
		assigneeId: v.optional(v.id('users')),
		status: v.string(),
		voteCount: v.number(),
		duplicateOfId: v.optional(v.id('reports')),
		timelineEstimate: v.optional(v.string()),

		// Common fields
		module: v.optional(v.string()),
		description: v.optional(v.string()),
		businessImpact: v.optional(v.string()),

		// Bug-specific fields
		priority: v.optional(v.string()),
		environment: v.optional(v.string()),
		stepsToReproduce: v.optional(v.string()),
		frequency: v.optional(v.string()),
		expectedResult: v.optional(v.string()),
		actualResult: v.optional(v.string()),

		// Feature-specific fields
		businessUrgency: v.optional(v.string()),
		userStory: v.optional(v.string()),
		currentProblem: v.optional(v.string()),
		acceptanceCriteria: v.optional(v.string()),

		createdAt: v.number(),
		updatedAt: v.number()
	})
		.index('by_reporter', ['reporterId'])
		.index('by_department', ['departmentId'])
		.index('by_status', ['status']),

	comments: defineTable({
		reportId: v.id('reports'),
		authorId: v.id('users'),
		content: v.string(),
		parentId: v.optional(v.id('comments')),
		isPrivate: v.boolean(),
		editedAt: v.optional(v.number()),
		createdAt: v.number()
	}).index('by_report', ['reportId']),

	votes: defineTable({
		reportId: v.id('reports'),
		userId: v.id('users'),
		departmentName: v.string() // Snapshot of user's department at time of vote
	}).index('by_report_and_user', ['reportId', 'userId']),

	notifications: defineTable({
		userId: v.id('users'),
		reportId: v.id('reports'),
		commentId: v.optional(v.id('comments')),
		type: v.string(), // status_change, mention, assigned
		content: v.string(),
		isRead: v.boolean(),
		createdAt: v.number()
	}).index('by_user_unread', ['userId', 'isRead']),

	// One active chat session per user — persists across refreshes and devices
	chatSessions: defineTable({
		clerkId: v.string(),
		messages: v.string(), // JSON-serialized Message[]
		isChatDone: v.boolean(),
		reportId: v.optional(v.string()),
		updatedAt: v.number()
	}).index('by_clerk_id', ['clerkId'])
});
