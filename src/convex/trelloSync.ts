import { mutation, query } from './_generated/server';
import { v, ConvexError } from 'convex/values';
import type { MutationCtx, QueryCtx } from './_generated/server';

async function assertAdmin(ctx: QueryCtx | MutationCtx): Promise<void> {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) throw new ConvexError('Tidak terautentikasi.');
	const email = identity.email?.toLowerCase().trim();
	const adminEmails = (process.env.ADMIN_EMAILS ?? '')
		.split(',')
		.map((s) => s.trim().toLowerCase())
		.filter(Boolean);
	if (!email || !adminEmails.includes(email)) {
		throw new ConvexError('Akses ditolak: hanya admin yang dapat melakukan ini.');
	}
}

/** Get the cached Trello sync data */
export const get = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) return null;
		const rows = await ctx.db.query('trelloSync').collect();
		return rows[0] ?? null;
	}
});

/** Save (upsert) synced Trello data — admin only */
export const save = mutation({
	args: { data: v.string() },
	handler: async (ctx, args) => {
		await assertAdmin(ctx);
		const rows = await ctx.db.query('trelloSync').collect();
		if (rows.length > 0) {
			await ctx.db.patch(rows[0]._id, { data: args.data, syncedAt: Date.now() });
		} else {
			await ctx.db.insert('trelloSync', { data: args.data, syncedAt: Date.now() });
		}
	}
});
