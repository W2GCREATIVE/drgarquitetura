GRANT SELECT ON public.leads, public.funnel_events TO authenticated;
GRANT ALL ON public.leads, public.funnel_events TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Administrators can read leads" ON public.leads FOR SELECT TO authenticated USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));
CREATE POLICY "Administrators can read funnel events" ON public.funnel_events FOR SELECT TO authenticated USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));