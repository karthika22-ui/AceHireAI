# SKILLS.md - AceHire AI Technical Skills & Capabilities Matrix

This document provides a comprehensive overview of the technical skills, frameworks, tools, database structures, AI capabilities, and development competencies used in the **AceHire AI** placement preparation ecosystem.

---

## 1. Project Identity

- **Project Name**: AceHire AI
- **Application Type**: Single Page Application (SPA) - Placement Preparation Ecosystem
- **Target Audience**: Engineering & College Students preparing for campus recruitment and technical interviews

---

## 2. Frontend Development Skills

- **React 18**: Component-based architecture utilizing React Hooks (`useState`, `useEffect`, `useContext`, `useCallback`, `useMemo`).
- **TypeScript 5.2**: Strict static typing across all components, hooks, and services with centralized domain interfaces defined in `src/types/index.ts`.
- **Vite 5.2**: High-performance dev server, hot module replacement (HMR), and optimized production bundler.
- **State Management**: Centralized React Context API via `AppProvider` and custom `useApp()` hook in `src/context/AppContext.tsx` for global user, authentication, tab state, and theme settings.
- **Dynamic View Routing**: Tab-based navigation system in `src/App.tsx` handling views:
  - `dashboard` / `home`: `src/components/Dashboard/DashboardView.tsx`
  - `interview`: `src/components/Interview/MockInterviewView.tsx`
  - `resume`: `src/components/Resume/ResumeView.tsx`
  - `coding`: `src/components/Coding/CodingView.tsx`
  - `aptitude`: `src/components/Aptitude/AptitudeView.tsx`
  - `communication`: `src/components/Communication/CommunicationView.tsx`
  - `roadmap`: `src/components/Roadmap/RoadmapView.tsx`
  - `profile`: `src/components/Profile/ProfileView.tsx`
  - `settings`: `src/components/Settings/SettingsView.tsx`
  - `login`: `src/components/Auth/LoginPage.tsx`
- **Responsive Layout & Navigation**: Mobile-first design supporting mobile navigation (`BottomNav`), desktop navigation (`Sidebar`, `Navbar`), and session-persistent elements (`PersistentInterviewBanner`).
- **Styling & Design System**: Tailwind CSS 3.4, PostCSS, and Autoprefixer utilizing curated dark/light gradient palettes, glows, and smooth transitions.
- **UI Utilities**: `lucide-react` for standard icons, `canvas-confetti` for milestone celebrations, `clsx` and `tailwind-merge` for conditional class combining.

---

## 3. Backend & Database Skills

- **Supabase BaaS**: Backend client integration via `@supabase/supabase-js` (`src/services/supabaseClient.ts`).
- **PostgreSQL Database**: Relational schema managed in `supabase/schema.sql`.
- **Database Tables**:
  - `public.profiles`: User profile metadata (id, name, email, college, department, preferred_language, avatar_url).
  - `public.resumes`: Saved resumes, skills array, and ATS scores.
  - `public.interview_sessions`: Mock interview session metadata (HR/Technical, score, status).
  - `public.interview_answers`: Individual interview Q&As, confidence scores, grammar corrections, and dual-language explanations.
  - `public.coding_progress`: Submission history, problem IDs, languages, complexity analysis, and scores.
  - `public.aptitude_progress`: Category-wise test scores (Quantitative, Logical, Verbal).
  - `public.learning_roadmap`: Preparation tasks (Daily, Weekly, Monthly).
- **Row Level Security (RLS)**: Enforced data access policies restricting data modification to authorized users (`auth.uid() = id`).
- **Safe Migrations**: Idempotent schema modifications using `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.

---

## 4. AI & API Integration Skills

- **OpenRouter API Integration**: Primary AI API provider configured in `src/services/aiEngine.ts`. AceHire AI sends AI completion requests directly to `https://openrouter.ai/api/v1/chat/completions` via `fetchFromOpenRouter`, reading the API key from `VITE_OPENROUTER_API_KEY` (or `VITE_API_KEY`).
- **Model Support via OpenRouter**: The application routes prompts across multiple LLMs defined in `OPENROUTER_LOWER_MODELS`, including Google Gemini (`google/gemini-2.0-flash-lite-001`, `google/gemini-flash-1.5-8b`), Meta Llama (`meta-llama/llama-3.2-3b-instruct:free`), Mistral (`mistralai/mistral-7b-instruct:free`), Qwen (`qwen/qwen-2.5-7b-instruct`), DeepSeek (`deepseek/deepseek-r1-distill-llama-8b`), and OpenAI (`openai/gpt-4o-mini`). Note that these models are accessed **THROUGH** OpenRouter; the application is NOT directly calling the Gemini API or OpenAI API (the direct Gemini API was used previously, but its quota was exhausted).
- **Dual-Language Feedback System**: AI engine skill delivering feedback in standard **English** and accessible **Tanglish** (Tamil written in English script).
- **Offline & Predefined Question Fallback**: Maintains a robust predefined question bank and mock fallback generator in `aiEngine.ts` when API keys are unconfigured or calls fail.
- **Structured JSON Parsing**: Sanitizes LLM outputs to reliably return typed JSON payloads for application state.

---

## 5. Programming Languages

- **TypeScript / JavaScript**: Core development language for frontend UI, state hooks, and API integrations.
- **HTML5 & CSS3**: Semantic HTML structure and Tailwind-based styling.
- **Coding Practice Languages**:
  - Java
  - Python
  - C
  - C++
  - SQL

---

## 6. Frameworks & Installed Libraries

| Package | Role / Capability |
| :--- | :--- |
| `react` / `react-dom` (`^18.3.1`) | UI rendering and component architecture |
| `vite` (`^5.2.11`) | Build system & development environment |
| `typescript` (`^5.2.2`) | Type safety and domain interface enforcement |
| `@supabase/supabase-js` (`^2.112.0`) | Authentication & PostgreSQL database management |
| `tailwindcss` (`^3.4.3`) | Utility-first responsive styling framework |
| `lucide-react` (`^0.378.0`) | Icon set for UI components |
| `canvas-confetti` (`^1.9.4`) | Visual feedback animations for user achievements |
| `clsx` & `tailwind-merge` | Utility functions for merging Tailwind CSS classes |

---

## 7. Authentication & Database Capabilities

- **User Authentication**: Supabase authentication flow supporting registration, login, and session restoration.
- **Profile Customization**: Language preference selection (`English` vs `Tanglish`), department, college, and user profile management.
- **Data Persistence**: Safe store and fetch methods in `supabaseClient.ts` for saving interview rounds, coding submissions, resume ATS analysis, and aptitude test scores.

---

## 8. Resume & ATS Functionality

- **Visual Resume Builder**: Interactive form editing for personal information, summaries, and skill tag lists.
- **AI ATS Analyzer**: Evaluates candidate resumes, produces an ATS compatibility score (0-100), extracts keywords, and highlights missing skills necessary for placement success.
- **Database Persistence**: Stores resume records in `public.resumes`.

---

## 9. Coding Practice Functionality

- **Interactive Code Editor Sandbox**: Workspace supporting Java, Python, C, C++, and SQL code drafting.
- **Test Case Execution**: Evaluates code correctness and returns instant test feedback.
- **AI Code Review**: Analyzes code submissions for time and space complexity ($O(N)$, $O(1)$, etc.) and delivers actionable improvement advice in English and Tanglish.
- **Submission History**: Records code progress in `public.coding_progress`.

---

## 10. Aptitude Functionality

- **Three Core Reasoning Categories**:
  - Quantitative Aptitude
  - Logical Reasoning
  - Verbal Reasoning
- **Interactive Practice**: MCQ quiz interface with immediate scoring and progress tracking stored in `public.aptitude_progress`.
- **Step-by-Step AI Explanations**: Provides detailed step-by-step reasoning in both English and Tanglish.

---

## 11. Communication Functionality

- **Communication Coach**: Grammar evaluation tool for analyzing user-submitted sentences.
- **Grammar Diagnosis Classifications**: Categorizes input responses into `GIBBERISH`, `HAS_ERRORS`, `PERFECT_GRAMMAR`, or `GRAMMAR_OK_CONTENT_UNRELATED`.
- **Sentence Enhancer**: Highlights grammatical mistakes, calculates confidence scores, and provides polished professional sentence alternatives.

---

## 12. AI Learning Roadmap

- **Personalized Schedule Generation**: Produces placement preparation roadmaps tailored to user timeline goals.
- **Task Periodicity**: Categorizes preparation tasks into Daily, Weekly, and Monthly action items.
- **Interactive Progress Tracking**: Checkbox task completion backed by database persistence in `public.learning_roadmap`.

---

## 13. Offline & Local Fallback Resilience

- **Predefined Question Bank**: Integrated offline question library used when external AI APIs or database services are unreachable or unconfigured.
- **Graceful Unconfigured Fallback**: `isSupabaseConfigured()` check prevents crashes when env keys are missing, seamlessly redirecting state to mock local handlers.
- **Resilient AI Fallbacks**: Fallback handlers generate structured dual-language responses offline when API limits or quotas are exceeded.

---

## 14. Testing & Debugging Capabilities

- **Build Verification**: `npm run build` (`tsc && vite build`) to confirm TypeScript compilation without bundling errors.
- **Static Analysis & Linting**: `npm run lint` (`eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0`) to maintain strict code style and prevent potential runtime bugs.
- **Offline Mode Verification**: Testing UI rendering and mock data handling when network connection or API credentials are removed.

---

## 15. Git, GitHub & Deployment Capabilities

- **Git Version Control**: Clean commit history, branch management, and rebase synchronization (`git pull --rebase`).
- **Environment Confidentiality**: Secret key protection via `.env` file management, ensuring API tokens and Supabase keys are excluded from git index via `.gitignore`.
- **Production Asset Bundling**: Vite asset compilation generating optimized static files in `dist/` ready for web deployment.
