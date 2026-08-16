import { ResumeData } from '../types';

export interface SavedResumeRecord {
  id: string;
  title: string;
  templateId: string;
  createdAt: string;
  updatedAt: string;
  data: ResumeData;
}

export const STORAGE_KEY_RESUMES_LIST = 'ACEHIRE_SAVED_RESUMES_LIST';
export const STORAGE_KEY_ACTIVE_RESUME_ID = 'ACEHIRE_ACTIVE_RESUME_ID';

/**
 * Get all saved resumes from local storage.
 */
export function getSavedResumesList(): SavedResumeRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RESUMES_LIST);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to read saved resumes list:', e);
  }
  return [];
}

/**
 * Save or update a resume record in the saved resumes list.
 */
export function saveResumeRecord(
  data: ResumeData,
  templateId: string = 'modern',
  existingId?: string
): SavedResumeRecord {
  const list = getSavedResumesList();
  const id = existingId || `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const title = data.fullName ? `${data.fullName}'s Resume` : 'Untitled Resume';
  const now = new Date().toISOString();

  const recordIndex = list.findIndex((r) => r.id === id);

  const newRecord: SavedResumeRecord = {
    id,
    title,
    templateId: templateId || data.selectedTemplate || 'modern',
    createdAt: recordIndex !== -1 ? list[recordIndex].createdAt : now,
    updatedAt: now,
    data: {
      ...data,
      selectedTemplate: templateId || data.selectedTemplate || 'modern'
    }
  };

  if (recordIndex !== -1) {
    list[recordIndex] = newRecord;
  } else {
    list.unshift(newRecord);
  }

  try {
    localStorage.setItem(STORAGE_KEY_RESUMES_LIST, JSON.stringify(list));
    localStorage.setItem(STORAGE_KEY_ACTIVE_RESUME_ID, id);
  } catch (e) {
    console.error('Failed to save resume record:', e);
  }

  return newRecord;
}

/**
 * Delete a specific resume record by ID.
 */
export function deleteResumeRecord(id: string): SavedResumeRecord[] {
  const list = getSavedResumesList();
  const updatedList = list.filter((r) => r.id !== id);

  try {
    localStorage.setItem(STORAGE_KEY_RESUMES_LIST, JSON.stringify(updatedList));
    const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE_RESUME_ID);
    if (activeId === id) {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_RESUME_ID);
    }
  } catch (e) {
    console.error('Failed to delete resume record:', e);
  }

  return updatedList;
}

/**
 * Get active resume ID from local storage.
 */
export function getActiveResumeId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY_ACTIVE_RESUME_ID);
}

/**
 * Set active resume ID in local storage.
 */
export function setActiveResumeId(id: string | null): void {
  if (typeof window === 'undefined') return;
  if (id) {
    localStorage.setItem(STORAGE_KEY_ACTIVE_RESUME_ID, id);
  } else {
    localStorage.removeItem(STORAGE_KEY_ACTIVE_RESUME_ID);
  }
}
