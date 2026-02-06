import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// POST /log - Log an activity from OpenClaw
http.route({
  path: "/log",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { type, description, status, metadata } = body;

    if (!type || !description || !status) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: type, description, status" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const id = await ctx.runMutation(api.activities.add, {
      timestamp: Date.now(),
      type,
      description,
      status,
      metadata,
    });

    return new Response(JSON.stringify({ ok: true, id }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }),
});

// POST /sync/cron - Sync cron jobs from OpenClaw
http.route({
  path: "/sync/cron",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { jobs } = body;

    if (!Array.isArray(jobs)) {
      return new Response(
        JSON.stringify({ error: "Missing jobs array" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await ctx.runMutation(api.cronJobs.sync, { jobs });

    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }),
});

// POST /sync/search - Sync search index from OpenClaw
http.route({
  path: "/sync/search",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { documents } = body;

    if (!Array.isArray(documents)) {
      return new Response(
        JSON.stringify({ error: "Missing documents array" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await ctx.runMutation(api.searchIndex.bulkSync, { documents });

    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }),
});

// CORS preflight for all endpoints
http.route({
  path: "/log",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

http.route({
  path: "/sync/cron",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

http.route({
  path: "/sync/search",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

export default http;
