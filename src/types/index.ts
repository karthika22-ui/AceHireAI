export type LanguagePreference = 'English' | 'Tanglish';

export type UserStatus =
  | 'Plus Two Student'
  | 'College Student'
  | 'Graduate'
  | 'Postgraduate'
  | 'Working Professional'
  | 'Job Seeker';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  gender?: 'Male' | 'Female' | 'Other' | string;
  userStatus?: UserStatus;

  // Plus Two Student Fields
  schoolName?: string;
  stream?: string;
  expectedCompletionYear?: string;

  // College / Graduate / Postgraduate Fields
  college?: string;
  degree?: string;
  department?: string;
  currentYear?: string;
  graduationYear?: string;

  // Working Professional / Job Seeker Fields
  highestQualification?: string;
  currentRole?: string;
  company?: string;
  experience?: string;
  targetIndustry?: string;
  passoutYear?: string;

  // General Placement & Skill Fields
  preferredLanguage: LanguagePreference;
  targetJobRole?: string;
  skills?: string[];

  avatarUrl?: string;
  loginCount?: number;
  isFirstLogin?: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface ReadinessScore {
  overall: number; // 0 to 100
  resume: number;
  coding: number;
  aptitude: number;
  interview: number;
  communication: number;
  lastUpdated: string;
}

export type InterviewType = 'HR' | 'Technical' | 'Company';

export interface InterviewQuestion {
  id: string;
  category: InterviewType;
  company?: string;
  question: string;
  contextHint: string;
  expectedKeypoints: string[];
}

export type AnswerEvaluationStatus = 'Correct' | 'Partially Correct' | 'Incorrect' | 'Unrelated Answer';

export interface DetailedMistake {
  type: string;
  explanation: string;
}

export type GrammarEvaluationCase = 
  | 'GIBBERISH' 
  | 'HAS_ERRORS' 
  | 'PERFECT_GRAMMAR' 
  | 'GRAMMAR_OK_CONTENT_UNRELATED' 
  | 'GRAMMAR_ERRORS_AND_CONTENT_UNRELATED';

export interface GrammarMistakeDetail {
  yourSentence: string;
  incorrectPart: string;
  correctVersion: string;
  reason: string;
  tanglishReason: string;
}

export interface DetailedGrammarReport {
  grammarCase: GrammarEvaluationCase;
  statusHeader: string;
  statusSubtext?: string;
  gibberishReason?: string;
  gibberishSuggestion?: string;
  mistakes: GrammarMistakeDetail[];
  contentStatusMessage?: string;
}

export interface CameraMetric {
  title: string;
  rating: string;
  score: number;
  evidence: string;
  suggestion?: string;
}

export interface CameraAnalysisResult {
  isCameraOn: boolean;
  notice?: string;
  eyeContact?: CameraMetric;
  facialExpression?: CameraMetric;
  posture?: CameraMetric;
  movement?: CameraMetric;
  overallVisualPresence?: CameraMetric;
}

export interface DualLanguageFeedback {
  // AI Evaluation Status & Explanation
  status: AnswerEvaluationStatus;
  statusExplanation: string;
  mistakes: DetailedMistake[];
  correctProfessionalAnswer: string;
  explanationText: string;
  grammarReport: DetailedGrammarReport;
  grammarDetail?: GrammarMistakeDetail[];

  // Breakdown Score Factors & Explanation
  relevanceScore: number | null;
  technicalAccuracyScore: number | null;
  grammarScore: number | null;
  vocabularyScore?: number | null;
  communicationScore: number | null;
  clarityScore: number | null;
  completenessScore: number | null;
  professionalismScore: number | null;
  overallScore: number;
  scoreExplanation: string;

  // Camera & Visual Analysis (Optional, present when camera is ON)
  cameraAnalysis?: CameraAnalysisResult | null;

  // Legacy Compatibility Fields
  englishExplanation: string;
  tanglishExplanation: string;
  grammarCorrections: string[];
  vocabularySuggestions: string[];
  improvedAnswer: string;
  confidenceScore: number; // 0 to 100
  communicationRating: 'Excellent' | 'Good' | 'Needs Work';
}

export interface InterviewSession {
  id: string;
  date: string;
  type: InterviewType;
  company?: string;
  questionsCount: number;
  averageScore: number;
  status: 'completed' | 'in_progress';
}

export interface SavedInterviewState {
  id: string;
  selectedType: 'HR' | 'Technical';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  currentQuestionIndex: number;
  activeQuestions: InterviewQuestion[];
  userAnswer: string;
  timerSeconds: number;
  recSeconds?: number;
  cameraActive?: boolean;
  micMuted?: boolean;
  answersHistory: {
    question: InterviewQuestion;
    userAnswer: string;
    feedback: DualLanguageFeedback;
  }[];
  sessionActive?: boolean;
  savedAtTimestamp?: number;
  timestamp: string;
}

export interface InterviewFinalReport {
  overallScore: number;
  technicalScore: number;
  grammarScore: number;
  communicationScore: number;
  confidenceScore: number;
  relevanceScore: number;
  strengths: string[];
  weaknesses: string[];
  mistakes: DetailedMistake[];
  recommendedTopics: string[];
  aiSuggestions: string[];
}

export interface InterviewAnswerSubmission {
  questionId: string;
  questionText: string;
  userAnswer: string;
  feedback: DualLanguageFeedback;
}

export interface EducationEntry {
  degree: string;
  institution: string;
  university?: string;
  department?: string;
  location?: string;
  startYear?: string;
  endYear?: string;
  graduationYear?: string;
  cgpa: string;
}

export interface ProjectEntry {
  title: string;
  description: string;
  techStack: string[];
  keyContributions?: string;
  gitHubUrl?: string;
  demoUrl?: string;
}

export interface InternshipEntry {
  role: string;
  company: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  duration: string;
  description: string;
}

export interface CertificationEntry {
  title: string;
  issuer?: string;
  year?: string;
  date?: string;
  credentialUrl?: string;
}

export interface LanguageProficiency {
  language: string;
  proficiency: string;
}

export interface AdditionalLink {
  platform: string;
  url: string;
}

export interface ResumeData {
  fullName: string;
  professionalTitle?: string;
  email: string;
  phone: string;
  location: string;
  linkedIn?: string;
  gitHub?: string;
  portfolio?: string;
  summary: string;
  atsScore?: number;
  education: EducationEntry[];
  skills: string[];
  programmingLanguages?: string[];
  webTechnologies?: string[];
  frameworksLibraries?: string[];
  databases?: string[];
  toolsAndTech?: string[];
  otherSkills?: string[];
  technicalSkills?: string[];
  projects: ProjectEntry[];
  experience: InternshipEntry[];
  certifications?: CertificationEntry[];
  achievements?: string[];
  leadership?: string[];
  clubsVolunteering?: string[];
  extracurriculars?: string[];
  workshops?: string[];
  languages?: LanguageProficiency[];
  additionalLinks?: AdditionalLink[];
  selectedTemplate?: string;
  photoUrl?: string;
}

export interface KeywordAnalysis {
  detectedKeywords: string[];
  weakKeywords: string[];
  keywordSuggestions: string[];
}

export interface AchievementAnalysis {
  hasMetrics: boolean;
  actionVerbsRating: 'Strong' | 'Moderate' | 'Weak' | 'N/A';
  score: number | null;
  feedback: string;
}

export interface ImprovedResumeResult {
  originalScore: number;
  improvedScore: number; // Targets ~98-99%
  improvedResumeText: string;
  improvedResumeData?: ResumeData;
  enhancementsApplied: string[];
  keywordBoosts: string[];
  scoreIncrease: number;
}

export interface ResumeAnalysis {
  atsScore: number; // 0 to 100
  strengths?: string[];
  detectedSkills?: string[];
  keywordAnalysis?: KeywordAnalysis;
  summary?: string;
  formattingSuggestions: string[];
  grammarReview?: string[];
  achievementAnalysis?: AchievementAnalysis;
  actionableImprovements: {
    section: string;
    issue: string;
    recommendation: string;
  }[];
  improvementChecklist?: string[];
  improvedResult?: ImprovedResumeResult;

  // Legacy field support for backwards-compatibility
  matchedSkills: string[];
  missingSkills: string[];
}

export type CodingLanguage = 'Java' | 'Python' | 'C' | 'C++' | 'SQL';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface CodingChallenge {
  id: string;
  title: string;
  language: CodingLanguage;
  difficulty: DifficultyLevel;
  description: string;
  inputFormat?: string;
  outputFormat?: string;
  explanation?: string;
  starterCode: string;
  sampleInput: string;
  sampleOutput: string;
  constraints: string[];
  testCases: Array<{
    input: string;
    expectedOutput: string;
  }>;
}

export interface CodingSubmissionResult {
  status: 'Success' | 'Failed Test Cases' | 'Compilation Error';
  passed: boolean;
  score: number;
  executionTimeMs: number;
  passedTestCasesCount?: number;
  totalTestCasesCount?: number;
  errorMessage?: string;
  aiCodeReview?: {
    timeComplexity: string;
    spaceComplexity: string;
    optimizations: string[];
    englishAdvice: string;
    tanglishAdvice: string;
  };
}

export type AptitudeCategory = 'Quantitative' | 'Logical' | 'Verbal';

export interface AptitudeQuestion {
  id: string;
  category: AptitudeCategory;
  difficulty: DifficultyLevel;
  question: string;
  options: string[];
  correctIndex: number;
  explanationEnglish: string;
  explanationTanglish: string;
}

export interface RoadmapTask {
  id: string;
  period: 'Daily' | 'Weekly' | 'Monthly';
  title: string;
  description: string;
  completed: boolean;
  category: 'Resume' | 'Coding' | 'Interview' | 'Aptitude' | 'Communication';
  dueDate: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'interview' | 'coding' | 'resume' | 'general';
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  isUnlocked: boolean;
}

export interface UserSettings {
  notifications: {
    dailyPracticeReminder: boolean;
    mockInterviewReminder: boolean;
    codingPracticeReminder: boolean;
    aptitudePracticeReminder: boolean;
  };
  appearance: {
    theme: 'dark' | 'light' | 'system';
    accentColor: 'blue' | 'purple' | 'emerald' | 'amber' | 'pink';
    reduceAnimations: boolean;
  };
  language: {
    defaultExplanation: LanguagePreference;
    autoVoicePlayback: boolean;
    speechSpeed: number; // 0.5 to 1.5
  };
  security: {
    twoFactorEnabled: boolean;
    supabaseSync: boolean;
  };
}

export const DEFAULT_SETTINGS: UserSettings = {
  notifications: {
    dailyPracticeReminder: true,
    mockInterviewReminder: true,
    codingPracticeReminder: true,
    aptitudePracticeReminder: true
  },
  appearance: {
    theme: 'dark',
    accentColor: 'purple',
    reduceAnimations: false
  },
  language: {
    defaultExplanation: 'English',
    autoVoicePlayback: true,
    speechSpeed: 1.0
  },
  security: {
    twoFactorEnabled: false,
    supabaseSync: true
  }
};
