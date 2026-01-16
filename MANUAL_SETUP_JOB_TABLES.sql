-- ============================================
-- MANUAL SETUP: Job Search Tables
-- Run this in Supabase SQL Editor to create all job search tables
-- ============================================

-- This combines migrations 20240101000021 and 20240101000022

-- Remove transaction to allow partial success
-- BEGIN;

-- ============================================
-- 1. INDUSTRIES TABLE
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
-- 2. LOCATIONS TABLE
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
-- 3. COMPANIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(500) NOT NULL,
  short_name VARCHAR(255) UNIQUE,
  logo_url TEXT,
  banner_url TEXT,
  description TEXT,
  website VARCHAR(500),
  email VARCHAR(255),
  phone VARCHAR(50),
  employee_count VARCHAR(50),
  industry_id UUID REFERENCES public.industries(id) ON DELETE SET NULL,
  headquarters_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  founded_year INTEGER,
  tax_code VARCHAR(50),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies USING gin(to_tsvector('simple', name));
CREATE INDEX IF NOT EXISTS idx_companies_industry ON public.companies(industry_id);
CREATE INDEX IF NOT EXISTS idx_companies_verified ON public.companies(verified);

-- ============================================
-- 4. JOBS TABLE
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
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency VARCHAR(10) DEFAULT 'VND',
  salary_display VARCHAR(100),
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  work_type VARCHAR(50),
  work_mode VARCHAR(50),
  experience_level VARCHAR(100),
  education_level VARCHAR(100),
  positions_available INTEGER DEFAULT 1,
  required_skills JSONB DEFAULT '[]'::jsonb,
  preferred_skills JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(50) DEFAULT 'active',
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  matching_keywords TEXT[],
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  created_by UUID, -- REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_company ON public.jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON public.jobs(location_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_published ON public.jobs(published_at);
CREATE INDEX IF NOT EXISTS idx_jobs_expires ON public.jobs(expires_at);
CREATE INDEX IF NOT EXISTS idx_jobs_title_search ON public.jobs USING gin(to_tsvector('simple', title));
CREATE INDEX IF NOT EXISTS idx_jobs_description_search ON public.jobs USING gin(to_tsvector('simple', description));
CREATE INDEX IF NOT EXISTS idx_jobs_skills ON public.jobs USING gin(required_skills);
CREATE INDEX IF NOT EXISTS idx_jobs_salary ON public.jobs(salary_min, salary_max);

-- ============================================
-- 5. JOB APPLICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL, -- REFERENCES public.users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  cover_letter TEXT,
  cv_url TEXT,
  resume_data JSONB,
  match_score DECIMAL(5,2),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  interviewed_at TIMESTAMP WITH TIME ZONE,
  decision_at TIMESTAMP WITH TIME ZONE,
  recruiter_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_application_per_user_job UNIQUE (job_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_job ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate ON public.job_applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.job_applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_applied ON public.job_applications(applied_at);

-- ============================================
-- 6. SAVED JOBS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- REFERENCES public.users(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_saved_job_per_user UNIQUE (job_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_user ON public.saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job ON public.saved_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_created ON public.saved_jobs(created_at);

-- ============================================
-- 7. JOB VIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.job_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID, -- REFERENCES public.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_id VARCHAR(255),
  user_agent TEXT,
  ip_address INET
);

CREATE INDEX IF NOT EXISTS idx_job_views_job ON public.job_views(job_id);
CREATE INDEX IF NOT EXISTS idx_job_views_user ON public.job_views(user_id);
CREATE INDEX IF NOT EXISTS idx_job_views_viewed ON public.job_views(viewed_at);

-- ============================================
-- 8. ENABLE RLS
-- ============================================
ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_views ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. RLS POLICIES
-- ============================================
DO $$ BEGIN
  -- Industries
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'industries' AND policyname = 'Industries are viewable by everyone') THEN
    CREATE POLICY "Industries are viewable by everyone" ON public.industries FOR SELECT USING (true);
  END IF;

  -- Locations
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'locations' AND policyname = 'Locations are viewable by everyone') THEN
    CREATE POLICY "Locations are viewable by everyone" ON public.locations FOR SELECT USING (true);
  END IF;

  -- Companies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'Companies are viewable by everyone') THEN
    CREATE POLICY "Companies are viewable by everyone" ON public.companies FOR SELECT USING (true);
  END IF;

  -- Jobs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'jobs' AND policyname = 'Active jobs are viewable by everyone') THEN
    CREATE POLICY "Active jobs are viewable by everyone" ON public.jobs
      FOR SELECT USING (status = 'active' AND published_at <= NOW() AND (expires_at IS NULL OR expires_at > NOW()));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'jobs' AND policyname = 'Authenticated users can create jobs') THEN
    CREATE POLICY "Authenticated users can create jobs" ON public.jobs
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;

  -- Job Views
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_views' AND policyname = 'Anyone can create job views') THEN
    CREATE POLICY "Anyone can create job views" ON public.job_views
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ============================================
-- 10. GRANT PERMISSIONS
-- ============================================
GRANT SELECT ON public.industries TO anon, authenticated;
GRANT SELECT ON public.locations TO anon, authenticated;
GRANT SELECT ON public.companies TO anon, authenticated;
GRANT SELECT ON public.jobs TO anon, authenticated;
GRANT ALL ON public.job_applications TO authenticated;
GRANT ALL ON public.saved_jobs TO authenticated;
GRANT INSERT ON public.job_views TO anon, authenticated;

-- ============================================
-- 11. INSERT SAMPLE DATA
-- ============================================

-- Insert Industries
INSERT INTO public.industries (name, name_vi, description) VALUES
  ('technology', 'Công nghệ thông tin', 'Phát triển phần mềm, IT, Digital'),
  ('finance', 'Tài chính', 'Ngân hàng, Bảo hiểm, Đầu tư'),
  ('marketing', 'Marketing', 'Marketing, Truyền thông, Quảng cáo'),
  ('design', 'Thiết kế', 'UI/UX, Đồ họa, Sáng tạo'),
  ('education', 'Giáo dục', 'Đào tạo, Giảng dạy')
ON CONFLICT (name) DO NOTHING;

-- Insert Locations
INSERT INTO public.locations (city, district, full_address) VALUES
  ('Hà Nội', 'Thanh Xuân', 'Thanh Xuân, Hà Nội'),
  ('Hà Nội', 'Cầu Giấy', 'Cầu Giấy, Hà Nội'),
  ('Hồ Chí Minh', 'Quận 1', 'Quận 1, Hồ Chí Minh'),
  ('Hồ Chí Minh', 'Quận 7', 'Quận 7, Hồ Chí Minh')
ON CONFLICT DO NOTHING;

-- Insert Sample Companies and Jobs (using a simplified version)
DO $$
DECLARE
  tech_id UUID;
  finance_id UUID;
  hanoi_id UUID;
  hcm_id UUID;
  company_id UUID;
BEGIN
  -- Get IDs
  SELECT id INTO tech_id FROM public.industries WHERE name = 'technology' LIMIT 1;
  SELECT id INTO finance_id FROM public.industries WHERE name = 'finance' LIMIT 1;
  SELECT id INTO hanoi_id FROM public.locations WHERE city = 'Hà Nội' LIMIT 1;
  SELECT id INTO hcm_id FROM public.locations WHERE city = 'Hồ Chí Minh' LIMIT 1;

  -- Only insert if IDs were found
  IF tech_id IS NOT NULL AND hanoi_id IS NOT NULL THEN
    -- Insert a sample company
    INSERT INTO public.companies (name, short_name, description, employee_count, industry_id, headquarters_location_id, verified, founded_year)
    VALUES ('CÔNG TY CÔNG NGHỆ ABC', 'ABC Tech', 'Công ty công nghệ hàng đầu', '100-200 nhân viên', tech_id, hanoi_id, true, 2020)
    ON CONFLICT (short_name) DO NOTHING
    RETURNING id INTO company_id;

    -- If company already exists, get its ID
    IF company_id IS NULL THEN
      SELECT id INTO company_id FROM public.companies WHERE short_name = 'ABC Tech' LIMIT 1;
    END IF;

    -- Insert a sample job
    IF company_id IS NOT NULL AND hanoi_id IS NOT NULL THEN
      INSERT INTO public.jobs (
        company_id, title, description, requirements, benefits,
        salary_min, salary_max, salary_display, location_id,
        work_type, work_mode, experience_level, education_level,
        required_skills, status, published_at, expires_at
      ) VALUES (
        company_id,
        'Senior Software Engineer',
        'Tuyển dụng kỹ sư phần mềm giàu kinh nghiệm',
        E'- 5+ năm kinh nghiệm\n- Thành thạo JavaScript/TypeScript\n- Kinh nghiệm React, Node.js',
        E'- Lương cạnh tranh\n- Bảo hiểm đầy đủ\n- Du lịch hàng năm',
        20000000, 40000000, '20-40 triệu',
        hanoi_id,
        'Full-time', 'Hybrid', 'Senior', 'Bachelor',
        '["JavaScript", "TypeScript", "React", "Node.js"]'::jsonb,
        'active', NOW(), NOW() + INTERVAL '30 days'
      ) ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error inserting sample data: %', SQLERRM;
END $$;

-- COMMIT;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

-- Verification
SELECT 'Setup Complete!' as status,
  (SELECT COUNT(*) FROM public.industries) as industries_count,
  (SELECT COUNT(*) FROM public.locations) as locations_count,
  (SELECT COUNT(*) FROM public.companies) as companies_count,
  (SELECT COUNT(*) FROM public.jobs) as jobs_count;
