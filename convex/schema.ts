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

  cronJobs: defineTable({
    jobId: v.string(),
    name: v.string(),
    enabled: v.boolean(),
    schedule: v.string(),
    timezone: v.optional(v.string()),
    nextRunAt: v.number(),
    lastRunAt: v.optional(v.number()),
    description: v.string(),
  }).index("by_nextRun", ["nextRunAt"]),

  searchIndex: defineTable({
    path: v.string(),
    type: v.string(), // memory, document, conversation
    title: v.string(),
    content: v.string(),
    snippet: v.string(),
    updatedAt: v.number(),
  })
    .index("by_path", ["path"])
    .index("by_type", ["type"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["type"],
    }),
});
