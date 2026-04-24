-- Add refresh tracking to reports
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS last_refreshed_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_refresh_due date;

-- Snapshot table: one frozen report per client per month
CREATE TABLE IF NOT EXISTS public.report_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  ca_id uuid NOT NULL,
  snapshot_month text NOT NULL, -- "YYYY-MM"
  report_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  health_score integer,
  is_stale boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, snapshot_month)
);

CREATE INDEX IF NOT EXISTS idx_report_snapshots_client ON public.report_snapshots(client_id, snapshot_month DESC);
CREATE INDEX IF NOT EXISTS idx_report_snapshots_ca ON public.report_snapshots(ca_id);

ALTER TABLE public.report_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CAs view own client snapshots"
  ON public.report_snapshots FOR SELECT
  USING (auth.uid() = ca_id);

CREATE POLICY "CAs insert own client snapshots"
  ON public.report_snapshots FOR INSERT
  WITH CHECK (auth.uid() = ca_id);

-- Cron error log
CREATE TABLE IF NOT EXISTS public.cron_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  client_id uuid,
  error_message text NOT NULL,
  retry_after timestamptz,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cron_errors_unresolved ON public.cron_errors(resolved, retry_after);

ALTER TABLE public.cron_errors ENABLE ROW LEVEL SECURITY;
-- No policies: only service role (edge fn) reads/writes this.

-- Enable cron + http extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;