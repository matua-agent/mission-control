"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type SearchRecord = {
  id: string;
  type: "memory" | "document" | "task" | "conversation";
  title: string;
  content: string;
  path: string;
  snippet: string;
};

const typeLabels: Record<SearchRecord["type"], string> = {
  memory: "Memory Files",
  document: "Documents",
  task: "Tasks",
  conversation: "Conversations",
};

const typeColors: Record<SearchRecord["type"], string> = {
  memory: "bg-purple-500/20 text-purple-200",
  document: "bg-blue-500/20 text-blue-200",
  task: "bg-amber-500/20 text-amber-200",
  conversation: "bg-emerald-500/20 text-emerald-200",
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<SearchRecord[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    let active = true;
    setLoading(true);

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((response) => response.json())
      .then((data: SearchRecord[]) => {
        if (active) {
          setResults(data);
        }
      })
      .catch(() => {
        if (active) {
          setResults([]);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  const grouped = useMemo(() => {
    return results.reduce<Record<string, SearchRecord[]>>((acc, record) => {
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
            Search across memory files, documents, tasks, and past conversations in the workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for anything... (min 2 characters)"
          />
          {loading && (
            <div className="rounded-3xl border border-dashed border-slate-800 p-6 text-sm text-slate-400">
              Searching workspace...
            </div>
          )}
          {!loading && debouncedQuery.length >= 2 && results.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-800 p-6 text-sm text-slate-400">
              No results for &quot;{debouncedQuery}&quot;.
            </div>
          )}
          {!loading && results.length > 0 && (
            <div className="space-y-6">
              <div className="text-sm text-slate-400">
                Found {results.length} results for &quot;{debouncedQuery}&quot;
              </div>
              {Object.entries(grouped).map(([type, items]) => (
                <div key={type} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-100">
                      {typeLabels[type as SearchRecord["type"]]}
                    </h3>
                    <Badge className={typeColors[type as SearchRecord["type"]]}>
                      {items.length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
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
                            onClick={() => toggleExpanded(item.id)}
                          >
                            {expanded[item.id] ? "Collapse" : "Expand"}
                          </Button>
                        </div>
                        {expanded[item.id] && (
                          <pre className="mt-4 p-4 rounded-2xl bg-slate-900 text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">
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
        </CardContent>
      </Card>
    </div>
  );
}
