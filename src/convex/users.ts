import { mutation, query } from "./_generated/server";

/**
 * Sync the current authenticated Clerk user to the Convex database.
 */
export const syncUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Check if the user already exists in Convex based on Clerk's 'subject'
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (user === null) {
      // If the user doesn't exist, create a new record
      return await ctx.db.insert("users", {
        name: identity.name,
        email: identity.email,
        picture: identity.pictureUrl,
        clerkId: identity.subject,
        role: "reporter", // Default role
      });
    }

    // If the user exists, update their profile information from Clerk
    await ctx.db.patch(user._id, {
      name: identity.name,
      email: identity.email,
      picture: identity.pictureUrl,
    });

    return user._id;
  },
});

/**
 * Get the current authenticated user's Convex document.
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
  },
});
