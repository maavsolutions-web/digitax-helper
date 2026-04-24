-- Explicit deny: cron_errors is service-role only.
CREATE POLICY "No user access to cron_errors"
  ON public.cron_errors FOR SELECT
  USING (false);