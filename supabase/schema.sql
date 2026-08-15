-- AceHire AI Database Schema (Supabase PostgreSQL)
-- Enables Row Level Security (RLS) and tables for complete placement prep ecosystem

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    college TEXT,
    department TEXT,
    preferred_language TEXT DEFAULT 'Tanglish' CHECK (preferred_language IN ('English', 'Tanglish')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. RESUMES TABLE
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    location TEXT,
    summary TEXT,
    skills TEXT[] DEFAULT '{}',
    ats_score INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. INTERVIEW SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('HR', 'Technical', 'Company')),
    company TEXT,
    score INT DEFAULT 0,
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'in_progress')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. INTERVIEW ANSWERS & DUAL-LANGUAGE FEEDBACK
CREATE TABLE IF NOT EXISTS public.interview_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    user_answer TEXT NOT NULL,
    english_explanation TEXT,
    tanglish_explanation TEXT,
    confidence_score INT DEFAULT 0,
    grammar_corrections TEXT[] DEFAULT '{}',
    improved_answer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. CODING PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.coding_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_email TEXT,
    problem_id TEXT NOT NULL,
    problem_title TEXT,
    language TEXT NOT NULL,
    difficulty TEXT,
    code TEXT,
    status TEXT DEFAULT 'started',
    score INT DEFAULT 0,
    time_complexity TEXT,
    english_advice TEXT,
    tanglish_advice TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safe Migrations for coding_progress table
ALTER TABLE public.coding_progress ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.coding_progress ADD COLUMN IF NOT EXISTS difficulty TEXT;
ALTER TABLE public.coding_progress ADD COLUMN IF NOT EXISTS problem_title TEXT;
ALTER TABLE public.coding_progress ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'started';
ALTER TABLE public.coding_progress ADD COLUMN IF NOT EXISTS english_advice TEXT;

-- 6. APTITUDE PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.aptitude_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('Quantitative', 'Logical', 'Verbal')),
    score INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. LEARNING ROADMAP TABLE
CREATE TABLE IF NOT EXISTS public.learning_roadmap (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    period TEXT NOT NULL CHECK (period IN ('Daily', 'Weekly', 'Monthly')),
    title TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT false,
    due_date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aptitude_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_roadmap ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own data
CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage own resumes" ON public.resumes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own interviews" ON public.interview_sessions FOR ALL USING (auth.uid() = user_id);

-- Automatic Profile Creation Trigger for Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, college, department, preferred_language, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'college', ''),
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'Tanglish'),
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

