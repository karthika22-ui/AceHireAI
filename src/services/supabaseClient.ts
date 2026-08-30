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
  const cleanEmail = email.trim().toLowerCase();
  
  // Check local storage for existing saved profile
  if (cleanEmail && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(`acehire_user_profile_${cleanEmail}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.email) return parsed;
      }
    } catch (e) {}
  }

  const rawName = email.split('@')[0] || 'User';
  const nameFromEmail = rawName
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    id: `usr-${Date.now()}`,
    name: nameFromEmail,
    email: email,
    phone: '',
    userStatus: 'College Student',
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

// Helper to get LAN-accessible Auth redirect URL
export const getAuthRedirectUrl = (): string => {
  const metaEnv = (import.meta as any).env || {};
  if (metaEnv.VITE_AUTH_REDIRECT_URL) {
    return metaEnv.VITE_AUTH_REDIRECT_URL;
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return origin.replace('localhost', '10.215.47.112').replace('127.0.0.1', '10.215.47.112');
    }
    return origin;
  }
  return 'http://10.215.47.112:3000';
};

// --- SUPABASE SERVICE LAYER ---
export class SupabaseService {
  // AUTH HELPERS
  static async signUp(email: string, pass: string, profileData?: Partial<UserProfile>) {
    const cleanEmail = email.trim().toLowerCase();

    if (!isSupabaseConfigured()) {
      throw new Error('Supabase configuration missing. Cannot execute sign up.');
    }

    const redirectUrl = getAuthRedirectUrl();

    let { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: pass,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: profileData?.name || cleanEmail.split('@')[0],
          phone: profileData?.phone || '',
          user_status: profileData?.userStatus || 'College Student',
          school_name: profileData?.schoolName || '',
          stream: profileData?.stream || '',
          expected_completion_year: profileData?.expectedCompletionYear || '',
          college: profileData?.college || '',
          degree: profileData?.degree || '',
          department: profileData?.department || '',
          current_year: profileData?.currentYear || '',
          graduation_year: profileData?.graduationYear || '',
          highest_qualification: profileData?.highestQualification || '',
          current_role: profileData?.currentRole || '',
          company: profileData?.company || '',
          experience: profileData?.experience || '',
          target_industry: profileData?.targetIndustry || '',
          passout_year: profileData?.passoutYear || '',
          preferred_language: profileData?.preferredLanguage || 'Tanglish',
          avatar_url: profileData?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        }
      }
    });

    if (error) {
      const msg = error.message ? error.message.toLowerCase() : '';
      if (msg.includes('already registered') || msg.includes('user_already_exists')) {
        // User already exists in auth -> Attempt auto sign-in with password
        const signInRes = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: pass
        });

        if (signInRes.data?.user) {
          return { data: signInRes.data, error: null };
        } else {
          return {
            data: null,
            error: new Error('An account with this email address already exists. Please sign in with your password.')
          };
        }
      }
      return { data: null, error: new Error(error.message || 'Account creation failed. Please check your details.') };
    }

    if (data?.user) {
      const fullProfile: UserProfile = {
        id: data.user.id,
        name: profileData?.name || cleanEmail.split('@')[0],
        email: cleanEmail,
        phone: profileData?.phone || '',
        userStatus: profileData?.userStatus || 'College Student',
        schoolName: profileData?.schoolName || '',
        stream: profileData?.stream || '',
        expectedCompletionYear: profileData?.expectedCompletionYear || '',
        college: profileData?.college || '',
        degree: profileData?.degree || '',
        department: profileData?.department || '',
        currentYear: profileData?.currentYear || '',
        graduationYear: profileData?.graduationYear || '',
        highestQualification: profileData?.highestQualification || '',
        currentRole: profileData?.currentRole || '',
        company: profileData?.company || '',
        experience: profileData?.experience || '',
        targetIndustry: profileData?.targetIndustry || '',
        passoutYear: profileData?.passoutYear || '',
        preferredLanguage: profileData?.preferredLanguage || 'Tanglish',
        targetJobRole: profileData?.targetJobRole || '',
        skills: profileData?.skills || [],
        avatarUrl: profileData?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        loginCount: 1,
        isFirstLogin: true,
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      await this.saveProfile(fullProfile, data.user.id);

      // If session is null (e.g. email confirmation pending on remote Supabase), attempt auto sign-in immediately
      if (!data.session) {
        try {
          const autoSignIn = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: pass
          });
          if (autoSignIn.data?.session) {
            data = autoSignIn.data;
          }
        } catch (e) {}
      }
    }
    return { data, error: null };
  }

  static async signIn(email: string, pass: string) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase configuration missing. Cannot execute sign in.');
    }
    return await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: pass
    });
  }

  static async resendVerificationEmail(email: string) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase configuration missing. Cannot resend verification email.');
    }
    const cleanEmail = email.trim().toLowerCase();
    const redirectUrl = getAuthRedirectUrl();

    return await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
  }

  static async signInWithGoogle() {
    if (!isSupabaseConfigured()) {
      throw new Error('Google Sign-In requires active Supabase configuration. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
    }
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthRedirectUrl()
      }
    });
  }

  static async signOut() {
    if (!isSupabaseConfigured()) return { error: null };
    return await supabase.auth.signOut();
  }

  static async updatePassword(newPassword: string) {
    if (!isSupabaseConfigured()) return { error: null };
    return await supabase.auth.updateUser({ password: newPassword });
  }

  static async getCurrentUser() {
    if (!isSupabaseConfigured()) return null;
    const { data } = await supabase.auth.getUser();
    return data?.user || null;
  }

  // 1. PROFILES TABLE OPERATIONS
  static async fetchProfile(userIdOrEmail: string): Promise<UserProfile> {
    const cleanKey = userIdOrEmail.trim().toLowerCase();
    
    // Check local storage first
    let localProfile: UserProfile | null = null;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`acehire_user_profile_${cleanKey}`);
        if (stored) localProfile = JSON.parse(stored);
        
        if (!localProfile) {
          const active = localStorage.getItem('acehire_active_user');
          if (active) {
            const parsedActive = JSON.parse(active);
            if (parsedActive.email?.toLowerCase() === cleanKey || parsedActive.id === cleanKey) {
              localProfile = parsedActive;
            }
          }
        }
      } catch (e) {}
    }

    const fallback = localProfile || getInitialProfileForEmail(cleanKey.includes('@') ? cleanKey : 'user@college.edu');
    if (!isSupabaseConfigured() || !userIdOrEmail) return fallback;

    try {
      const isUuid = userIdOrEmail.includes('-');
      const query = supabase.from('profiles').select('*');
      const { data, error } = isUuid
        ? await query.eq('id', userIdOrEmail).single()
        : await query.eq('email', userIdOrEmail).single();

      if (error || !data) return fallback;

      const remoteExtra = data.custom_profile_data || {};

      const mergedProfile: UserProfile = {
        ...fallback,
        id: data.id || fallback.id,
        name: data.name || fallback.name,
        email: data.email || fallback.email,
        phone: data.phone || remoteExtra.phone || fallback.phone || '',
        gender: data.gender || remoteExtra.gender || fallback.gender || '',
        userStatus: data.user_status || remoteExtra.userStatus || fallback.userStatus || 'College Student',
        schoolName: data.school_name || remoteExtra.schoolName || fallback.schoolName,
        stream: data.stream || remoteExtra.stream || fallback.stream,
        expectedCompletionYear: data.expected_completion_year || remoteExtra.expectedCompletionYear || fallback.expectedCompletionYear,
        college: data.college || fallback.college || '',
        degree: data.degree || remoteExtra.degree || fallback.degree,
        department: data.department || fallback.department || '',
        currentYear: data.current_year || remoteExtra.currentYear || fallback.currentYear,
        graduationYear: data.graduation_year || remoteExtra.graduationYear || fallback.graduationYear,
        highestQualification: data.highest_qualification || remoteExtra.highestQualification || fallback.highestQualification,
        currentRole: data.current_role || remoteExtra.currentRole || fallback.currentRole,
        company: data.company || remoteExtra.company || fallback.company,
        experience: data.experience || remoteExtra.experience || fallback.experience,
        targetIndustry: data.target_industry || remoteExtra.targetIndustry || fallback.targetIndustry,
        passoutYear: data.passout_year || remoteExtra.passoutYear || fallback.passoutYear,
        preferredLanguage: data.preferred_language || fallback.preferredLanguage || 'Tanglish',
        targetJobRole: data.target_job_role || remoteExtra.targetJobRole || fallback.targetJobRole,
        skills: data.skills || remoteExtra.skills || fallback.skills,
        avatarUrl: data.avatar_url || fallback.avatarUrl,
        loginCount: remoteExtra.loginCount !== undefined ? remoteExtra.loginCount : fallback.loginCount,
        isFirstLogin: remoteExtra.isFirstLogin !== undefined ? remoteExtra.isFirstLogin : fallback.isFirstLogin,
        lastLoginAt: remoteExtra.lastLoginAt || fallback.lastLoginAt,
        createdAt: data.created_at || fallback.createdAt
      };

      // Sync local storage with merged profile
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`acehire_user_profile_${mergedProfile.email.toLowerCase()}`, JSON.stringify(mergedProfile));
          localStorage.setItem('acehire_active_user', JSON.stringify(mergedProfile));
        } catch (e) {}
      }

      return mergedProfile;
    } catch (e) {
      console.warn('Supabase fetchProfile error:', e);
      return fallback;
    }
  }

  static async saveProfile(profile: UserProfile, userId?: string): Promise<boolean> {
    const cleanEmail = profile.email.trim().toLowerCase();
    
    // Save to LocalStorage immediately
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`acehire_user_profile_${cleanEmail}`, JSON.stringify(profile));
        localStorage.setItem('acehire_active_user', JSON.stringify(profile));
      } catch (e) {}
    }

    if (!isSupabaseConfigured()) return true;

    const targetId = userId || profile.id;
    const isUuid = typeof targetId === 'string' &&
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(targetId);

    if (!isUuid) {
      console.warn('⚠️ [saveProfile] Cannot save profile to Supabase: ID is not a valid UUID:', targetId);
      return false;
    }

    try {
      const payload: Record<string, any> = {
        id: targetId,
        name: profile.name,
        email: profile.email,
        phone: profile.phone || '',
        gender: profile.gender || '',
        user_status: profile.userStatus || 'College Student',
        school_name: profile.schoolName || '',
        stream: profile.stream || '',
        expected_completion_year: profile.expectedCompletionYear || '',
        college: profile.college || '',
        degree: profile.degree || '',
        department: profile.department || '',
        current_year: profile.currentYear || '',
        graduation_year: profile.graduationYear || '',
        highest_qualification: profile.highestQualification || '',
        current_role: profile.currentRole || '',
        company: profile.company || '',
        experience: profile.experience || '',
        target_industry: profile.targetIndustry || '',
        passout_year: profile.passoutYear || '',
        preferred_language: profile.preferredLanguage || 'Tanglish',
        target_job_role: profile.targetJobRole || '',
        skills: profile.skills || [],
        avatar_url: profile.avatarUrl,
        custom_profile_data: profile
      };

      const { data, error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' }).select();
      if (error) {
        console.error('❌ Supabase saveProfile DB Error:', error.message, error);
        return false;
      }
      console.log('✅ Profile successfully persisted in Supabase public.profiles:', data);
      return true;
    } catch (e) {
      console.error('💥 Supabase saveProfile exception:', e);
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
        selected_template: resume.selectedTemplate || 'modern',
        raw_data: resume
      };

      const { error } = await supabase.from('resume_data').upsert(payload);
      return !error;
    } catch (e) {
      console.warn('Supabase saveResume error:', e);
      return false;
    }
  }

  static async fetchResumesList(userId: string): Promise<ResumeData[]> {
    if (!isSupabaseConfigured() || !userId) return [];
    try {
      const { data } = await supabase
        .from('resume_data')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (data && data.length > 0) {
        return data.map((item: any) => item.raw_data as ResumeData);
      }
      return [];
    } catch (e) {
      console.warn('Supabase fetchResumesList error:', e);
      return [];
    }
  }

  // 4b. RESUME DRAFTS OPERATIONS (MID-WAY PROGRESS RESTORATION)
  static async fetchResumeDraft(userId: string) {
    if (!isSupabaseConfigured() || !userId) return null;
    try {
      const { data } = await supabase
        .from('resume_drafts')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (data && data.draft_data) {
        return {
          currentStep: data.current_step,
          isResumeCreated: data.is_resume_created,
          draftData: data.draft_data
        };
      }
      return null;
    } catch (e) {
      console.warn('Supabase fetchResumeDraft error:', e);
      return null;
    }
  }

  static async saveResumeDraft(userId: string, currentStep: number, isResumeCreated: boolean, draftData: any) {
    if (!isSupabaseConfigured() || !userId) return true;
    try {
      const payload = {
        user_id: userId,
        current_step: currentStep,
        is_resume_created: isResumeCreated,
        draft_data: draftData
      };
      await supabase.from('resume_drafts').upsert(payload, { onConflict: 'user_id' });
      return true;
    } catch (e) {
      console.warn('Supabase saveResumeDraft error:', e);
      return false;
    }
  }

  static async clearResumeDraft(userId: string) {
    if (!isSupabaseConfigured() || !userId) return true;
    try {
      await supabase.from('resume_drafts').delete().eq('user_id', userId);
      return true;
    } catch (e) {
      console.warn('Supabase clearResumeDraft error:', e);
      return false;
    }
  }

  // 4c. ATS ANALYSES OPERATIONS
  static async saveAtsAnalysis(userId: string, analysisResult: any, targetRole?: string, resumeId?: string) {
    if (!isSupabaseConfigured() || !userId) return null;
    try {
      const payload = {
        user_id: userId,
        resume_id: resumeId || null,
        target_role: targetRole || '',
        ats_score: analysisResult.atsScore || 0,
        matched_skills: analysisResult.matchedSkills || [],
        missing_skills: analysisResult.missingSkills || [],
        formatting_suggestions: analysisResult.formattingSuggestions || [],
        actionable_improvements: analysisResult.actionableImprovements || [],
        analysis_result: analysisResult
      };

      const { data } = await supabase.from('ats_analyses').insert(payload).select().single();
      return data;
    } catch (e) {
      console.warn('Supabase saveAtsAnalysis error:', e);
      return null;
    }
  }

  static async fetchAtsAnalyses(userId: string) {
    if (!isSupabaseConfigured() || !userId) return [];
    try {
      const { data } = await supabase
        .from('ats_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      return data || [];
    } catch (e) {
      console.warn('Supabase fetchAtsAnalyses error:', e);
      return [];
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
  static getStoredAptitudeUsedQuestions(userId?: string, category?: string, difficulty?: string): string[] {
    try {
      const key = `acehire_aptitude_used_${userId || 'guest'}_${category || 'all'}_${difficulty || 'all'}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static recordAptitudeUsedQuestions(userId: string | undefined, category: string, difficulty: string, questionHashes: string[]) {
    try {
      const key = `acehire_aptitude_used_${userId || 'guest'}_${category}_${difficulty}`;
      const existing = SupabaseService.getStoredAptitudeUsedQuestions(userId, category, difficulty);
      const combined = Array.from(new Set([...existing, ...questionHashes]));
      localStorage.setItem(key, JSON.stringify(combined));

      const allKey = `acehire_aptitude_used_${userId || 'guest'}_all_all`;
      const existingAll = SupabaseService.getStoredAptitudeUsedQuestions(userId, 'all', 'all');
      const combinedAll = Array.from(new Set([...existingAll, ...questionHashes]));
      localStorage.setItem(allKey, JSON.stringify(combinedAll));
    } catch (e) {
      console.warn('Failed recording used questions to localStorage:', e);
    }
  }

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

  static async saveAptitudeProgress(
    userId: string,
    category: string,
    score: number,
    difficulty?: string,
    totalQuestions?: number,
    correctCount?: number,
    timeTakenSeconds?: number,
    questionsUsed?: string[],
    attemptNumber?: number
  ) {
    if (questionsUsed && questionsUsed.length > 0) {
      SupabaseService.recordAptitudeUsedQuestions(userId, category, difficulty || 'Medium', questionsUsed);
    }

    if (!isSupabaseConfigured() || !userId) return null;
    try {
      const payload: any = {
        user_id: userId,
        category,
        difficulty: difficulty || 'Medium',
        score: Math.round(score),
        total_questions: totalQuestions || 0,
        correct_count: correctCount || 0,
        time_taken_seconds: timeTakenSeconds || 0,
        questions_used: questionsUsed || [],
        attempt_number: attemptNumber || 1
      };

      const { data, error } = await supabase.from('aptitude_progress').insert(payload).select().single();
      if (error) {
        console.warn('Supabase saveAptitudeProgress warning (retrying basic payload):', error.message);
        delete payload.questions_used;
        delete payload.attempt_number;
        const { data: fallbackData } = await supabase.from('aptitude_progress').insert(payload).select().single();
        return fallbackData;
      }
      return data;
    } catch (e) {
      console.warn('Supabase saveAptitudeProgress error:', e);
      return null;
    }
  }

  // 7. INTERVIEW_SESSIONS & INTERVIEW_ANSWERS TABLE OPERATIONS
  static async fetchInterviewSessions(userId: string) {
    if (!isSupabaseConfigured() || !userId) return [];
    try {
      const { data, error } = await supabase
        .from('interview_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data) return data;
      return [];
    } catch (e) {
      return [];
    }
  }

  static async saveInterviewSession(userId: string, sessionData: any) {
    if (!isSupabaseConfigured() || !userId) return null;
    try {
      const isUuid = (str?: string) =>
        typeof str === 'string' &&
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

      const payload: Record<string, any> = {
        user_id: userId,
        type: sessionData.selectedType || sessionData.type || 'Technical',
        difficulty: sessionData.difficulty || 'Medium',
        company: sessionData.company || 'AceHire Standard',
        questions_count: sessionData.activeQuestions?.length || sessionData.questions_count || 0,
        average_score: sessionData.averageScore || sessionData.score || 0,
        status: sessionData.sessionCompleted || sessionData.status === 'completed' ? 'completed' : 'in_progress',
        session_data: sessionData,
        final_report: sessionData.finalReport || sessionData.final_report || null
      };

      if (isUuid(sessionData.id)) {
        payload.id = sessionData.id;
      }

      const { data, error } = await supabase.from('interview_sessions').upsert(payload, { onConflict: 'id' }).select().single();
      if (error) {
        delete payload.id;
        const { data: fallbackData } = await supabase.from('interview_sessions').insert(payload).select().single();
        return fallbackData;
      }
      return data;
    } catch (e) {
      console.warn('Supabase saveInterviewSession error:', e);
      return null;
    }
  }

  static async saveInterviewAnswer(userId: string, sessionId: string, answerData: {
    questionId?: string;
    questionText: string;
    userAnswer: string;
    score: number;
    feedback: any;
  }) {
    if (!isSupabaseConfigured() || !userId) return null;
    try {
      const isUuid = (str?: string) =>
        typeof str === 'string' &&
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

      const payload: Record<string, any> = {
        user_id: userId,
        question_id: answerData.questionId || 'q-1',
        question_text: answerData.questionText,
        user_answer: answerData.userAnswer,
        score: Math.round(answerData.score || 0),
        feedback: answerData.feedback || {}
      };

      if (isUuid(sessionId)) {
        payload.session_id = sessionId;
      }

      const { data, error } = await supabase.from('interview_answers').insert(payload).select().single();
      if (error) console.warn('Supabase saveInterviewAnswer warning:', error.message);
      return data;
    } catch (e) {
      console.warn('Supabase saveInterviewAnswer error:', e);
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
      const payload = {
        user_id: userId,
        topic: sessionData.topic || 'General Practice',
        difficulty: sessionData.difficulty || 'Medium',
        score: Math.round(sessionData.score || sessionData.overallScore || 0),
        feedback: sessionData.feedback || {}
      };
      const { data, error } = await supabase.from('communication_progress').insert(payload).select().single();
      if (error) console.warn('Supabase saveCommunicationProgress warning:', error.message);
      return data;
    } catch (e) {
      console.warn('Supabase saveCommunicationProgress error:', e);
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

  static async fetchUserSettings(userId: string) {
    if (!isSupabaseConfigured() || !userId) return null;
    try {
      const { data } = await supabase
        .from('user_settings')
        .select('settings')
        .eq('user_id', userId)
        .maybeSingle();
      return data?.settings || null;
    } catch (e) {
      console.warn('Supabase fetchUserSettings error:', e);
      return null;
    }
  }

  static async saveUserSettings(userId: string, settings: any) {
    if (!isSupabaseConfigured() || !userId) return false;
    try {
      const payload = {
        user_id: userId,
        settings: settings
      };
      await supabase.from('user_settings').upsert(payload, { onConflict: 'user_id' });
      return true;
    } catch (e) {
      console.warn('Supabase saveUserSettings error:', e);
      return false;
    }
  }

  static async savePushSubscription(subData: {
    userId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent: string;
    createdAt: string;
  }): Promise<boolean> {
    // Always persist to local storage as client fallback
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('acehire_mobile_push_subscription', JSON.stringify(subData));
      } catch (e) {}
    }

    if (!isSupabaseConfigured()) {
      return true;
    }

    try {
      const payload = {
        user_id: subData.userId || 'anonymous-user',
        endpoint: subData.endpoint,
        p256dh: subData.p256dh,
        auth: subData.auth,
        user_agent: subData.userAgent,
        created_at: subData.createdAt
      };
      const { error } = await supabase.from('push_subscriptions').upsert(payload, { onConflict: 'endpoint' });
      if (error) {
        console.warn('Supabase savePushSubscription warning:', error.message);
      }
      return true;
    } catch (e) {
      console.warn('Supabase savePushSubscription error:', e);
      return false;
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
