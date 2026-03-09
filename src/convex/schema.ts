import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users: Synced from Clerk identities
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    picture: v.optional(v.string()),
    clerkId: v.string(), // The 'subject' from Clerk JWT
    role: v.union(v.literal("reporter"), v.literal("developer"), v.literal("admin")),
    departmentId: v.optional(v.id("departments")),
  }).index("by_clerk_id", ["clerkId"]),

  departments: defineTable({
    name: v.string(),
    slug: v.string(),
    isActive: v.boolean(),
  }).index("by_slug", ["slug"]),

  reports: defineTable({
    title: v.string(),
    type: v.union(v.literal("bug"), v.literal("feature")),
    departmentId: v.id("departments"),
    reporterId: v.id("users"),
    assigneeId: v.optional(v.id("users")),
    status: v.string(), // Draft, Pending, In Progress, etc.
    voteCount: v.number(),
    duplicateOfId: v.optional(v.id("reports")),
    timelineEstimate: v.optional(v.string()),
    
    // Conditional fields for Bug
    priority: v.optional(v.string()), // low, medium, high, blocker
    environment: v.optional(v.string()),
    stepsToReproduce: v.optional(v.string()),
    frequency: v.optional(v.string()),
    expectedResult: v.optional(v.string()),
    actualResult: v.optional(v.string()),

    // Conditional fields for Feature
    businessUrgency: v.optional(v.string()),
    userStory: v.optional(v.string()),
    currentProblem: v.optional(v.string()),
    acceptanceCriteria: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
  .index("by_reporter", ["reporterId"])
  .index("by_department", ["departmentId"])
  .index("by_status", ["status"]),

  comments: defineTable({
    reportId: v.id("reports"),
    authorId: v.id("users"),
    content: v.string(),
    parentId: v.optional(v.id("comments")),
    isPrivate: v.boolean(),
    editedAt: v.optional(v.number()),
    createdAt: v.number(),
  }).index("by_report", ["reportId"]),

  votes: defineTable({
    reportId: v.id("reports"),
    userId: v.id("users"),
    departmentName: v.string(), // Snapshot of user's department at time of vote
  }).index("by_report_and_user", ["reportId", "userId"]),

  notifications: defineTable({
    userId: v.id("users"),
    reportId: v.id("reports"),
    commentId: v.optional(v.id("comments")),
    type: v.string(), // status_change, mention, assigned
    content: v.string(),
    isRead: v.boolean(),
    createdAt: v.number(),
  }).index("by_user_unread", ["userId", "isRead"]),
});
