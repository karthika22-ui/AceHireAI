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
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    problem_id TEXT NOT NULL,
    language TEXT NOT NULL,
    code TEXT NOT NULL,
    score INT DEFAULT 0,
    time_complexity TEXT,
    tanglish_advice TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. APTITUDE PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.aptitude_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('Quantitative', 'Logical', 'Verbal')),
    score INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. SKILL GAP TABLE
CREATE TABLE IF NOT EXISTS public.skill_gap (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill TEXT NOT NULL,
    target_company TEXT NOT NULL,
    current_proficiency INT DEFAULT 0,
    status TEXT DEFAULT 'Missing' CHECK (status IN ('Missing', 'In Progress', 'Mastered')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. LEARNING ROADMAP TABLE
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
ALTER TABLE public.skill_gap ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_roadmap ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own data
CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can manage own resumes" ON public.resumes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own interviews" ON public.interview_sessions FOR ALL USING (auth.uid() = user_id);
