export const STAGES = [
  { id: "docs_pending", label: "Docs pending", tone: "muted" },
  { id: "processing", label: "Processing", tone: "info" },
  { id: "ready_for_review", label: "Ready for review", tone: "warning" },
  { id: "awaiting_approval", label: "Awaiting approval", tone: "primary" },
  { id: "filed", label: "Filed", tone: "success" },
] as const;

export type StageId = (typeof STAGES)[number]["id"];

export const stageMeta = (id: StageId) => STAGES.find((s) => s.id === id)!;

export const RISK_TONE: Record<string, string> = {
  low: "bg-success-soft text-success",
  medium: "bg-warning-soft text-warning",
  high: "bg-danger-soft text-danger",
};
