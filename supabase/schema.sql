-- ============================================================================
-- AceHire AI Placement Ecosystem - Complete Database Schema Migration
-- ============================================================================

-- Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean existing tables if present
DROP TABLE IF EXISTS public.interview_answers CASCADE;
DROP TABLE IF EXISTS public.interview_sessions CASCADE;
DROP TABLE IF EXISTS public.interview_progress CASCADE;
DROP TABLE IF EXISTS public.communication_progress CASCADE;
DROP TABLE IF EXISTS public.aptitude_progress CASCADE;
DROP TABLE IF EXISTS public.coding_progress CASCADE;
DROP TABLE IF EXISTS public.ats_analyses CASCADE;
DROP TABLE IF EXISTS public.resume_drafts CASCADE;
DROP TABLE IF EXISTS public.resume_data CASCADE;
DROP TABLE IF EXISTS public.resumes CASCADE;
DROP TABLE IF EXISTS public.resume_templates CASCADE;
DROP TABLE IF EXISTS public.learning_roadmap CASCADE;
DROP TABLE IF EXISTS public.recent_activity CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Trigger Function for Updated Timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 1. PROFILES TABLE (Linked to auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  gender TEXT,
  user_status TEXT CHECK (user_status IN ('Plus Two Student', 'College Student', 'Graduate', 'Postgraduate', 'Working Professional', 'Job Seeker')),
  school_name TEXT,
  stream TEXT,
  expected_completion_year TEXT,
  college TEXT,
  degree TEXT,
  department TEXT,
  current_year TEXT,
  graduation_year TEXT,
  highest_qualification TEXT,
  "current_role" TEXT,
  company TEXT,
  experience TEXT,
  target_industry TEXT,
  passout_year TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'Tanglish' CHECK (preferred_language IN ('English', 'Tanglish')),
  target_job_role TEXT,
  skills TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  readiness_score JSONB DEFAULT '{"overall": 0, "resume": 0, "coding": 0, "aptitude": 0, "interview": 0, "communication": 0, "lastUpdated": "Never"}',
  custom_profile_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 2. RESUME TEMPLATES REPOSITORY TABLE (Public Read)
-- ----------------------------------------------------------------------------
CREATE TABLE public.resume_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  badge TEXT,
  description TEXT,
  has_photo BOOLEAN DEFAULT FALSE,
  is_ats_friendly BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. RESUME DATA TABLE (Saved Resumes per User)
-- ----------------------------------------------------------------------------
CREATE TABLE public.resume_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'My Resume',
  selected_template TEXT NOT NULL DEFAULT 'modern',
  full_name TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  summary TEXT,
  ats_score INT DEFAULT 0,
  skills TEXT[] DEFAULT '{}',
  raw_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trigger_resume_data_updated_at
  BEFORE UPDATE ON public.resume_data
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 4. RESUME DRAFTS TABLE (Wizard In-Progress State)
-- ----------------------------------------------------------------------------
CREATE TABLE public.resume_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step INT NOT NULL DEFAULT 1,
  is_resume_created BOOLEAN DEFAULT FALSE,
  draft_data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trigger_resume_drafts_updated_at
  BEFORE UPDATE ON public.resume_drafts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 5. ATS ANALYSES TABLE (Standalone & Resume Builder ATS Scans)
-- ----------------------------------------------------------------------------
CREATE TABLE public.ats_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.resume_data(id) ON DELETE SET NULL,
  target_role TEXT,
  ats_score INT NOT NULL,
  matched_skills TEXT[] DEFAULT '{}',
  missing_skills TEXT[] DEFAULT '{}',
  formatting_suggestions TEXT[] DEFAULT '{}',
  actionable_improvements JSONB DEFAULT '[]',
  analysis_result JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. CODING PROGRESS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE public.coding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  problem_id TEXT NOT NULL,
  problem_title TEXT,
  language TEXT NOT NULL,
  difficulty TEXT,
  code TEXT,
  score INT DEFAULT 0,
  status TEXT DEFAULT 'started',
  time_complexity TEXT,
  english_advice TEXT,
  tanglish_advice TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trigger_coding_progress_updated_at
  BEFORE UPDATE ON public.coding_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 7. APTITUDE PROGRESS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE public.aptitude_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('Quantitative', 'Logical', 'Verbal')),
  difficulty TEXT,
  score INT NOT NULL,
  total_questions INT,
  correct_count INT,
  time_taken_seconds INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. COMMUNICATION PROGRESS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE public.communication_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT,
  difficulty TEXT,
  score INT NOT NULL,
  feedback JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. INTERVIEW SESSIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE public.interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('HR', 'Technical')),
  difficulty TEXT DEFAULT 'Medium',
  company TEXT,
  questions_count INT DEFAULT 0,
  average_score INT DEFAULT 0,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  session_data JSONB,
  final_report JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trigger_interview_sessions_updated_at
  BEFORE UPDATE ON public.interview_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 10. INTERVIEW ANSWERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE public.interview_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id TEXT,
  question_text TEXT NOT NULL,
  user_answer TEXT NOT NULL,
  score INT DEFAULT 0,
  feedback JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 11. LEARNING ROADMAP TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE public.learning_roadmap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('Daily', 'Weekly', 'Monthly')),
  category TEXT,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  due_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trigger_learning_roadmap_updated_at
  BEFORE UPDATE ON public.learning_roadmap
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 12. RECENT ACTIVITY TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE public.recent_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  score TEXT,
  time TEXT,
  target_tab TEXT,
  timestamp BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 13. USER SETTINGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trigger_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    name,
    email,
    phone,
    user_status,
    school_name,
    stream,
    expected_completion_year,
    college,
    degree,
    department,
    current_year,
    graduation_year,
    highest_qualification,
    current_role,
    company,
    experience,
    target_industry,
    passout_year,
    preferred_language,
    avatar_url,
    custom_profile_data
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_status', 'College Student'),
    COALESCE(NEW.raw_user_meta_data->>'school_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'stream', ''),
    COALESCE(NEW.raw_user_meta_data->>'expected_completion_year', ''),
    COALESCE(NEW.raw_user_meta_data->>'college', ''),
    COALESCE(NEW.raw_user_meta_data->>'degree', ''),
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    COALESCE(NEW.raw_user_meta_data->>'current_year', ''),
    COALESCE(NEW.raw_user_meta_data->>'graduation_year', ''),
    COALESCE(NEW.raw_user_meta_data->>'highest_qualification', ''),
    COALESCE(NEW.raw_user_meta_data->>'current_role', ''),
    COALESCE(NEW.raw_user_meta_data->>'company', ''),
    COALESCE(NEW.raw_user_meta_data->>'experience', ''),
    COALESCE(NEW.raw_user_meta_data->>'target_industry', ''),
    COALESCE(NEW.raw_user_meta_data->>'passout_year', ''),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'Tanglish'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb)
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    user_status = EXCLUDED.user_status,
    college = EXCLUDED.college,
    department = EXCLUDED.department,
    preferred_language = EXCLUDED.preferred_language,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ats_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aptitude_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_roadmap ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policy
DROP POLICY IF EXISTS "Users can view and manage their own profile" ON public.profiles;
CREATE POLICY "Users can view and manage their own profile"
  ON public.profiles FOR ALL USING (auth.uid() = id);

-- 2. Resume Templates Policy (Public Read)
DROP POLICY IF EXISTS "Everyone can view active templates" ON public.resume_templates;
CREATE POLICY "Everyone can view active templates"
  ON public.resume_templates FOR SELECT USING (is_active = true);

-- 3. Resume Data Policy
DROP POLICY IF EXISTS "Users can manage their own resumes" ON public.resume_data;
CREATE POLICY "Users can manage their own resumes"
  ON public.resume_data FOR ALL USING (auth.uid() = user_id);

-- 4. Resume Drafts Policy
DROP POLICY IF EXISTS "Users can manage their own drafts" ON public.resume_drafts;
CREATE POLICY "Users can manage their own drafts"
  ON public.resume_drafts FOR ALL USING (auth.uid() = user_id);

-- 5. ATS Analyses Policy
DROP POLICY IF EXISTS "Users can view their own ATS scans" ON public.ats_analyses;
CREATE POLICY "Users can view their own ATS scans"
  ON public.ats_analyses FOR ALL USING (auth.uid() = user_id);

-- 6. Coding Progress Policy
DROP POLICY IF EXISTS "Users can manage their own coding progress" ON public.coding_progress;
CREATE POLICY "Users can manage their own coding progress"
  ON public.coding_progress FOR ALL USING (auth.uid() = user_id);

-- 7. Aptitude Progress Policy
DROP POLICY IF EXISTS "Users can manage their own aptitude results" ON public.aptitude_progress;
CREATE POLICY "Users can manage their own aptitude results"
  ON public.aptitude_progress FOR ALL USING (auth.uid() = user_id);

-- 8. Communication Progress Policy
DROP POLICY IF EXISTS "Users can manage their own communication history" ON public.communication_progress;
CREATE POLICY "Users can manage their own communication history"
  ON public.communication_progress FOR ALL USING (auth.uid() = user_id);

-- 9. Interview Sessions & Answers Policies
DROP POLICY IF EXISTS "Users can manage their own interview sessions" ON public.interview_sessions;
CREATE POLICY "Users can manage their own interview sessions"
  ON public.interview_sessions FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own interview answers" ON public.interview_answers;
CREATE POLICY "Users can manage their own interview answers"
  ON public.interview_answers FOR ALL USING (auth.uid() = user_id);

-- 10. Learning Roadmap Policy
DROP POLICY IF EXISTS "Users can manage their own roadmap items" ON public.learning_roadmap;
CREATE POLICY "Users can manage their own roadmap items"
  ON public.learning_roadmap FOR ALL USING (auth.uid() = user_id);

-- 11. Recent Activity Policy
DROP POLICY IF EXISTS "Users can manage their own recent activity feed" ON public.recent_activity;
CREATE POLICY "Users can manage their own recent activity feed"
  ON public.recent_activity FOR ALL USING (auth.uid() = user_id);

-- 12. User Settings Policy
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_settings;
CREATE POLICY "Users can manage their own settings"
  ON public.user_settings FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- SUPABASE STORAGE BUCKETS & STORAGE POLICIES
-- ============================================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('profile_avatars', 'profile_avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('resume_photos', 'resume_photos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('resume_files', 'resume_files', false) ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Profile Avatars Public Read" ON storage.objects;
CREATE POLICY "Profile Avatars Public Read"
  ON storage.objects FOR SELECT USING (bucket_id = 'profile_avatars');

DROP POLICY IF EXISTS "Profile Avatars User Write" ON storage.objects;
CREATE POLICY "Profile Avatars User Write"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile_avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Resume Photos Public Read" ON storage.objects;
CREATE POLICY "Resume Photos Public Read"
  ON storage.objects FOR SELECT USING (bucket_id = 'resume_photos');

DROP POLICY IF EXISTS "Resume Photos User Write" ON storage.objects;
CREATE POLICY "Resume Photos User Write"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resume_photos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Resume Files User Manage" ON storage.objects;
CREATE POLICY "Resume Files User Manage"
  ON storage.objects FOR ALL USING (bucket_id = 'resume_files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- SEED STATIC DATA: 30 RESUME TEMPLATES REPOSITORY
-- ============================================================================

INSERT INTO public.resume_templates (id, name, category, badge, description, has_photo, is_ats_friendly) VALUES
  ('photo-modern', 'Modern Avatar Header', 'Photo Templates', 'Photo Included', 'Modern layout with left photo avatar badge and indigo header accent.', true, true),
  ('photo-executive', 'Executive Headshot Portrait', 'Photo Templates', 'Senior Executive', 'Full-width executive banner with right circular portrait frame.', true, true),
  ('photo-tech', 'Tech Developer Headshot', 'Photo Templates', 'Developer Choice', 'Dark terminal style header with square photo placeholder.', true, true),
  ('photo-creative', 'Creative Portfolio Photo', 'Photo Templates', 'Design & Creative', 'Vibrant purple gradient header with border-highlighted profile photo.', true, true),
  ('photo-minimal', 'Minimal Profile Avatar', 'Photo Templates', 'Clean Minimal', 'Clean left border layout with compact circular photo avatar.', true, true),
  ('photo-sidebar', 'Split Sidebar Portrait', 'Photo Templates', 'Two-Column Split', 'Dark left sidebar featuring profile photo, contact details & skills.', true, true),
  ('photo-corporate', 'Corporate Leadership Photo', 'Photo Templates', 'Corporate Standard', 'Deep blue corporate header with square executive headshot.', true, true),
  ('photo-elegant', 'Elegant Gold Headshot', 'Photo Templates', 'Elegant Style', 'Warm gold accent lines with centered serif title & circular headshot.', true, true),
  ('photo-gradient', 'Gradient Wave Photo', 'Photo Templates', 'Teal Modern', 'Teal gradient header pill with rounded portrait container.', true, true),
  ('photo-academic', 'Scholar Academic Portrait', 'Photo Templates', 'Academic', 'Traditional serif academic document layout with scholar photo badge.', true, true),
  ('modern', 'Modern Professional', 'Modern', 'Popular', 'Indigo accent header bar, clean modern typography, structured section dividers.', false, true),
  ('ats-friendly', 'ATS Maximum Parser', 'ATS Standard', 'Recommended for ATS', 'Clean single-column structure, standard text headings, maximum parser compatibility.', false, true),
  ('minimal', 'Minimal Clean', 'Minimal', 'Fresher Choice', 'Ultra-clean layout, left border accent, compact line spacing.', false, true),
  ('executive', 'Executive Leadership', 'Modern', 'Senior Level', 'Dark navy top banner, centered executive header, serif section titles.', false, true),
  ('technical', 'Technical Engineer Dark', 'Modern', 'Engineering', 'Monospace code-style accents, dark slate banner for tech competencies.', false, true),
  ('creative', 'Creative Dual-Tone', 'Modern', 'Product & Design', 'Vibrant dual-tone gradient header bar, bold typography hierarchy.', false, true),
  ('developer', 'Terminal Developer Tech', 'Modern', 'Software Engineer', 'Terminal command prompt header banner `$ cat profile.json`.', false, true),
  ('ivy', 'Ivy League Academic', 'ATS Standard', 'Academic', 'Harvard/Yale traditional style, small caps headings, centered contact info.', false, true),
  ('emerald-fresh', 'Emerald Graduate Accent', 'Modern', 'Fresher Special', 'Fresh emerald gradient header, structured skills breakdown.', false, true),
  ('monochrome', 'Pure Monochrome B&W', 'Minimal', 'Pure B&W', 'High contrast monochrome styling, bold black borders.', false, true),
  ('cyan-matrix', 'Cyan Data Analytics', 'Modern', 'Data Science', 'Left thick cyan bar, data matrix section dividers.', false, true),
  ('rose-modern', 'Rose Quartz Accent', 'Modern', 'Modern Rose', 'Soft rose accent rule, elegant font pairing.', false, true),
  ('slate-minimal', 'Slate Line Minimal', 'Minimal', 'Clean Line', 'Crisp grey lines, subtle section padding.', false, true),
  ('charcoal-exec', 'Charcoal Director Slate', 'Modern', 'Director', 'Charcoal banner with gold subtitles.', false, true),
  ('amber-gold', 'Amber Gold Corporate', 'Modern', 'Corporate Gold', 'Warm amber section highlights with sharp serif headers.', false, true),
  ('teal-tech', 'Teal Tech Minimalist', 'Modern', 'Teal Tech', 'Compact teal pill titles for engineering graduates.', false, true),
  ('classic-corporate', 'Classic Corporate Standard', 'ATS Standard', 'Classic Corporate', 'Traditional corporate resume structure with clean horizontal dividers.', false, true),
  ('nordic-minimal', 'Nordic Frost Minimal', 'Minimal', 'Nordic Clean', 'Scandinavian minimalist layout with generous whitespace.', false, true),
  ('purple-accent', 'Royal Purple Accent', 'Modern', 'Royal Accent', 'Elegantly styled royal purple title block.', false, true),
  ('academic-scholar', 'Scholar Research Classic', 'ATS Standard', 'Scholar', 'Publication & academic project optimized template.', false, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  badge = EXCLUDED.badge,
  description = EXCLUDED.description,
  has_photo = EXCLUDED.has_photo,
  is_ats_friendly = EXCLUDED.is_ats_friendly;
