"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type SearchRecord = {
  id: string;
  type: "memory" | "document" | "conversation";
  title: string;
  content: string;
};

const typeLabels: Record<SearchRecord["type"], string> = {
  memory: "Memory Files",
  document: "Documents",
  conversation: "Past Conversations",
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
    if (!debouncedQuery) {
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
            Search across memory files, documents, and past conversations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search logs, memory, and transcripts..."
          />
          {loading && (
            <div className="rounded-3xl border border-dashed border-slate-800 p-6 text-sm text-slate-400">
              Searching...
            </div>
          )}
          {!loading && debouncedQuery && results.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-800 p-6 text-sm text-slate-400">
              No results for "{debouncedQuery}".
            </div>
          )}
          {!loading && results.length > 0 && (
            <div className="space-y-6">
              {Object.entries(grouped).map(([type, items]) => (
                <div key={type} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-100">
                      {typeLabels[type as SearchRecord["type"]]}
                    </h3>
                    <Badge className="bg-slate-800 text-slate-200">
                      {items.length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-3xl border border-slate-800 bg-slate-950/60 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-100">
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-400">
                              {item.content.slice(0, 90)}...
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
                          <p className="mt-3 text-sm text-slate-300">
                            {item.content}
                          </p>
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
