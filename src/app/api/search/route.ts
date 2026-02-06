import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

type SearchResult = {
  id: string;
  type: "memory" | "document" | "task" | "conversation";
  title: string;
  content: string;
  path: string;
  snippet: string;
};

const WORKSPACE = process.env.WORKSPACE || "/home/ubuntu/clawd";

function searchInFile(filePath: string, query: string, type: SearchResult["type"]): SearchResult | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    
    if (!lowerContent.includes(lowerQuery)) {
      return null;
    }

    // Find the snippet around the match
    const matchIndex = lowerContent.indexOf(lowerQuery);
    const start = Math.max(0, matchIndex - 100);
    const end = Math.min(content.length, matchIndex + query.length + 100);
    let snippet = content.slice(start, end).trim();
    if (start > 0) snippet = "..." + snippet;
    if (end < content.length) snippet = snippet + "...";

    const fileName = path.basename(filePath);
    const relativePath = filePath.replace(WORKSPACE + "/", "");

    return {
      id: filePath,
      type,
      title: fileName,
      content: content.slice(0, 500),
      path: relativePath,
      snippet,
    };
  } catch {
    return null;
  }
}

function walkDir(dir: string, extensions: string[]): string[] {
  const results: string[] = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      // Skip node_modules and hidden dirs (except .openclaw)
      if (item === "node_modules" || item === ".git" || item === ".next") continue;
      
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        results.push(...walkDir(fullPath, extensions));
      } else if (extensions.some(ext => item.endsWith(ext))) {
        results.push(fullPath);
      }
    }
  } catch {
    // Skip directories we can't read
  }
  
  return results;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  const results: SearchResult[] = [];

  // Search memory files
  const memoryDir = path.join(WORKSPACE, "memory");
  if (fs.existsSync(memoryDir)) {
    const memoryFiles = fs.readdirSync(memoryDir).filter(f => f.endsWith(".md"));
    for (const file of memoryFiles) {
      const result = searchInFile(path.join(memoryDir, file), query, "memory");
      if (result) results.push(result);
    }
  }

  // Search MEMORY.md
  const mainMemory = path.join(WORKSPACE, "MEMORY.md");
  if (fs.existsSync(mainMemory)) {
    const result = searchInFile(mainMemory, query, "memory");
    if (result) results.push(result);
  }

  // Search document files (md, txt in workspace root and subdirs)
  const docFiles = walkDir(WORKSPACE, [".md", ".txt"]);
  for (const file of docFiles.slice(0, 100)) { // Limit to prevent timeout
    if (file.includes("/memory/")) continue; // Already searched
    if (file.endsWith("MEMORY.md")) continue;
    const result = searchInFile(file, query, "document");
    if (result) results.push(result);
  }

  // Search session transcripts for conversations
  const sessionsDir = path.join(process.env.HOME || "/home/ubuntu", ".openclaw/agents/main/sessions");
  if (fs.existsSync(sessionsDir)) {
    const sessionFiles = fs.readdirSync(sessionsDir).filter(f => f.endsWith(".jsonl")).slice(0, 20);
    for (const file of sessionFiles) {
      try {
        const content = fs.readFileSync(path.join(sessionsDir, file), "utf-8");
        if (content.toLowerCase().includes(query.toLowerCase())) {
          // Extract a snippet from the jsonl
          const lines = content.split("\n").filter(l => l.trim());
          let snippet = "";
          for (const line of lines) {
            if (line.toLowerCase().includes(query.toLowerCase())) {
              try {
                const parsed = JSON.parse(line);
                if (parsed.content) {
                  snippet = typeof parsed.content === "string" 
                    ? parsed.content.slice(0, 200) 
                    : JSON.stringify(parsed.content).slice(0, 200);
                  break;
                }
              } catch {
                snippet = line.slice(0, 200);
                break;
              }
            }
          }
          
          results.push({
            id: file,
            type: "conversation",
            title: `Session: ${file.replace(".jsonl", "").slice(0, 8)}...`,
            content: snippet,
            path: `sessions/${file}`,
            snippet: snippet + "...",
          });
        }
      } catch {
        // Skip unreadable files
      }
    }
  }

  // Sort by relevance (exact title match first, then by type)
  results.sort((a, b) => {
    const aExact = a.title.toLowerCase().includes(query.toLowerCase()) ? 0 : 1;
    const bExact = b.title.toLowerCase().includes(query.toLowerCase()) ? 0 : 1;
    if (aExact !== bExact) return aExact - bExact;
    
    const typeOrder = { memory: 0, task: 1, document: 2, conversation: 3 };
    return typeOrder[a.type] - typeOrder[b.type];
  });

  return NextResponse.json(results.slice(0, 50)); // Limit results
}
