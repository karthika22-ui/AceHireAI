import { UserProfile, ResumeData, ReadinessScore } from '../types';

export interface ActivityItem {
  id: string;
  title: string;
  type: string;
  score: string;
  time: string;
  timestamp?: number;
  targetTab?: string;
}

export const getUserStorageKey = (email: string | undefined, baseKey: string): string => {
  const currentEmail = email || localStorage.getItem('acehire_current_user_email') || '';
  if (!currentEmail.trim()) {
    return `acehire_guest_${baseKey}`;
  }
  const userHash = btoa(currentEmail.toLowerCase().trim()).replace(/[^a-zA-Z0-9]/g, '');
  return `acehire_user_${userHash}_${baseKey}`;
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
    year: 'Final Year (2026)',
    dreamCompany: 'Zoho',
    preferredLanguage: 'Tanglish',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString()
  };
};

export const INITIAL_READINESS: ReadinessScore = {
  overall: 0,
  resume: 0,
  coding: 0,
  aptitude: 0,
  interview: 0,
  communication: 0,
  lastUpdated: 'Never'
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

export class SupabaseService {
  static getProfile(email?: string): UserProfile {
    const key = getUserStorageKey(email, 'profile');
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    const currentEmail = email || localStorage.getItem('acehire_current_user_email') || '';
    return getInitialProfileForEmail(currentEmail || 'student@college.edu');
  }

  static saveProfile(profile: UserProfile, email?: string): void {
    const targetEmail = email || profile.email;
    const key = getUserStorageKey(targetEmail, 'profile');
    localStorage.setItem(key, JSON.stringify(profile));
  }

  static getReadinessScore(email?: string): ReadinessScore {
    const key = getUserStorageKey(email, 'readiness_scores');
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_READINESS;
      }
    }
    return INITIAL_READINESS;
  }

  static saveReadinessScore(score: ReadinessScore, email?: string): void {
    const key = getUserStorageKey(email, 'readiness_scores');
    localStorage.setItem(key, JSON.stringify(score));
  }

  static getResume(email?: string): ResumeData {
    const key = getUserStorageKey(email, 'resume_data');
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    const currentEmail = email || localStorage.getItem('acehire_current_user_email') || '';
    return getInitialResumeForEmail(currentEmail || 'student@college.edu');
  }

  static saveResume(resume: ResumeData, email?: string): void {
    const targetEmail = email || resume.email;
    const key = getUserStorageKey(targetEmail, 'resume_data');
    localStorage.setItem(key, JSON.stringify(resume));
  }

  static getRecentActivities(email?: string): ActivityItem[] {
    const key = getUserStorageKey(email, 'recent_activities');
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  static addRecentActivity(activity: ActivityItem, email?: string): ActivityItem[] {
    const current = this.getRecentActivities(email);
    const updated = [activity, ...current.slice(0, 49)];
    const key = getUserStorageKey(email, 'recent_activities');
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  }

  static clearRecentActivities(email?: string): void {
    const key = getUserStorageKey(email, 'recent_activities');
    localStorage.removeItem(key);
  }
}
