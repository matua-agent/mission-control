import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("cronJobs")
      .withIndex("by_nextRun")
      .order("asc")
      .collect();
  },
});

export const sync = mutation({
  args: {
    jobs: v.array(
      v.object({
        jobId: v.string(),
        name: v.string(),
        enabled: v.boolean(),
        schedule: v.string(),
        timezone: v.optional(v.string()),
        nextRunAt: v.number(),
        lastRunAt: v.optional(v.number()),
        description: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Delete all existing jobs
    const existing = await ctx.db.query("cronJobs").collect();
    for (const job of existing) {
      await ctx.db.delete(job._id);
    }

    // Insert new jobs
    for (const job of args.jobs) {
      await ctx.db.insert("cronJobs", job);
    }

    return { synced: args.jobs.length };
  },
});
