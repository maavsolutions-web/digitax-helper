-- Storage bucket for tax documents (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('tax-docs', 'tax-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Path convention: {owner_user_id}/{client_id}/{doc_type}-{timestamp}-{filename}
-- Owners can manage their own files
CREATE POLICY "Users upload own tax docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tax-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users read own tax docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'tax-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users update own tax docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tax-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users delete own tax docs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tax-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- CAs can read tax docs of their assigned clients (folder structure: {owner}/{client_id}/...)
CREATE POLICY "CAs read assigned client tax docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'tax-docs'
  AND has_role(auth.uid(), 'ca'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.ca_id = auth.uid()
      AND c.id::text = (storage.foldername(name))[2]
  )
);

-- Report status enum
DO $$ BEGIN
  CREATE TYPE public.report_status AS ENUM ('draft', 'final', 'failed', 'processing');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Extend reports table
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS status public.report_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS parsed_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS filing_year text,
  ADD COLUMN IF NOT EXISTS ca_approved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Allow CAs to insert/update reports for their assigned clients
CREATE POLICY "CAs insert reports for assigned clients"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'ca'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = client_id AND c.ca_id = auth.uid()
  )
);

CREATE POLICY "CAs update reports for assigned clients"
ON public.reports FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'ca'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = reports.client_id AND c.ca_id = auth.uid()
  )
);

-- Users can update their own reports (so they can edit/regenerate before CA review)
CREATE POLICY "Users update own reports"
ON public.reports FOR UPDATE
TO authenticated
USING (auth.uid() = owner_user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS reports_touch_updated_at ON public.reports;
CREATE TRIGGER reports_touch_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();