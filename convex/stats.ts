import { query } from "./_generated/server";

export const overview = query({
  args: {},
  handler: async (ctx) => {
    // Count activities in last 24h
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentActivities = await ctx.db
      .query("activities")
      .withIndex("by_timestamp")
      .order("desc")
      .collect();
    
    const last24h = recentActivities.filter(a => a.timestamp > oneDayAgo);
    const totalActivities = recentActivities.length;

    // Count cron jobs
    const cronJobs = await ctx.db.query("cronJobs").collect();
    const enabledJobs = cronJobs.filter(j => j.enabled);

    // Count search documents
    const docs = await ctx.db.query("searchIndex").collect();

    // Activity breakdown by type (last 24h)
    const typeBreakdown: Record<string, number> = {};
    for (const a of last24h) {
      typeBreakdown[a.type] = (typeBreakdown[a.type] || 0) + 1;
    }

    // Success rate (last 24h)
    const successCount = last24h.filter(a => a.status === "success").length;
    const successRate = last24h.length > 0 
      ? Math.round((successCount / last24h.length) * 100) 
      : 100;

    // Last activity timestamp
    const lastActivity = recentActivities[0]?.timestamp || null;

    return {
      activitiesLast24h: last24h.length,
      totalActivities,
      cronJobsActive: enabledJobs.length,
      cronJobsTotal: cronJobs.length,
      indexedDocs: docs.length,
      typeBreakdown,
      successRate,
      lastActivity,
    };
  },
});
