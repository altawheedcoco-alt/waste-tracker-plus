
-- Templates table
CREATE TABLE public.push_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  type text DEFAULT 'general',
  priority text DEFAULT 'normal',
  url text,
  icon text,
  created_by uuid,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.push_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage templates"
  ON public.push_templates FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Campaign recipients tracking
CREATE TABLE public.push_campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.push_campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text DEFAULT 'pending',
  error_message text,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.push_campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage campaign recipients"
  ON public.push_campaign_recipients FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Add scheduling columns to push_campaigns
ALTER TABLE public.push_campaigns ADD COLUMN IF NOT EXISTS status text DEFAULT 'sent';
ALTER TABLE public.push_campaigns ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
ALTER TABLE public.push_campaigns ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.push_templates(id);
