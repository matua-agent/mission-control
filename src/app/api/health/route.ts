import { NextResponse } from "next/server";

const apps = [
  // Sports / Fitness
  { name: "Athlete IQ", url: "https://athlete-iq-seven.vercel.app" },
  { name: "Durability App", url: "https://durability-app-six.vercel.app" },
  { name: "beef (Workout)", url: "https://beef-workout-app.vercel.app" },
  { name: "TrainingLoad", url: "https://trainingload.vercel.app" },
  { name: "Wellness Monitor", url: "https://wellness-monitor-kappa.vercel.app" },
  { name: "Rep Sensor", url: "https://rep-sensor.vercel.app" },
  { name: "Snow Forecast", url: "https://snow-forecast-ca.vercel.app" },
  // AI / LLM demos — Prompt Engineering
  { name: "Prompt Lab", url: "https://prompt-lab-delta.vercel.app" },
  { name: "AI Eval Lab", url: "https://ai-eval-lab.vercel.app" },
  { name: "Multi-Agent Demo", url: "https://multi-agent-demo-wheat.vercel.app" },
  { name: "Voice AI Demo", url: "https://voice-ai-demo-one.vercel.app" },
  { name: "Context Engineering Studio", url: "https://context-engineering-studio.vercel.app" },
  { name: "Agent Memory Demo", url: "https://agent-memory-demo.vercel.app" },
  { name: "AI Interview Simulator", url: "https://ai-interview-simulator-woad.vercel.app" },
  { name: "AI PR Review", url: "https://ai-pr-review-omega.vercel.app" },
  { name: "GitHub Profile Analyzer", url: "https://github-profile-analyzer-theta.vercel.app" },
  // AI / LLM demos
  { name: "Pipeline Demo", url: "https://pipeline-demo-beta.vercel.app" },
  { name: "RAG Demo", url: "https://rag-demo-nine.vercel.app" },
  { name: "Tool Use Demo", url: "https://tool-use-demo.vercel.app" },
  { name: "MCP Server Demo", url: "https://mcp-server-demo-nu.vercel.app" },
  { name: "Model Faceoff", url: "https://model-faceoff.vercel.app" },
  { name: "Research Canvas", url: "https://research-canvas-ochre.vercel.app" },
  // Document / Legal AI
  { name: "Doc IQ", url: "https://doc-iq-one.vercel.app" },
  { name: "Code Reviewer", url: "https://code-reviewer-beta-six.vercel.app" },
  { name: "Contract Analyzer", url: "https://contract-analyzer-five.vercel.app" },
  { name: "Research Analyzer", url: "https://research-analyzer-three.vercel.app" },
  { name: "Legal Workflow Demo", url: "https://legal-workflow-demo.vercel.app" },
  { name: "LegalFlow", url: "https://legal-flow-neon.vercel.app" },
  // Productivity
  { name: "Company Intel", url: "https://company-intel-sigma.vercel.app" },
  { name: "Interview Prep", url: "https://interview-prep-kappa-navy.vercel.app" },
  { name: "Job Tracker", url: "https://job-tracker.vercel.app" },
  { name: "Code Explainer", url: "https://code-explainer-rho.vercel.app" },
  { name: "Clip Finder", url: "https://clip-finder.vercel.app" },
  // Finance / Real Estate
  { name: "Finance App", url: "https://finance-app-fawn-omega.vercel.app" },
  { name: "Currency App", url: "https://currency-app-wheat.vercel.app" },
  { name: "NZ Real Estate", url: "https://real-estate-app.vercel.app" },
  // NZ / Adventure
  { name: "NZ Adventure Planner", url: "https://nz-adventure-planner.vercel.app" },
  { name: "Travel Site", url: "https://travel-site-pi-eight.vercel.app" },
  // Collaboration
  { name: "Collab Whiteboard", url: "https://collab-whiteboard-nine.vercel.app" },
  { name: "AI Form Explorer", url: "https://ai-form-explorer.vercel.app" },
  { name: "Remotion Demo", url: "https://remotion-demo-khaki.vercel.app" },
];

async function checkApp(app: { name: string; url: string }) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(app.url, {
      signal: controller.signal,
      method: "GET",
      headers: { "User-Agent": "MissionControl/1.0 HealthCheck" },
      redirect: "follow",
    });
    clearTimeout(timer);
    const responseTime = Date.now() - start;
    return {
      name: app.name,
      url: app.url,
      status: res.ok ? "ok" : "error",
      statusCode: res.status,
      responseTime,
      checkedAt: Date.now(),
    };
  } catch (err: unknown) {
    const responseTime = Date.now() - start;
    const message = err instanceof Error ? err.message : "Unknown error";
    return {
      name: app.name,
      url: app.url,
      status: "error",
      statusCode: null,
      responseTime,
      error: message.includes("abort") ? "Timeout" : message,
      checkedAt: Date.now(),
    };
  }
}

export async function GET() {
  const results = await Promise.all(apps.map(checkApp));
  return NextResponse.json(results, {
    headers: { "Cache-Control": "no-store" },
  });
}
