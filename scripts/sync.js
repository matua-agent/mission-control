#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const https = require("https");

const CONVEX_SITE = "https://tacit-mole-211.convex.site";
const WORKSPACE = "/home/ubuntu/clawd";
const OPENCLAW_DIR = process.env.HOME + "/.openclaw";

function post(endpoint, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, CONVEX_SITE);
    const postData = JSON.stringify(data);
    
    const req = https.request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    }, (res) => {
      let body = "";
      res.on("data", (chunk) => body += chunk);
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve({ raw: body });
        }
      });
    });
    
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

async function syncCronJobs() {
  console.log("=== Syncing Cron Jobs ===");
  
  const jobsFile = path.join(OPENCLAW_DIR, "cron/jobs.json");
  if (!fs.existsSync(jobsFile)) {
    console.log("No jobs.json found");
    return;
  }

  const jobsData = JSON.parse(fs.readFileSync(jobsFile, "utf-8"));
  const jobs = [];

  const jobList = jobsData.jobs || jobsData;
  for (const job of jobList) {
    if (!job.enabled) continue;

    let schedule = "unknown";
    let timezone = undefined;
    
    if (job.schedule?.kind === "cron") {
      schedule = `Cron: ${job.schedule.expr}`;
      timezone = job.schedule.tz;
    } else if (job.schedule?.kind === "every") {
      const mins = Math.round((job.schedule.everyMs || 0) / 60000);
      schedule = `Every ${mins} minutes`;
    } else if (job.schedule?.kind === "at") {
      schedule = "One-time";
    }

    const description = (job.payload?.message || job.payload?.text || "No description").slice(0, 500);

    jobs.push({
      jobId: job.id,
      name: job.name || "Unnamed Job",
      enabled: true,
      schedule,
      timezone,
      nextRunAt: job.state?.nextRunAtMs || Date.now(),
      lastRunAt: job.state?.lastRunAtMs || undefined,
      description,
    });
  }

  console.log(`Syncing ${jobs.length} cron jobs...`);
  const result = await post("/sync/cron", { jobs });
  console.log("Result:", result);
}

async function syncSearchIndex() {
  console.log("\n=== Syncing Search Index ===");
  
  const documents = [];

  // Index memory files
  const memoryDir = path.join(WORKSPACE, "memory");
  if (fs.existsSync(memoryDir)) {
    for (const file of fs.readdirSync(memoryDir)) {
      if (!file.endsWith(".md")) continue;
      const filePath = path.join(memoryDir, file);
      const content = fs.readFileSync(filePath, "utf-8").slice(0, 10000);
      documents.push({
        path: `memory/${file}`,
        type: "memory",
        title: file,
        content,
        snippet: content.slice(0, 300) + "...",
      });
    }
  }

  // Index MEMORY.md
  const mainMemory = path.join(WORKSPACE, "MEMORY.md");
  if (fs.existsSync(mainMemory)) {
    const content = fs.readFileSync(mainMemory, "utf-8").slice(0, 10000);
    documents.push({
      path: "MEMORY.md",
      type: "memory",
      title: "MEMORY.md",
      content,
      snippet: content.slice(0, 300) + "...",
    });
  }

  // Index workspace root .md files
  for (const file of fs.readdirSync(WORKSPACE)) {
    if (!file.endsWith(".md")) continue;
    if (file === "MEMORY.md") continue;
    const filePath = path.join(WORKSPACE, file);
    if (!fs.statSync(filePath).isFile()) continue;
    const content = fs.readFileSync(filePath, "utf-8").slice(0, 10000);
    documents.push({
      path: file,
      type: "document",
      title: file,
      content,
      snippet: content.slice(0, 300) + "...",
    });
  }

  // Index project README files and docs
  const projectDirs = fs.readdirSync(WORKSPACE).filter((d) => {
    const p = path.join(WORKSPACE, d);
    return fs.statSync(p).isDirectory() && !d.startsWith(".") && d !== "node_modules";
  });

  for (const dir of projectDirs) {
    const readmePath = path.join(WORKSPACE, dir, "README.md");
    if (fs.existsSync(readmePath)) {
      const content = fs.readFileSync(readmePath, "utf-8").slice(0, 10000);
      documents.push({
        path: `${dir}/README.md`,
        type: "document",
        title: `${dir}/README.md`,
        content,
        snippet: content.slice(0, 300) + "...",
      });
    }

    // Check for docs folder
    const docsDir = path.join(WORKSPACE, dir, "docs");
    if (fs.existsSync(docsDir) && fs.statSync(docsDir).isDirectory()) {
      for (const doc of fs.readdirSync(docsDir)) {
        if (!doc.endsWith(".md")) continue;
        const docPath = path.join(docsDir, doc);
        const content = fs.readFileSync(docPath, "utf-8").slice(0, 10000);
        documents.push({
          path: `${dir}/docs/${doc}`,
          type: "document",
          title: doc,
          content,
          snippet: content.slice(0, 300) + "...",
        });
      }
    }
  }

  console.log(`Syncing ${documents.length} documents...`);
  const result = await post("/sync/search", { documents });
  console.log("Result:", result);
}

async function main() {
  try {
    await syncCronJobs();
    await syncSearchIndex();
    console.log("\n=== Sync Complete ===");
  } catch (err) {
    console.error("Sync failed:", err);
    process.exit(1);
  }
}

main();
