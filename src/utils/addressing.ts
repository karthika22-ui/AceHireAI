import { UserProfile, LanguagePreference } from '../types';

/**
 * Utility function to determine the user-addressing term ("Bro", "Sis", or neutral "")
 * based on user profile gender and language preference.
 *
 * Rules:
 * - Language = Tanglish + Male   => "Bro"
 * - Language = Tanglish + Female => "Sis"
 * - Language = Tanglish + Neutral/Unknown => "" (neutral)
 * - Language = English => ""
 */
export function getUserAddressTerm(
  userProfile?: UserProfile | null | Partial<UserProfile>,
  language?: LanguagePreference | string
): string {
  const lang = (language || userProfile?.preferredLanguage || 'Tanglish').trim();
  
  if (lang !== 'Tanglish') {
    return '';
  }

  const rawGender = userProfile?.gender?.toString().trim().toLowerCase();

  if (!rawGender) {
    return '';
  }

  if (
    rawGender === 'male' ||
    rawGender === 'm' ||
    rawGender === 'boy' ||
    rawGender === 'man' ||
    rawGender === 'he'
  ) {
    return 'Bro';
  }

  if (
    rawGender === 'female' ||
    rawGender === 'f' ||
    rawGender === 'girl' ||
    rawGender === 'woman' ||
    rawGender === 'she'
  ) {
    return 'Sis';
  }

  return '';
}

/**
 * Utility function to format any Tanglish explanation text according to the user's address term.
 * Formats "Bro" / "Sis" / neutral addressing dynamically across all AI explanations.
 */
export function formatTanglishAddressing(
  text: string,
  userProfile?: UserProfile | null | Partial<UserProfile>,
  language?: LanguagePreference | string
): string {
  if (!text || typeof text !== 'string') return text || '';

  const lang = (language || userProfile?.preferredLanguage || 'Tanglish').trim();
  if (lang !== 'Tanglish') {
    // For English, ensure no stray "Bro," or "Sis," remains at start of sentences
    return text
      .replace(/^(Bro|Sis),\s*/i, '')
      .replace(/^(Bro|Sis)\s+/i, '');
  }

  const addressTerm = getUserAddressTerm(userProfile, lang);

  if (addressTerm === 'Sis') {
    // Convert all instances of Bro -> Sis
    return text
      .replace(/\bBro\b/g, 'Sis')
      .replace(/\bbro\b/g, 'sis')
      .replace(/\bBRO\b/g, 'SIS');
  }

  if (addressTerm === 'Bro') {
    // Convert all instances of Sis -> Bro
    return text
      .replace(/\bSis\b/g, 'Bro')
      .replace(/\bsis\b/g, 'bro')
      .replace(/\bSIS\b/g, 'BRO');
  }

  // Neutral Addressing (addressTerm === '') -> Remove "Bro, " / "Sis, " / "Super bro!" cleanly
  return text
    .replace(/^Super\s+(bro|sis)!/gi, 'Super!')
    .replace(/\bSuper\s+(bro|sis)\b/gi, 'Super')
    .replace(/^(Bro|bro|Sis|sis),\s*/g, '')
    .replace(/^(Bro|bro|Sis|sis)\s+/g, '')
    .replace(/([.!?])\s*(Bro|bro|Sis|sis),\s*/g, '$1 ')
    .replace(/([.!?])\s*(Bro|bro|Sis|sis)\s+/g, '$1 ')
    .replace(/\b(bro|sis)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
