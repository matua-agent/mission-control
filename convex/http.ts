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
      return new Response(JSON.stringify({ error: "Missing required fields: type, description, status" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
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
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }),
});

// CORS preflight
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

export default http;
