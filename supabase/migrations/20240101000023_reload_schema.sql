-- Migration: Force Schema Reload
-- Description: Triggers PostgREST schema cache reload

-- Grant necessary permissions to anon role for accessing new tables
GRANT SELECT ON public.industries TO anon;
GRANT SELECT ON public.locations TO anon;
GRANT SELECT ON public.companies TO anon;
GRANT SELECT ON public.jobs TO anon;
GRANT ALL ON public.job_applications TO authenticated;
GRANT ALL ON public.saved_jobs TO authenticated;
GRANT ALL ON public.job_views TO anon, authenticated;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
