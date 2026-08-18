-- ============================================================================
-- AceHire AI - Migration: Aptitude Question History Tracking
-- File: supabase/migrations/20260818000000_aptitude_questions_history.sql
-- ============================================================================

-- Add tracking columns for non-repeating question history and attempt counts
ALTER TABLE public.aptitude_progress ADD COLUMN IF NOT EXISTS questions_used JSONB DEFAULT '[]';
ALTER TABLE public.aptitude_progress ADD COLUMN IF NOT EXISTS attempt_number INT DEFAULT 1;

-- Index for efficient history querying per user, category, and difficulty level
CREATE INDEX IF NOT EXISTS idx_aptitude_progress_user_cat_diff 
  ON public.aptitude_progress (user_id, category, difficulty);

-- Grant permissions for authenticated users (RLS is enforced by table policy)
GRANT SELECT, INSERT ON public.aptitude_progress TO authenticated;
