-- Add onboarding fields to existing profiles table (reusing instead of creating user_profiles)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS financial_year text,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Add financial_year to existing documents table so we can scope per-FY uploads
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS financial_year text;

-- Index to quickly find a user's docs for the current FY
CREATE INDEX IF NOT EXISTS idx_documents_owner_fy
  ON public.documents (owner_user_id, financial_year);

-- Index to quickly find latest report per user
CREATE INDEX IF NOT EXISTS idx_reports_owner_created
  ON public.reports (owner_user_id, created_at DESC);