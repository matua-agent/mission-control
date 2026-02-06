import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  activities: defineTable({
    timestamp: v.number(),
    type: v.string(),
    description: v.string(),
    status: v.string(),
    metadata: v.optional(v.any()),
  }).index("by_timestamp", ["timestamp"]),
});
