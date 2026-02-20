import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const revalidate = 3600; // 1 hour

const TRACKED_REPOS = [
  // Harrison's repos
  { owner: "harry-supermix", repo: "workout-app", label: "beef (workout-app)" },
  { owner: "harry-supermix", repo: "snow-forecast", label: "Snow Forecast" },
  { owner: "harry-supermix", repo: "real-estate-app", label: "NZ Real Estate Explorer" },
  { owner: "harry-supermix", repo: "finance-app", label: "FinanceFlow" },
  { owner: "harry-supermix", repo: "durability-app", label: "Durability Analyzer" },
  { owner: "harry-supermix", repo: "nz-adventure-planner", label: "NZ Adventure Planner" },
  { owner: "harry-supermix", repo: "personal-page", label: "Personal Page" },
  { owner: "harry-supermix", repo: "code-explainer", label: "Code Explainer" },
  { owner: "harry-supermix", repo: "project-training-load", label: "TrainingLoad" },
  // Matua's repos
  { owner: "matua-agent", repo: "job-tracker", label: "JobTracker" },
  { owner: "matua-agent", repo: "rep-sensor", label: "Rep Sensor" },
  { owner: "matua-agent", repo: "collab-whiteboard", label: "Collab Whiteboard" },
  { owner: "matua-agent", repo: "interview-prep", label: "Interview Prep AI" },
];

interface RepoData {
  owner: string;
  repo: string;
  label: string;
  lastCommitDate: string | null;
  lastCommitMsg: string | null;
  defaultBranch: string;
  commitsThisWeek: number;
  openIssues: number;
  stars: number;
  error?: boolean;
}

async function fetchRepoData(
  owner: string,
  repo: string,
  label: string
): Promise<RepoData> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "mission-control-vps",
  };

  try {
    const [repoRes, commitsRes, lastCommitRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers,
        next: { revalidate: 3600 },
      }),
      fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?since=${since}&per_page=100`,
        { headers, next: { revalidate: 3600 } }
      ),
      fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`,
        { headers, next: { revalidate: 3600 } }
      ),
    ]);

    const [repoInfo, recentCommits, latestCommits] = await Promise.all([
      repoRes.ok ? repoRes.json() : null,
      commitsRes.ok ? commitsRes.json() : [],
      lastCommitRes.ok ? lastCommitRes.json() : [],
    ]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const latest = Array.isArray(latestCommits) ? latestCommits[0] as any : null;

    return {
      owner,
      repo,
      label,
      lastCommitDate: latest?.commit?.author?.date ?? null,
      lastCommitMsg: latest?.commit?.message?.split("\n")[0] ?? null,
      defaultBranch: repoInfo?.default_branch ?? "main",
      commitsThisWeek: Array.isArray(recentCommits) ? recentCommits.length : 0,
      openIssues: repoInfo?.open_issues_count ?? 0,
      stars: repoInfo?.stargazers_count ?? 0,
    };
  } catch {
    return {
      owner,
      repo,
      label,
      lastCommitDate: null,
      lastCommitMsg: null,
      defaultBranch: "main",
      commitsThisWeek: 0,
      openIssues: 0,
      stars: 0,
      error: true,
    };
  }
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / (86400 * 7))}w ago`;
  return `${Math.floor(diff / (86400 * 30))}mo ago`;
}

function activityStatus(lastDate: string | null, weekCommits: number): "hot" | "active" | "warm" | "stale" {
  if (!lastDate) return "stale";
  const diff = Date.now() - new Date(lastDate).getTime();
  if (diff < 86400 * 2 * 1000 && weekCommits > 0) return "hot";
  if (diff < 86400 * 7 * 1000) return "active";
  if (diff < 86400 * 30 * 1000) return "warm";
  return "stale";
}

const STATUS_BADGE: Record<string, string> = {
  hot: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  active: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  warm: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  stale: "bg-slate-700/40 text-slate-400 border border-slate-600/30",
};

const STATUS_DOT: Record<string, string> = {
  hot: "bg-emerald-400 animate-pulse",
  active: "bg-blue-400",
  warm: "bg-amber-400",
  stale: "bg-slate-600",
};

async function RepoGrid() {
  const repos = await Promise.all(
    TRACKED_REPOS.map(({ owner, repo, label }) =>
      fetchRepoData(owner, repo, label)
    )
  );

  // Sort: hot first, then active, warm, stale; within same status by weekCommits
  const sorted = repos.sort((a, b) => {
    const order = { hot: 0, active: 1, warm: 2, stale: 3 };
    const statusA = activityStatus(a.lastCommitDate, a.commitsThisWeek);
    const statusB = activityStatus(b.lastCommitDate, b.commitsThisWeek);
    if (order[statusA] !== order[statusB]) return order[statusA] - order[statusB];
    return b.commitsThisWeek - a.commitsThisWeek;
  });

  const totalWeekCommits = repos.reduce((s, r) => s + r.commitsThisWeek, 0);
  const activeRepos = repos.filter(
    (r) => activityStatus(r.lastCommitDate, r.commitsThisWeek) !== "stale"
  ).length;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Repos Tracked", value: repos.length },
          { label: "Active (7d)", value: activeRepos },
          { label: "Commits This Week", value: totalWeekCommits },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
          >
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">{label}</p>
            <p className="text-2xl font-semibold text-slate-100">{value}</p>
          </div>
        ))}
      </div>

      {/* Repo cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sorted.map((r) => {
          const status = activityStatus(r.lastCommitDate, r.commitsThisWeek);
          return (
            <Card
              key={`${r.owner}/${r.repo}`}
              className="bg-slate-900/80 border-slate-800 hover:border-slate-600 transition-colors"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[status]}`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate">
                        {r.label}
                      </p>
                      <p className="text-[10px] font-mono text-slate-500">
                        {r.owner}/{r.repo}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_BADGE[status]}`}
                  >
                    {status}
                  </span>
                </div>

                {/* Last commit */}
                {r.lastCommitMsg && (
                  <p className="text-xs text-slate-400 truncate mb-2 italic">
                    &ldquo;{r.lastCommitMsg}&rdquo;
                  </p>
                )}

                {/* Stats row */}
                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                  {r.lastCommitDate && (
                    <span>{timeAgo(r.lastCommitDate)}</span>
                  )}
                  {r.commitsThisWeek > 0 && (
                    <span className="text-emerald-500">
                      +{r.commitsThisWeek} this week
                    </span>
                  )}
                  <span className="ml-auto">
                    <a
                      href={`https://github.com/${r.owner}/${r.repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-slate-300 transition-colors"
                    >
                      ↗ GitHub
                    </a>
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-slate-600 font-mono">
        Pulled from GitHub API · refreshes every hour
      </p>
    </div>
  );
}

export default function ReposPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-1">Repo Health</h2>
        <p className="text-sm text-slate-400">
          Activity across all tracked repositories.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="text-slate-500 text-sm py-8">Loading repo data…</div>
        }
      >
        <RepoGrid />
      </Suspense>
    </div>
  );
}
