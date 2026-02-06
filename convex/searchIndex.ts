import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const search = query({
  args: {
    query: v.string(),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.query || args.query.length < 2) {
      return [];
    }

    let results;
    if (args.type) {
      results = await ctx.db
        .query("searchIndex")
        .withSearchIndex("search_content", (q) =>
          q.search("content", args.query).eq("type", args.type as string)
        )
        .take(50);
    } else {
      results = await ctx.db
        .query("searchIndex")
        .withSearchIndex("search_content", (q) =>
          q.search("content", args.query)
        )
        .take(50);
    }

    return results;
  },
});

export const upsert = mutation({
  args: {
    path: v.string(),
    type: v.string(),
    title: v.string(),
    content: v.string(),
    snippet: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if document exists
    const existing = await ctx.db
      .query("searchIndex")
      .withIndex("by_path", (q) => q.eq("path", args.path))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: Date.now(),
      });
      return { updated: true, id: existing._id };
    }

    const id = await ctx.db.insert("searchIndex", {
      ...args,
      updatedAt: Date.now(),
    });
    return { updated: false, id };
  },
});

export const bulkSync = mutation({
  args: {
    documents: v.array(
      v.object({
        path: v.string(),
        type: v.string(),
        title: v.string(),
        content: v.string(),
        snippet: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let updated = 0;
    let created = 0;

    for (const doc of args.documents) {
      const existing = await ctx.db
        .query("searchIndex")
        .withIndex("by_path", (q) => q.eq("path", doc.path))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...doc,
          updatedAt: Date.now(),
        });
        updated++;
      } else {
        await ctx.db.insert("searchIndex", {
          ...doc,
          updatedAt: Date.now(),
        });
        created++;
      }
    }

    return { updated, created };
  },
});

export const clear = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("searchIndex").collect();
    for (const doc of all) {
      await ctx.db.delete(doc._id);
    }
    return { deleted: all.length };
  },
});
