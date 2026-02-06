import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.type) {
      const all = await ctx.db
        .query("activities")
        .withIndex("by_timestamp")
        .order("desc")
        .collect();
      return all.filter((a) => a.type === args.type);
    }
    return await ctx.db
      .query("activities")
      .withIndex("by_timestamp")
      .order("desc")
      .collect();
  },
});

export const add = mutation({
  args: {
    timestamp: v.number(),
    type: v.string(),
    description: v.string(),
    status: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activities", args);
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const samples = [
      { timestamp: now - 1000 * 60 * 2, type: "message", description: "Operator briefing acknowledged.", status: "success" },
      { timestamp: now - 1000 * 60 * 15, type: "tool call", description: "Web search completed.", status: "success" },
      { timestamp: now - 1000 * 60 * 45, type: "file edit", description: "Updated MEMORY.md with new context.", status: "success" },
      { timestamp: now - 1000 * 60 * 120, type: "deployment", description: "Deployed finance-app to Vercel.", status: "success" },
      { timestamp: now - 1000 * 60 * 180, type: "system", description: "Gateway restarted after config update.", status: "success" },
    ];
    for (const s of samples) {
      await ctx.db.insert("activities", s);
    }
    return { inserted: samples.length };
  },
});
