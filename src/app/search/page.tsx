"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type SearchResult = {
  _id: string;
  path: string;
  type: string;
  title: string;
  content: string;
  snippet: string;
};

const typeLabels: Record<string, string> = {
  memory: "Memory Files",
  document: "Documents",
  task: "Tasks",
  conversation: "Conversations",
};

const typeColors: Record<string, string> = {
  memory: "bg-purple-500/20 text-purple-200",
  document: "bg-blue-500/20 text-blue-200",
  task: "bg-amber-500/20 text-amber-200",
  conversation: "bg-emerald-500/20 text-emerald-200",
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Only search when query is 2+ chars
  const searchQuery = query.length >= 2 ? query : "";
  const results = useQuery(
    api.searchIndex.search,
    searchQuery ? { query: searchQuery } : "skip"
  );

  const isLoading = searchQuery && results === undefined;

  const grouped = useMemo(() => {
    if (!results) return {};
    return results.reduce<Record<string, SearchResult[]>>((acc, record) => {
      acc[record.type] = acc[record.type] ?? [];
      acc[record.type].push(record);
      return acc;
    }, {});
  }, [results]);

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Global Search</CardTitle>
          <CardDescription>
            Search across memory files, documents, and conversations in the workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for anything... (min 2 characters)"
          />

          {isLoading && (
            <div className="rounded-3xl border border-dashed border-slate-800 p-6 text-sm text-slate-400">
              Searching...
            </div>
          )}

          {!isLoading && searchQuery && results?.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-800 p-6 text-sm text-slate-400">
              No results for &quot;{searchQuery}&quot;. Try syncing the search index from VPS.
            </div>
          )}

          {!isLoading && results && results.length > 0 && (
            <div className="space-y-6">
              <div className="text-sm text-slate-400">
                Found {results.length} results for &quot;{searchQuery}&quot;
              </div>
              {Object.entries(grouped).map(([type, items]) => (
                <div key={type} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-100">
                      {typeLabels[type] || type}
                    </h3>
                    <Badge className={typeColors[type] || "bg-slate-800 text-slate-200"}>
                      {items.length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item._id}
                        className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-100 truncate">
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-500 font-mono truncate">
                              {item.path}
                            </p>
                            <p className="mt-2 text-sm text-slate-300">
                              {item.snippet}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleExpanded(item._id)}
                          >
                            {expanded[item._id] ? "Collapse" : "Expand"}
                          </Button>
                        </div>
                        {expanded[item._id] && (
                          <pre className="mt-4 p-4 rounded-2xl bg-slate-900 text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
                            {item.content}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!searchQuery && (
            <div className="rounded-3xl border border-dashed border-slate-800 p-6 text-sm text-slate-400">
              Enter a search term to find content across your workspace.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
