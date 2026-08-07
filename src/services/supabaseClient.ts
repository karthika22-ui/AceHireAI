import { createClient } from '@supabase/supabase-js';
import { UserProfile, ResumeData, ReadinessScore } from '../types';

// 1. ENVIRONMENT VARIABLES SETUP FOR SUPABASE
const metaEnv = (import.meta as any).env || {};

const supabaseUrl =
  metaEnv.VITE_SUPABASE_URL ||
  metaEnv.VITE_SUPABASE_PROJECT_URL ||
  'https://placeholder.supabase.co';

const supabaseAnonKey =
  metaEnv.VITE_SUPABASE_ANON_KEY ||
  metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'placeholder';

export const isSupabaseConfigured = () => {
  return (
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseAnonKey !== 'placeholder' &&
    supabaseUrl.trim().length > 0 &&
    supabaseAnonKey.trim().length > 0
  );
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export interface ActivityItem {
  id: string;
  title: string;
  type: string;
  score: string;
  time: string;
  timestamp?: number;
  targetTab?: string;
}

export const INITIAL_READINESS: ReadinessScore = {
  overall: 0,
  resume: 0,
  coding: 0,
  aptitude: 0,
  interview: 0,
  communication: 0,
  lastUpdated: 'Never'
};

export const getInitialProfileForEmail = (email: string): UserProfile => {
  const rawName = email.split('@')[0] || 'Student';
  const nameFromEmail = rawName
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    id: `usr-${Date.now()}`,
    name: nameFromEmail,
    email: email,
    college: '',
    department: '',
    preferredLanguage: 'Tanglish',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString()
  };
};

export const getInitialResumeForEmail = (email: string, name?: string): ResumeData => {
  return {
    fullName: name || email.split('@')[0] || 'Student User',
    email: email,
    phone: '',
    location: '',
    summary: '',
    education: [],
    skills: [],
    projects: [],
    experience: []
  };
};

// --- SUPABASE SERVICE LAYER ---
export class SupabaseService {
  // AUTH HELPERS
  static async signUp(email: string, pass: string, profileData?: Partial<UserProfile>) {
    if (!isSupabaseConfigured()) {
      return { data: { user: { id: `local-${Date.now()}`, email } }, error: null };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          name: profileData?.name || email.split('@')[0],
          college: profileData?.college || '',
          department: profileData?.department || '',
          preferred_language: profileData?.preferredLanguage || 'Tanglish'
        }
      }
    });

    if (!error && data.user) {
      const profile: UserProfile = {
        id: data.user.id,
        name: profileData?.name || email.split('@')[0],
        email: email,
        college: profileData?.college || '',
        department: profileData?.department || '',
        preferredLanguage: profileData?.preferredLanguage || 'Tanglish',
        avatarUrl:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date().toISOString()
      };
      await this.saveProfile(profile, data.user.id);
    }
    return { data, error };
  }

  static async signIn(email: string, pass: string) {
    if (!isSupabaseConfigured()) {
      return { data: { user: { id: `local-${Date.now()}`, email } }, error: null };
    }
    return await supabase.auth.signInWithPassword({
      email,
      password: pass
    });
  }

  static async signOut() {
    if (!isSupabaseConfigured()) return { error: null };
    return await supabase.auth.signOut();
  }

  static async getCurrentUser() {
    if (!isSupabaseConfigured()) return null;
    const { data } = await supabase.auth.getUser();
    return data?.user || null;
  }

  // 1. PROFILES TABLE OPERATIONS
  static async fetchProfile(userIdOrEmail: string): Promise<UserProfile> {
    const fallback = getInitialProfileForEmail(
      userIdOrEmail.includes('@') ? userIdOrEmail : 'student@college.edu'
    );
    if (!isSupabaseConfigured() || !userIdOrEmail) return fallback;

    try {
      const isUuid = userIdOrEmail.includes('-');
      const query = supabase.from('profiles').select('*');
      const { data, error } = isUuid
        ? await query.eq('id', userIdOrEmail).single()
        : await query.eq('email', userIdOrEmail).single();

      if (error || !data) return fallback;

      return {
        id: data.id,
        name: data.name || fallback.name,
        email: data.email || fallback.email,
        college: data.college || '',
        department: data.department || '',
        preferredLanguage: data.preferred_language || 'Tanglish',
        avatarUrl:
          data.avatar_url ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: data.created_at || new Date().toISOString()
      };
    } catch (e) {
      console.warn('Supabase fetchProfile error:', e);
      return fallback;
    }
  }

  static async saveProfile(profile: UserProfile, userId?: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return true;

    try {
      const payload = {
        id: userId || profile.id,
        name: profile.name,
        email: profile.email,
        college: profile.college,
        department: profile.department,
        preferred_language: profile.preferredLanguage,
        avatar_url: profile.avatarUrl
      };

      const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
      if (error) {
        // Try fallback on email
        await supabase.from('profiles').upsert(payload, { onConflict: 'email' });
      }
      return true;
    } catch (e) {
      console.warn('Supabase saveProfile error:', e);
      return false;
    }
  }

  // 2. RECENT_ACTIVITY TABLE OPERATIONS
  static async fetchRecentActivities(userId: string): Promise<ActivityItem[]> {
    if (!isSupabaseConfigured() || !userId) return [];

    try {
      const { data, error } = await supabase
        .from('recent_activity')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !data) return [];

      return data.map((item: any) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        score: item.score,
        time: item.time,
        timestamp: item.timestamp ? Number(item.timestamp) : undefined,
        targetTab: item.target_tab
      }));
    } catch (e) {
      console.warn('Supabase fetchRecentActivities error:', e);
      return [];
    }
  }

  static async addRecentActivity(activity: ActivityItem, userId: string): Promise<ActivityItem[]> {
    if (!isSupabaseConfigured() || !userId) return [activity];

    try {
      const payload = {
        user_id: userId,
        title: activity.title,
        type: activity.type,
        score: activity.score,
        time: activity.time,
        target_tab: activity.targetTab || null,
        timestamp: activity.timestamp || Date.now()
      };

      await supabase.from('recent_activity').insert(payload);
      return await this.fetchRecentActivities(userId);
    } catch (e) {
      console.warn('Supabase addRecentActivity error:', e);
      return [activity];
    }
  }

  static async clearRecentActivities(userId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !userId) return true;

    try {
      await supabase.from('recent_activity').delete().eq('user_id', userId);
      return true;
    } catch (e) {
      console.warn('Supabase clearRecentActivities error:', e);
      return false;
    }
  }

  // 3. READINESS SCORE OPERATIONS
  static async fetchReadinessScore(userId: string): Promise<ReadinessScore> {
    if (!isSupabaseConfigured() || !userId) return INITIAL_READINESS;

    try {
      const { data } = await supabase
        .from('profiles')
        .select('readiness_score')
        .eq('id', userId)
        .single();

      if (data && data.readiness_score) {
        return data.readiness_score as ReadinessScore;
      }
    } catch (e) {}

    return INITIAL_READINESS;
  }

  static async saveReadinessScore(score: ReadinessScore, userId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !userId) return true;

    try {
      await supabase.from('profiles').update({ readiness_score: score }).eq('id', userId);
      return true;
    } catch (e) {
      console.warn('Supabase saveReadinessScore error:', e);
      return false;
    }
  }

  // 4. RESUME_DATA TABLE OPERATIONS
  static async fetchResume(userId: string, email?: string): Promise<ResumeData> {
    const fallback = getInitialResumeForEmail(email || 'student@college.edu');
    if (!isSupabaseConfigured() || !userId) return fallback;

    try {
      const { data, error } = await supabase
        .from('resume_data')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        // Check legacy table 'resumes'
        const { data: legacy } = await supabase
          .from('resumes')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (legacy) {
          return {
            fullName: legacy.full_name || fallback.fullName,
            email: legacy.email || fallback.email,
            phone: legacy.phone || '',
            location: legacy.location || '',
            summary: legacy.summary || '',
            skills: legacy.skills || [],
            atsScore: legacy.ats_score || 0,
            education: fallback.education,
            projects: fallback.projects,
            experience: fallback.experience
          };
        }
        return fallback;
      }

      if (data.raw_data) {
        return data.raw_data as ResumeData;
      }

      return {
        fullName: data.full_name || fallback.fullName,
        email: data.email || fallback.email,
        phone: data.phone || '',
        location: data.location || '',
        summary: data.summary || '',
        skills: data.skills || [],
        atsScore: data.ats_score || 0,
        education: fallback.education,
        projects: fallback.projects,
        experience: fallback.experience
      };
    } catch (e) {
      console.warn('Supabase fetchResume error:', e);
      return fallback;
    }
  }

  static async saveResume(resume: ResumeData, userId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !userId) return true;

    try {
      const payload = {
        user_id: userId,
        full_name: resume.fullName,
        email: resume.email,
        phone: resume.phone || '',
        location: resume.location || '',
        summary: resume.summary || '',
        skills: resume.skills || [],
        ats_score: resume.atsScore || 0,
        raw_data: resume
      };

      const { error } = await supabase.from('resume_data').upsert(payload, { onConflict: 'user_id' });
      if (error) {
        await supabase.from('resumes').upsert({
          user_id: userId,
          full_name: resume.fullName,
          email: resume.email,
          phone: resume.phone || '',
          location: resume.location || '',
          summary: resume.summary || '',
          skills: resume.skills || [],
          ats_score: resume.atsScore || 0
        });
      }
      return true;
    } catch (e) {
      console.warn('Supabase saveResume error:', e);
      return false;
    }
  }

  // 5. CODING_PROGRESS TABLE OPERATIONS
  static async fetchCodingProgress(userId: string) {
    if (!isSupabaseConfigured() || !userId) return [];
    try {
      const { data } = await supabase
        .from('coding_progress')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      return data || [];
    } catch (e) {
      return [];
    }
  }

  static async initCodingProgress(progress: {
    userEmail: string;
    userId?: string;
    language: string;
    difficulty: string;
    problemId: string;
    problemTitle: string;
    status?: string;
    score?: number;
  }) {
    console.log('🔍 [CODING_PROGRESS DEBUG] initCodingProgress invoked with:', progress);

    const configured = isSupabaseConfigured();
    console.log('🔌 [CODING_PROGRESS DEBUG] Supabase configured status:', configured);

    if (!configured) {
      console.error('❌ [CODING_PROGRESS DEBUG] Supabase client is NOT configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file.');
      return null;
    }

    try {
      // 1. Resolve user email & user ID from Supabase auth session if active
      let resolvedEmail = progress.userEmail || 'student@college.edu';
      let resolvedUserId = progress.userId;

      try {
        const { data: authData, error: authErr } = await supabase.auth.getUser();
        if (authErr) {
          console.warn('⚠️ [CODING_PROGRESS DEBUG] Supabase auth.getUser() warning:', authErr.message);
        }
        if (authData?.user) {
          if (authData.user.email) resolvedEmail = authData.user.email;
          if (authData.user.id) resolvedUserId = authData.user.id;
          console.log('👤 [CODING_PROGRESS DEBUG] Authenticated Supabase user resolved:', resolvedEmail, resolvedUserId);
        } else {
          console.log('👤 [CODING_PROGRESS DEBUG] No active Supabase Auth user session found. Using provided email:', resolvedEmail);
        }
      } catch (e) {
        console.warn('⚠️ [CODING_PROGRESS DEBUG] Auth lookup exception:', e);
      }

      const isUuid = (str?: string) =>
        typeof str === 'string' &&
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

      // Primary payload according to requirements
      const payload: Record<string, any> = {
        user_email: resolvedEmail,
        language: progress.language,
        difficulty: progress.difficulty,
        problem_id: progress.problemId,
        problem_title: progress.problemTitle,
        status: progress.status || 'started',
        score: progress.score !== undefined ? progress.score : 0
      };

      if (isUuid(resolvedUserId)) {
        payload.user_id = resolvedUserId;
      }

      console.log('🚀 [CODING_PROGRESS DEBUG] Sending INSERT payload to Supabase coding_progress table:', payload);

      // Execute insert
      const { data, error } = await supabase
        .from('coding_progress')
        .insert(payload)
        .select();

      if (error) {
        console.error('❌ [CODING_PROGRESS SUPABASE ERROR] Insert failed!');
        console.error('   - Code:', error.code);
        console.error('   - Message:', error.message);
        console.error('   - Details:', error.details);
        console.error('   - Hint:', error.hint);

        // Check if error is due to missing column (e.g. difficulty, user_email, problem_title, status)
        if (error.code === '42703' || (error.message && error.message.toLowerCase().includes('column'))) {
          console.warn('💡 [CODING_PROGRESS SCHEMA NOTICE] Missing column on remote Supabase coding_progress table.');
          console.warn('   Run this SQL in your Supabase SQL Editor to permanently sync all columns:');
          console.warn('   ALTER TABLE public.coding_progress ADD COLUMN IF NOT EXISTS difficulty TEXT;');
          console.warn('   ALTER TABLE public.coding_progress ADD COLUMN IF NOT EXISTS user_email TEXT;');
          console.warn('   ALTER TABLE public.coding_progress ADD COLUMN IF NOT EXISTS problem_title TEXT;');
          console.warn('   ALTER TABLE public.coding_progress ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'started\';');

          // Build safe payload by removing missing column(s) so insert succeeds immediately
          const safePayload = { ...payload };
          if (error.message.includes('difficulty')) delete safePayload.difficulty;
          if (error.message.includes('user_email')) delete safePayload.user_email;
          if (error.message.includes('problem_title')) delete safePayload.problem_title;
          if (error.message.includes('status')) delete safePayload.status;

          // Always remove difficulty on first retry if general column error occurred
          delete safePayload.difficulty;

          console.log('🔄 [CODING_PROGRESS RETRY] Retrying insert with schema-compatible payload:', safePayload);

          const { data: retryData, error: retryError } = await supabase
            .from('coding_progress')
            .insert(safePayload)
            .select();

          if (!retryError) {
            console.log('✅ [CODING_PROGRESS SUCCESS] Schema-compatible insert succeeded:', retryData);
            return retryData && retryData.length > 0 ? retryData[0] : retryData;
          }

          console.warn('⚠️ [CODING_PROGRESS RETRY ERROR] Retry with select failed:', retryError.message);
          const { error: rawRetryError } = await supabase
            .from('coding_progress')
            .insert(safePayload);

          if (!rawRetryError) {
            console.log('✅ [CODING_PROGRESS SUCCESS] Raw schema-compatible insert succeeded without .select()!');
            return safePayload;
          }
        }

        // Fallback Attempt: Try insert without .select() (in case RLS SELECT policy is missing)
        console.log('🔄 [CODING_PROGRESS DEBUG] Attempting fallback insert without .select()...');
        const { error: fallbackError } = await supabase
          .from('coding_progress')
          .insert(payload);

        if (fallbackError) {
          console.error('❌ [CODING_PROGRESS FALLBACK ERROR] Fallback insert also failed:', fallbackError.message, fallbackError);
          return null;
        } else {
          console.log('✅ [CODING_PROGRESS SUCCESS] Fallback insert succeeded without .select()!');
          return payload;
        }
      }

      console.log('✅ [CODING_PROGRESS SUCCESS] Row successfully inserted into coding_progress table:', data);
      return data && data.length > 0 ? data[0] : data;
    } catch (err: any) {
      console.error('💥 [CODING_PROGRESS EXCEPTION] Unhandled exception during insertion:', err?.message || err, err);
      return null;
    }
  }

  static async updateCodingProgress(updateData: {
    problemId: string;
    userEmail: string;
    userId?: string;
    code: string;
    score: number;
    status: string;
    timeComplexity?: string;
    englishAdvice?: string;
    tanglishAdvice?: string;
  }) {
    console.log('🔄 [UPDATE started] Updating existing coding_progress record...');

    if (!isSupabaseConfigured()) {
      console.error('❌ [UPDATE error] Supabase client is not configured.');
      return null;
    }

    try {
      // 1. Resolve user email & user ID from Supabase auth session if active
      let resolvedEmail = updateData.userEmail || 'student@college.edu';
      let resolvedUserId = updateData.userId;

      try {
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          if (authData.user.email) resolvedEmail = authData.user.email;
          if (authData.user.id) resolvedUserId = authData.user.id;
        }
      } catch (e) {}

      // 2. Construct update payload
      const payload: Record<string, any> = {
        code: updateData.code,
        score: updateData.score,
        status: updateData.status,
        time_complexity: updateData.timeComplexity || 'O(N)',
        english_advice: updateData.englishAdvice || 'Code evaluated successfully',
        tanglish_advice: updateData.tanglishAdvice || ''
      };

      console.log('📦 [UPDATE payload] Target Problem ID:', updateData.problemId, '| Email:', resolvedEmail);
      console.log('📦 [UPDATE payload]', payload);

      // Perform UPDATE on existing row matching problem_id (and user_email if available)
      let query = supabase
        .from('coding_progress')
        .update(payload)
        .eq('problem_id', updateData.problemId);

      if (resolvedEmail) {
        query = query.eq('user_email', resolvedEmail);
      }

      const { data, error } = await query.select();

      if (error) {
        console.error('❌ [UPDATE error] Failed to update coding_progress row!');
        console.error('   - Code:', error.code);
        console.error('   - Message:', error.message);
        console.error('   - Details:', error.details);
        console.error('   - Hint:', error.hint);

        // Fallback Retry 1: If english_advice column is missing on remote DB table, fallback without english_advice
        if (error.code === '42703' || (error.message && error.message.toLowerCase().includes('english_advice'))) {
          console.warn('💡 [UPDATE NOTICE] english_advice column missing on remote DB. Retrying without english_advice...');
          const fallbackPayload = { ...payload };
          delete fallbackPayload.english_advice;

          console.log('📦 [UPDATE payload] Retry payload:', fallbackPayload);
          let retryQuery = supabase
            .from('coding_progress')
            .update(fallbackPayload)
            .eq('problem_id', updateData.problemId);

          if (resolvedEmail) {
            retryQuery = retryQuery.eq('user_email', resolvedEmail);
          }

          const { data: retryData, error: retryErr } = await retryQuery.select();

          if (retryErr) {
            console.error('❌ [UPDATE error] Fallback update failed:', retryErr.message, retryErr);
            return null;
          }

          console.log('✅ [UPDATE success] Fallback update completed successfully:', retryData);
          return retryData && retryData.length > 0 ? retryData[0] : retryData;
        }

        // Fallback Retry 2: Try update without .select() if RLS SELECT policy is strict
        let rawQuery = supabase
          .from('coding_progress')
          .update(payload)
          .eq('problem_id', updateData.problemId);

        if (resolvedEmail) {
          rawQuery = rawQuery.eq('user_email', resolvedEmail);
        }

        const { error: rawUpdateErr } = await rawQuery;

        if (!rawUpdateErr) {
          console.log('✅ [UPDATE success] Update completed successfully without .select()');
          return payload;
        }

        return null;
      }

      console.log('✅ [UPDATE success] Existing coding_progress row updated successfully:', data);
      return data && data.length > 0 ? data[0] : data;
    } catch (err: any) {
      console.error('💥 [UPDATE error] Unhandled exception during update:', err?.message || err, err);
      return null;
    }
  }

  static async saveCodingProgress(userId: string, progress: {
    problemId: string;
    language: string;
    code: string;
    score: number;
    timeComplexity?: string;
    tanglishAdvice?: string;
  }) {
    return this.updateCodingProgress({
      problemId: progress.problemId,
      userEmail: '',
      userId,
      code: progress.code,
      score: progress.score,
      status: 'completed',
      timeComplexity: progress.timeComplexity,
      tanglishAdvice: progress.tanglishAdvice
    });
  }

  // 6. APTITUDE_PROGRESS TABLE OPERATIONS
  static async fetchAptitudeProgress(userId: string) {
    if (!isSupabaseConfigured() || !userId) return [];
    try {
      const { data } = await supabase
        .from('aptitude_progress')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      return data || [];
    } catch (e) {
      return [];
    }
  }

  static async saveAptitudeProgress(userId: string, category: string, score: number) {
    if (!isSupabaseConfigured() || !userId) return null;
    try {
      const { data } = await supabase.from('aptitude_progress').insert({
        user_id: userId,
        category,
        score
      }).select().single();
      return data;
    } catch (e) {
      return null;
    }
  }

  // 7. INTERVIEW_PROGRESS / INTERVIEW_SESSIONS TABLE OPERATIONS
  static async fetchInterviewSessions(userId: string) {
    if (!isSupabaseConfigured() || !userId) return [];
    try {
      const { data } = await supabase
        .from('interview_progress')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (data && data.length > 0) return data;

      const { data: alt } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      return alt || [];
    } catch (e) {
      return [];
    }
  }

  static async saveInterviewSession(userId: string, sessionData: any) {
    if (!isSupabaseConfigured() || !userId) return null;
    try {
      const payload = {
        user_id: userId,
        type: sessionData.type || sessionData.category || 'Technical',
        company: sessionData.company || 'Zoho',
        score: sessionData.score || 0,
        session_data: sessionData,
        status: sessionData.status || 'completed'
      };

      const { data, error } = await supabase.from('interview_progress').insert(payload).select().single();
      if (error) {
        const { data: legacyData } = await supabase.from('interview_sessions').insert({
          user_id: userId,
          type: sessionData.type || 'Technical',
          company: sessionData.company || 'Zoho',
          score: sessionData.score || 0,
          status: 'completed'
        }).select().single();
        return legacyData;
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  // 8. COMMUNICATION_PROGRESS TABLE OPERATIONS
  static async fetchCommunicationProgress(userId: string) {
    if (!isSupabaseConfigured() || !userId) return [];
    try {
      const { data } = await supabase
        .from('communication_progress')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      return data || [];
    } catch (e) {
      return [];
    }
  }

  static async saveCommunicationProgress(userId: string, sessionData: any) {
    if (!isSupabaseConfigured() || !userId) return null;
    try {
      const { data } = await supabase.from('communication_progress').insert({
        user_id: userId,
        score: sessionData.score || sessionData.overallScore || 0,
        feedback: sessionData.feedback || JSON.stringify(sessionData),
        topic: sessionData.topic || 'General Practice'
      }).select().single();
      return data;
    } catch (e) {
      return null;
    }
  }

  // 10. LEARNING_ROADMAP TABLE OPERATIONS
  static async fetchRoadmap(userId: string) {
    if (!isSupabaseConfigured() || !userId) return [];
    try {
      const { data } = await supabase
        .from('learning_roadmap')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      return data || [];
    } catch (e) {
      return [];
    }
  }

  static async saveRoadmapItem(userId: string, item: any) {
    if (!isSupabaseConfigured() || !userId) return null;
    try {
      const { data } = await supabase.from('learning_roadmap').insert({
        user_id: userId,
        period: item.period || 'Daily',
        title: item.title,
        description: item.description || '',
        completed: item.completed || false,
        due_date: item.dueDate || item.due_date || ''
      }).select().single();
      return data;
    } catch (e) {
      return null;
    }
  }

  // Synchronous Legacy Fallbacks (Preserved for compatibility)
  static getProfile(email?: string): UserProfile {
    return getInitialProfileForEmail(email || 'student@college.edu');
  }

  static getReadinessScore(): ReadinessScore {
    return INITIAL_READINESS;
  }

  static getResume(email?: string): ResumeData {
    return getInitialResumeForEmail(email || 'student@college.edu');
  }

  static getRecentActivities(): ActivityItem[] {
    return [];
  }
}
