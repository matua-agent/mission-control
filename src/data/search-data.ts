export type SearchRecord = {
  id: string;
  type: "memory" | "document" | "conversation";
  title: string;
  content: string;
};

export const searchRecords: SearchRecord[] = [
  {
    id: "mem-1",
    type: "memory",
    title: "Launch Checklist",
    content:
      "Checklist includes telemetry validation, fuel gate checks, and crew readiness confirmation.",
  },
  {
    id: "mem-2",
    type: "memory",
    title: "Anomaly Protocol",
    content:
      "If signal divergence exceeds 2.5%, notify mission lead and trigger safe mode.",
  },
  {
    id: "doc-1",
    type: "document",
    title: "Quarterly Mission Brief",
    content:
      "Summary of system performance, open risks, and scheduled maintenance windows.",
  },
  {
    id: "doc-2",
    type: "document",
    title: "OpenClaw Integration Guide",
    content:
      "Cron jobs are synced every 30 minutes. Webhooks are queued on failure.",
  },
  {
    id: "conv-1",
    type: "conversation",
    title: "Ops Sync - Jan 18",
    content:
      "Discussed deployment freeze, agent retraining schedule, and escalation runbook updates.",
  },
  {
    id: "conv-2",
    type: "conversation",
    title: "Incident Review",
    content:
      "Reviewed stack trace and mitigation steps for the December incident.",
  },
];
