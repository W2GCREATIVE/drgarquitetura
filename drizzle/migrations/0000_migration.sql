CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  moment text,
  privacy_version text NOT NULL,
  project jsonb NOT NULL,
  estimate jsonb NOT NULL,
  source jsonb NOT NULL DEFAULT '{}'::jsonb
);
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.funnel_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL
);
GRANT ALL ON public.funnel_events TO service_role;
ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;