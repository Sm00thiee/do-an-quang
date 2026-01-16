-- Migration: Job Search System
-- Description: Creates tables for companies, jobs, applications, and saved jobs for Vietnamese job market

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Drop existing tables and indexes if they have incomplete schemas
DROP INDEX IF EXISTS public.idx_applications_status CASCADE;
DROP INDEX IF EXISTS public.idx_applications_job CASCADE;
DROP INDEX IF EXISTS public.idx_applications_candidate CASCADE;
DROP INDEX IF EXISTS public.idx_saved_jobs_candidate CASCADE;
DROP INDEX IF EXISTS public.idx_saved_jobs_job CASCADE;
DROP INDEX IF EXISTS public.idx_job_views_job CASCADE;
DROP INDEX IF EXISTS public.idx_job_views_candidate CASCADE;
DROP INDEX IF EXISTS public.idx_jobs_location CASCADE;
DROP INDEX IF EXISTS public.idx_jobs_company CASCADE;
DROP INDEX IF EXISTS public.idx_jobs_posted_date CASCADE;
DROP INDEX IF EXISTS public.idx_companies_industry CASCADE;
DROP INDEX IF EXISTS public.idx_companies_location CASCADE;

DROP TABLE IF EXISTS public.job_views CASCADE;
DROP TABLE IF EXISTS public.saved_jobs CASCADE;
DROP TABLE IF EXISTS public.job_applications CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;
DROP TABLE IF EXISTS public.industries CASCADE;

-- ============================================
-- 1. INDUSTRIES TABLE (Lĩnh vực)
-- ============================================
CREATE TABLE IF NOT EXISTS public.industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  name_vi VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. LOCATIONS TABLE (Địa điểm)
-- ============================================
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city VARCHAR(255) NOT NULL,
  district VARCHAR(255),
  full_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. COMPANIES TABLE (Doanh nghiệp)
-- ============================================
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(500) NOT NULL,
  short_name VARCHAR(255),
  logo_url TEXT,
  banner_url TEXT,
  description TEXT,
  website VARCHAR(500),
  email VARCHAR(255),
  phone VARCHAR(50),
  employee_count VARCHAR(50), -- "25 nhân viên", "100-500", etc.
  industry_id UUID REFERENCES public.industries(id) ON DELETE SET NULL,
  headquarters_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  founded_year INTEGER,
  tax_code VARCHAR(50),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns to companies table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'industry_id') THEN
    ALTER TABLE public.companies ADD COLUMN industry_id UUID REFERENCES public.industries(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'headquarters_location_id') THEN
    ALTER TABLE public.companies ADD COLUMN headquarters_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'verified') THEN
    ALTER TABLE public.companies ADD COLUMN verified BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'founded_year') THEN
    ALTER TABLE public.companies ADD COLUMN founded_year INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'tax_code') THEN
    ALTER TABLE public.companies ADD COLUMN tax_code VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'employee_count') THEN
    ALTER TABLE public.companies ADD COLUMN employee_count VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'logo_url') THEN
    ALTER TABLE public.companies ADD COLUMN logo_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'companies' AND column_name = 'banner_url') THEN
    ALTER TABLE public.companies ADD COLUMN banner_url TEXT;
  END IF;
END $$;

-- Index for company search
CREATE INDEX idx_companies_name ON public.companies USING gin(to_tsvector('simple', name));
CREATE INDEX idx_companies_industry ON public.companies(industry_id);
CREATE INDEX idx_companies_verified ON public.companies(verified);

-- ============================================
-- 4. JOBS TABLE (Việc làm)
-- ============================================
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE,
  description TEXT,
  requirements TEXT,
  benefits TEXT,
  responsibilities TEXT,
  
  -- Salary information
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency VARCHAR(10) DEFAULT 'VND',
  salary_display VARCHAR(100), -- "7-12 triệu", "Thỏa thuận", etc.
  
  -- Location and work details
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  work_type VARCHAR(50), -- "Full-time", "Part-time", "Contract", "Freelance"
  work_mode VARCHAR(50), -- "On-site", "Remote", "Hybrid"
  
  -- Job details
  experience_level VARCHAR(100), -- "Intern", "Junior", "Mid", "Senior", "Lead", "Manager"
  education_level VARCHAR(100), -- "High School", "Associate", "Bachelor", "Master", "PhD"
  positions_available INTEGER DEFAULT 1,
  
  -- Skills required (JSON array)
  required_skills JSONB DEFAULT '[]'::jsonb,
  preferred_skills JSONB DEFAULT '[]'::jsonb,
  
  -- Status and dates
  status VARCHAR(50) DEFAULT 'active', -- "active", "closed", "draft"
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- AI matching
  matching_keywords TEXT[],
  
  -- Metadata
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  created_by UUID, -- REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for job search
CREATE INDEX idx_jobs_company ON public.jobs(company_id);
CREATE INDEX idx_jobs_location ON public.jobs(location_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_published ON public.jobs(published_at);
CREATE INDEX idx_jobs_expires ON public.jobs(expires_at);
CREATE INDEX idx_jobs_title_search ON public.jobs USING gin(to_tsvector('simple', title));
CREATE INDEX idx_jobs_description_search ON public.jobs USING gin(to_tsvector('simple', description));
CREATE INDEX idx_jobs_skills ON public.jobs USING gin(required_skills);
CREATE INDEX idx_jobs_salary ON public.jobs(salary_min, salary_max);

-- ============================================
-- 5. JOB APPLICATIONS TABLE (Đơn ứng tuyển)
-- ============================================
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL, -- REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Application details
  status VARCHAR(50) DEFAULT 'pending', -- "pending", "reviewing", "interviewed", "offered", "rejected", "withdrawn"
  cover_letter TEXT,
  cv_url TEXT,
  resume_data JSONB, -- Structured resume data
  
  -- Matching score
  match_score DECIMAL(5,2), -- 0.00 to 100.00
  
  -- Timeline
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  interviewed_at TIMESTAMP WITH TIME ZONE,
  decision_at TIMESTAMP WITH TIME ZONE,
  
  -- Notes from recruiter
  recruiter_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one application per user per job
  CONSTRAINT unique_application_per_user_job UNIQUE (job_id, candidate_id)
);

-- Indexes for applications
CREATE INDEX idx_applications_job ON public.job_applications(job_id);
CREATE INDEX idx_applications_candidate ON public.job_applications(candidate_id);
CREATE INDEX idx_applications_status ON public.job_applications(status);
CREATE INDEX idx_applications_applied ON public.job_applications(applied_at);

-- ============================================
-- 6. SAVED JOBS TABLE (Việc làm đã lưu)
-- ============================================
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Optional notes
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one saved job per user
  CONSTRAINT unique_saved_job_per_user UNIQUE (job_id, user_id)
);

-- Indexes for saved jobs
CREATE INDEX idx_saved_jobs_user ON public.saved_jobs(user_id);
CREATE INDEX idx_saved_jobs_job ON public.saved_jobs(job_id);
CREATE INDEX idx_saved_jobs_created ON public.saved_jobs(created_at);

-- ============================================
-- 7. JOB VIEWS TABLE (Lịch sử xem việc làm)
-- ============================================
CREATE TABLE IF NOT EXISTS public.job_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID, -- REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Tracking info
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id VARCHAR(255),
  user_agent TEXT,
  ip_address INET
);

-- Indexes for job views
CREATE INDEX idx_job_views_job ON public.job_views(job_id);
CREATE INDEX idx_job_views_user ON public.job_views(user_id);
CREATE INDEX idx_job_views_viewed ON public.job_views(viewed_at);

-- ============================================
-- 8. FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update job applications count
CREATE OR REPLACE FUNCTION update_job_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.jobs 
    SET applications_count = applications_count + 1
    WHERE id = NEW.job_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.jobs 
    SET applications_count = GREATEST(0, applications_count - 1)
    WHERE id = OLD.job_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for applications count
DROP TRIGGER IF EXISTS trigger_update_applications_count ON public.job_applications;
CREATE TRIGGER trigger_update_applications_count
  AFTER INSERT OR DELETE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_job_applications_count();

-- Function to update job views count
CREATE OR REPLACE FUNCTION update_job_views_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.jobs 
  SET views_count = views_count + 1
  WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for views count
DROP TRIGGER IF EXISTS trigger_update_views_count ON public.job_views;
CREATE TRIGGER trigger_update_views_count
  AFTER INSERT ON public.job_views
  FOR EACH ROW
  EXECUTE FUNCTION update_job_views_count();

-- Function to auto-generate job slug
CREATE OR REPLACE FUNCTION generate_job_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    -- Generate base slug from title
    base_slug := lower(regexp_replace(
      unaccent(NEW.title), 
      '[^a-z0-9]+', 
      '-', 
      'g'
    ));
    base_slug := trim(both '-' from base_slug);
    
    -- Check for uniqueness and add counter if needed
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.jobs WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    
    NEW.slug := final_slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slug
DROP TRIGGER IF EXISTS trigger_generate_job_slug ON public.jobs;
CREATE TRIGGER trigger_generate_job_slug
  BEFORE INSERT OR UPDATE OF title ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION generate_job_slug();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_applications_updated_at ON public.job_applications;
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_industries_updated_at ON public.industries;
CREATE TRIGGER update_industries_updated_at
  BEFORE UPDATE ON public.industries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_locations_updated_at ON public.locations;
CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_views ENABLE ROW LEVEL SECURITY;

-- Industries: Public read
CREATE POLICY "Industries are viewable by everyone" ON public.industries
  FOR SELECT USING (true);

-- Locations: Public read
CREATE POLICY "Locations are viewable by everyone" ON public.locations
  FOR SELECT USING (true);

-- Companies: Public read, admin write
CREATE POLICY "Companies are viewable by everyone" ON public.companies
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create companies" ON public.companies
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own companies" ON public.companies
  FOR UPDATE USING (auth.uid() IN (
    SELECT created_by FROM public.jobs WHERE company_id = companies.id
  ));

-- Jobs: Public read active jobs
CREATE POLICY "Active jobs are viewable by everyone" ON public.jobs
  FOR SELECT USING (status = 'active' AND published_at <= NOW() AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Authenticated users can create jobs" ON public.jobs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own jobs" ON public.jobs
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own jobs" ON public.jobs
  FOR DELETE USING (auth.uid() = created_by);

-- Job Applications: Users can view/manage their own
CREATE POLICY "Users can view own applications" ON public.job_applications
  FOR SELECT USING (auth.uid() = candidate_id);

CREATE POLICY "Users can create own applications" ON public.job_applications
  FOR INSERT WITH CHECK (auth.uid() = candidate_id);

CREATE POLICY "Users can update own applications" ON public.job_applications
  FOR UPDATE USING (auth.uid() = candidate_id);

CREATE POLICY "Users can delete own applications" ON public.job_applications
  FOR DELETE USING (auth.uid() = candidate_id);

-- Saved Jobs: Users can view/manage their own
CREATE POLICY "Users can view own saved jobs" ON public.saved_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own saved jobs" ON public.saved_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved jobs" ON public.saved_jobs
  FOR DELETE USING (auth.uid() = user_id);

-- Job Views: Public insert, own read
CREATE POLICY "Anyone can create job views" ON public.job_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own job views" ON public.job_views
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- ============================================
-- 10. HELPER FUNCTIONS FOR JOB SEARCH
-- ============================================

-- Function to search jobs with filters
CREATE OR REPLACE FUNCTION search_jobs(
  search_query TEXT DEFAULT NULL,
  location_filter UUID DEFAULT NULL,
  salary_min_filter INTEGER DEFAULT NULL,
  salary_max_filter INTEGER DEFAULT NULL,
  company_filter UUID DEFAULT NULL,
  experience_filter VARCHAR DEFAULT NULL,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  company_name VARCHAR,
  company_logo_url TEXT,
  salary_display VARCHAR,
  location_city VARCHAR,
  match_score DECIMAL,
  published_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id,
    j.title,
    c.name as company_name,
    c.logo_url as company_logo_url,
    j.salary_display,
    l.city as location_city,
    90.0::DECIMAL as match_score, -- Placeholder, will be replaced with actual AI matching
    j.published_at
  FROM public.jobs j
  JOIN public.companies c ON j.company_id = c.id
  LEFT JOIN public.locations l ON j.location_id = l.id
  WHERE 
    j.status = 'active'
    AND j.published_at <= NOW()
    AND (j.expires_at IS NULL OR j.expires_at > NOW())
    AND (search_query IS NULL OR 
         to_tsvector('simple', j.title || ' ' || COALESCE(j.description, '')) @@ plainto_tsquery('simple', search_query))
    AND (location_filter IS NULL OR j.location_id = location_filter)
    AND (salary_min_filter IS NULL OR j.salary_min >= salary_min_filter)
    AND (salary_max_filter IS NULL OR j.salary_max <= salary_max_filter)
    AND (company_filter IS NULL OR j.company_id = company_filter)
    AND (experience_filter IS NULL OR j.experience_level = experience_filter)
  ORDER BY j.published_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.industries IS 'Lĩnh vực nghề nghiệp';
COMMENT ON TABLE public.locations IS 'Địa điểm làm việc';
COMMENT ON TABLE public.companies IS 'Doanh nghiệp/Công ty';
COMMENT ON TABLE public.jobs IS 'Tin tuyển dụng';
COMMENT ON TABLE public.job_applications IS 'Đơn ứng tuyển của ứng viên';
COMMENT ON TABLE public.saved_jobs IS 'Việc làm đã lưu của ứng viên';
COMMENT ON TABLE public.job_views IS 'Lịch sử xem tin tuyển dụng';
