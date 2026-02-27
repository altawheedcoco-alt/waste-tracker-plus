
-- Create testimonials table
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_name TEXT NOT NULL,
  comment TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public form)
CREATE POLICY "Anyone can submit testimonials"
ON public.testimonials
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Anyone can read approved testimonials
CREATE POLICY "Anyone can read approved testimonials"
ON public.testimonials
FOR SELECT
TO anon, authenticated
USING (status = 'approved');

-- Admin can read all
CREATE POLICY "Admin can read all testimonials"
ON public.testimonials
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);

-- Admin can update
CREATE POLICY "Admin can update testimonials"
ON public.testimonials
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can delete
CREATE POLICY "Admin can delete testimonials"
ON public.testimonials
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
