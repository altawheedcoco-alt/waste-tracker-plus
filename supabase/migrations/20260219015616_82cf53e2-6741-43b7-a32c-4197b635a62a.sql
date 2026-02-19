
-- =====================================================
-- منصة عُمالنا (Omaluna) - Recruitment Platform
-- =====================================================

-- 1. ملف العامل (Worker Profile)
CREATE TABLE public.worker_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  national_id TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  city TEXT,
  governorate TEXT,
  address TEXT,
  photo_url TEXT,
  bio TEXT,
  
  -- Professional info
  job_title TEXT,
  years_of_experience INTEGER DEFAULT 0,
  education_level TEXT,
  skills TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  
  -- Work preferences
  preferred_work_type TEXT CHECK (preferred_work_type IN ('full_time', 'part_time', 'contract', 'daily', 'any')) DEFAULT 'any',
  preferred_salary_min NUMERIC,
  preferred_salary_max NUMERIC,
  willing_to_relocate BOOLEAN DEFAULT false,
  available_immediately BOOLEAN DEFAULT true,
  preferred_sectors TEXT[] DEFAULT '{}',
  preferred_locations TEXT[] DEFAULT '{}',
  
  -- Documents
  cv_url TEXT,
  documents JSONB DEFAULT '[]',
  
  -- Status & verification
  is_verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMPTZ,
  is_available BOOLEAN DEFAULT true,
  profile_completion INTEGER DEFAULT 0,
  
  -- Ratings
  avg_rating NUMERIC(3,2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  total_jobs_completed INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. إعلانات الوظائف (Job Listings)
CREATE TABLE public.job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  posted_by UUID REFERENCES auth.users(id),
  
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  responsibilities TEXT,
  
  -- Job details
  job_type TEXT CHECK (job_type IN ('full_time', 'part_time', 'contract', 'daily', 'temporary', 'internship')) NOT NULL,
  sector TEXT NOT NULL,
  category TEXT,
  experience_required INTEGER DEFAULT 0,
  education_required TEXT,
  skills_required TEXT[] DEFAULT '{}',
  certifications_required TEXT[] DEFAULT '{}',
  
  -- Location
  city TEXT,
  governorate TEXT,
  location_details TEXT,
  is_remote BOOLEAN DEFAULT false,
  
  -- Compensation
  salary_min NUMERIC,
  salary_max NUMERIC,
  salary_period TEXT CHECK (salary_period IN ('hourly', 'daily', 'weekly', 'monthly', 'yearly', 'negotiable')) DEFAULT 'monthly',
  benefits TEXT[] DEFAULT '{}',
  
  -- Vacancies
  vacancies_count INTEGER DEFAULT 1,
  applications_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  
  -- Status
  status TEXT CHECK (status IN ('draft', 'active', 'paused', 'closed', 'expired', 'filled')) DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT false,
  is_urgent BOOLEAN DEFAULT false,
  
  -- Dates
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. التقديم على الوظائف (Job Applications)
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.job_listings(id) ON DELETE CASCADE NOT NULL,
  worker_id UUID REFERENCES public.worker_profiles(id) ON DELETE CASCADE NOT NULL,
  
  cover_letter TEXT,
  resume_url TEXT,
  
  status TEXT CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'interview', 'accepted', 'rejected', 'withdrawn')) DEFAULT 'pending',
  
  -- Organization review
  reviewer_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  
  -- Interview
  interview_date TIMESTAMPTZ,
  interview_notes TEXT,
  
  -- Match score (AI)
  match_score NUMERIC(5,2),
  match_reasons JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(job_id, worker_id)
);

-- 4. التقييمات والتوصيات (Ratings & Reviews)
CREATE TABLE public.worker_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES public.worker_profiles(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  rated_by UUID REFERENCES auth.users(id) NOT NULL,
  job_id UUID REFERENCES public.job_listings(id),
  
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5) NOT NULL,
  punctuality_rating INTEGER CHECK (punctuality_rating BETWEEN 1 AND 5),
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  teamwork_rating INTEGER CHECK (teamwork_rating BETWEEN 1 AND 5),
  communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
  
  review_text TEXT,
  is_recommendation BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. الوسطاء / مكاتب التوظيف (Recruitment Agencies)
CREATE TABLE public.recruitment_agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  
  agency_name TEXT NOT NULL,
  license_number TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  city TEXT,
  governorate TEXT,
  description TEXT,
  logo_url TEXT,
  
  specializations TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  total_placements INTEGER DEFAULT 0,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. مرشحو الوسيط (Agency Candidates) 
CREATE TABLE public.agency_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.recruitment_agencies(id) ON DELETE CASCADE NOT NULL,
  worker_id UUID REFERENCES public.worker_profiles(id) ON DELETE CASCADE NOT NULL,
  
  status TEXT CHECK (status IN ('active', 'placed', 'inactive')) DEFAULT 'active',
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agency_id, worker_id)
);

-- 7. العمال المحفوظون / المفضلون
CREATE TABLE public.saved_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  worker_id UUID REFERENCES public.worker_profiles(id) ON DELETE CASCADE NOT NULL,
  saved_by UUID REFERENCES auth.users(id) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, worker_id)
);

-- 8. الوظائف المحفوظة للعامل
CREATE TABLE public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES public.worker_profiles(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES public.job_listings(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(worker_id, job_id)
);

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX idx_worker_profiles_user_id ON public.worker_profiles(user_id);
CREATE INDEX idx_worker_profiles_city ON public.worker_profiles(city);
CREATE INDEX idx_worker_profiles_skills ON public.worker_profiles USING GIN(skills);
CREATE INDEX idx_worker_profiles_available ON public.worker_profiles(is_available) WHERE is_available = true;

CREATE INDEX idx_job_listings_org ON public.job_listings(organization_id);
CREATE INDEX idx_job_listings_status ON public.job_listings(status);
CREATE INDEX idx_job_listings_sector ON public.job_listings(sector);
CREATE INDEX idx_job_listings_city ON public.job_listings(city);
CREATE INDEX idx_job_listings_skills ON public.job_listings USING GIN(skills_required);

CREATE INDEX idx_job_applications_job ON public.job_applications(job_id);
CREATE INDEX idx_job_applications_worker ON public.job_applications(worker_id);
CREATE INDEX idx_job_applications_status ON public.job_applications(status);

CREATE INDEX idx_worker_ratings_worker ON public.worker_ratings(worker_id);

-- =====================================================
-- RLS Policies
-- =====================================================

-- Worker Profiles
ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can manage own profile"
ON public.worker_profiles FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view available workers"
ON public.worker_profiles FOR SELECT
TO authenticated
USING (is_available = true);

-- Job Listings
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage jobs"
ON public.job_listings FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view active jobs"
ON public.job_listings FOR SELECT
TO authenticated
USING (status = 'active');

-- Job Applications
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can manage own applications"
ON public.job_applications FOR ALL
TO authenticated
USING (
  worker_id IN (
    SELECT id FROM public.worker_profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  worker_id IN (
    SELECT id FROM public.worker_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Orgs can view applications to their jobs"
ON public.job_applications FOR SELECT
TO authenticated
USING (
  job_id IN (
    SELECT id FROM public.job_listings WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Orgs can update applications to their jobs"
ON public.job_applications FOR UPDATE
TO authenticated
USING (
  job_id IN (
    SELECT id FROM public.job_listings WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

-- Worker Ratings
ALTER TABLE public.worker_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ratings"
ON public.worker_ratings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Org members can create ratings"
ON public.worker_ratings FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Recruitment Agencies
ALTER TABLE public.recruitment_agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active agencies"
ON public.recruitment_agencies FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Agency owners can manage"
ON public.recruitment_agencies FOR ALL
TO authenticated
USING (user_id = auth.uid() OR organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
))
WITH CHECK (user_id = auth.uid() OR organization_id IN (
  SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
));

-- Agency Candidates
ALTER TABLE public.agency_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency owners can manage candidates"
ON public.agency_candidates FOR ALL
TO authenticated
USING (
  agency_id IN (
    SELECT id FROM public.recruitment_agencies WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  agency_id IN (
    SELECT id FROM public.recruitment_agencies WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Workers can view own agency links"
ON public.agency_candidates FOR SELECT
TO authenticated
USING (
  worker_id IN (
    SELECT id FROM public.worker_profiles WHERE user_id = auth.uid()
  )
);

-- Saved Workers
ALTER TABLE public.saved_workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can manage saved workers"
ON public.saved_workers FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Saved Jobs
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can manage saved jobs"
ON public.saved_jobs FOR ALL
TO authenticated
USING (
  worker_id IN (
    SELECT id FROM public.worker_profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  worker_id IN (
    SELECT id FROM public.worker_profiles WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- Triggers
-- =====================================================

-- Update timestamps
CREATE TRIGGER update_worker_profiles_updated_at
BEFORE UPDATE ON public.worker_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_listings_updated_at
BEFORE UPDATE ON public.job_listings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
BEFORE UPDATE ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recruitment_agencies_updated_at
BEFORE UPDATE ON public.recruitment_agencies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update worker avg rating
CREATE OR REPLACE FUNCTION public.update_worker_avg_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.worker_profiles
  SET 
    avg_rating = (SELECT COALESCE(AVG(overall_rating), 0) FROM public.worker_ratings WHERE worker_id = NEW.worker_id),
    total_ratings = (SELECT COUNT(*) FROM public.worker_ratings WHERE worker_id = NEW.worker_id)
  WHERE id = NEW.worker_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_worker_rating_on_new_review
AFTER INSERT ON public.worker_ratings
FOR EACH ROW EXECUTE FUNCTION public.update_worker_avg_rating();

-- Auto-update applications count
CREATE OR REPLACE FUNCTION public.update_job_applications_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.job_listings SET applications_count = applications_count + 1 WHERE id = NEW.job_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.job_listings SET applications_count = applications_count - 1 WHERE id = OLD.job_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_applications_count
AFTER INSERT OR DELETE ON public.job_applications
FOR EACH ROW EXECUTE FUNCTION public.update_job_applications_count();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_applications;
