import { mutation, query } from './_generated/server';
import { v, ConvexError } from 'convex/values';
import type { MutationCtx, QueryCtx } from './_generated/server';

function getAdminEmails(): string[] {
	return (process.env.ADMIN_EMAILS ?? '')
		.split(',')
		.map((s) => s.trim().toLowerCase())
		.filter(Boolean);
}

async function assertAdmin(ctx: QueryCtx | MutationCtx): Promise<void> {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) throw new ConvexError('Tidak terautentikasi.');

	const email = identity.email?.toLowerCase().trim();
	if (!email || !getAdminEmails().includes(email)) {
		throw new ConvexError('Akses ditolak: hanya admin yang dapat melakukan ini.');
	}
}

/** List all boards — active ones first, then inactive */
export const list = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];
		return await ctx.db.query('trelloBoards').collect();
	}
});

/** List only active boards — shown to users in preview page */
export const listActive = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return [];
		const all = await ctx.db.query('trelloBoards').collect();
		return all.filter((b) => b.isActive);
	}
});

/** Add a new board — admin only */
export const add = mutation({
	args: {
		name: v.string(),
		boardId: v.string(),
		boardName: v.optional(v.string()),
		listId: v.string(),
		listName: v.optional(v.string()),
		isActive: v.boolean(),
		workspaceId: v.optional(v.string()),
		workspaceName: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		await assertAdmin(ctx);
		return await ctx.db.insert('trelloBoards', {
			name: args.name.trim(),
			boardId: args.boardId.trim(),
			boardName: args.boardName,
			listId: args.listId.trim(),
			listName: args.listName,
			isActive: args.isActive,
			workspaceId: args.workspaceId,
			workspaceName: args.workspaceName
		});
	}
});

/** Update an existing board — admin only */
export const update = mutation({
	args: {
		id: v.id('trelloBoards'),
		name: v.string(),
		boardId: v.string(),
		boardName: v.optional(v.string()),
		listId: v.string(),
		listName: v.optional(v.string()),
		isActive: v.boolean(),
		workspaceId: v.optional(v.string()),
		workspaceName: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		await assertAdmin(ctx);
		const { id, ...fields } = args;
		await ctx.db.patch(id, {
			name: fields.name.trim(),
			boardId: fields.boardId.trim(),
			boardName: fields.boardName,
			listId: fields.listId.trim(),
			listName: fields.listName,
			isActive: fields.isActive,
			workspaceId: fields.workspaceId,
			workspaceName: fields.workspaceName
		});
	}
});

/** Remove a board — admin only */
export const remove = mutation({
	args: { id: v.id('trelloBoards') },
	handler: async (ctx, { id }) => {
		await assertAdmin(ctx);
		await ctx.db.delete(id);
	}
});
