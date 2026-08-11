# AGENTS.md - AceHire AI Development & Agent Guidelines

This document provides developer and AI agent guidelines for working on the **AceHire AI** project codebase. Follow these instructions strictly when maintaining, adding features, or debugging the codebase.

---

## 1. Project Overview

**AceHire AI** ("Smart Interview Simulator AI") is an AI-powered placement preparation ecosystem designed specifically for engineering and college students preparing for technical interviews and campus recruitment.

The platform provides a comprehensive suite of tools to bridge skill gaps across coding tests, technical and HR interviews, resume ATS evaluation, quantitative/logical aptitude, communication skills, and customized preparation roadmaps.

### Key Highlights
- **Dual-Language AI Feedback System**: Delivers actionable feedback in both standard **English** and accessible **Tanglish** (Tamil written in English script).
- **Offline / Local Mode Resilience**: Seamless fallback using a small set of predefined questions and mock operational modes when external backend or AI APIs are unconfigured or unavailable.

---

## 2. Current Technology Stack

| Layer | Technology / Library | Version / Details |
| :--- | :--- | :--- |
| **Frontend Framework** | React | `^18.3.1` (Single Page Application via Vite) |
| **Build System & Dev Server** | Vite | `^5.2.11` |
| **Language** | TypeScript | `^5.2.2` |
| **State Management** | React Context API | Configured in `src/context/AppContext.tsx` |
| **Styling & CSS** | Tailwind CSS, PostCSS, Autoprefixer | Tailwind `^3.4.3`, PostCSS `^8.4.38` |
| **UI Utilities** | Lucide React, Canvas Confetti, clsx, tailwind-merge | `lucide-react`, `canvas-confetti`, `clsx`, `tailwind-merge` |
| **Backend as a Service (BaaS)** | Supabase | `@supabase/supabase-js` (`^2.112.0`) - Auth & PostgreSQL DB |
| **AI Engine** | OpenRouter API | Primary AI provider, configured in `src/services/aiEngine.ts`. |
| **Linting** | ESLint | ESLint with React / TypeScript rules |

---

## 3. Frontend Architecture

The frontend is structured as a Single Page Application (SPA) built with React 18 and TypeScript.

### State Management & Navigation
- **Global Context**: State management is centralized in `src/context/AppContext.tsx` via `AppProvider` and the custom hook `useApp()`. It handles:
  - User authentication and profile state.
  - Active tab navigation state (`activeTab`).
  - User resume state, recent activity feeds, notifications, and dark mode configuration.
- **Dynamic View Routing**: Views are rendered dynamically within `src/App.tsx` (`MainContent` component) based on `activeTab`:
  - `'home'` / `'dashboard'` -> `src/components/Dashboard/DashboardView.tsx`
  - `'interview'` -> `src/components/Interview/MockInterviewView.tsx`
  - `'resume'` -> `src/components/Resume/ResumeView.tsx`
  - `'coding'` -> `src/components/Coding/CodingView.tsx`
  - `'aptitude'` -> `src/components/Aptitude/AptitudeView.tsx`
  - `'communication'` -> `src/components/Communication/CommunicationView.tsx`
  - `'roadmap'` -> `src/components/Roadmap/RoadmapView.tsx`
  - `'profile'` -> `src/components/Profile/ProfileView.tsx`
  - `'settings'` -> `src/components/Settings/SettingsView.tsx`
  - `'login'` -> `src/components/Auth/LoginPage.tsx`

### Layout Components
- **Navbar**: Top header with branding, user info, search bar, language toggle, and notification drop-down.
- **Sidebar**: Desktop navigation drawer.
- **BottomNav**: Mobile bottom navigation bar.
- **PersistentInterviewBanner**: Banner displayed during an active mock interview session allowing seamless navigation across tabs without abandoning an active session.

---

## 4. Backend and Supabase Usage

Supabase handles user authentication and backend database persistence.

### Configuration & Client Setup
- Client initialization resides in `src/services/supabaseClient.ts`.
- Configured using Vite environment variables:
  - `VITE_SUPABASE_URL` / `VITE_SUPABASE_PROJECT_URL`
  - `VITE_SUPABASE_ANON_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY`
- **Graceful Unconfigured Fallback**: `isSupabaseConfigured()` checks if valid keys are present. If unconfigured, the application falls back to predefined local data and mock response handlers without crashing.

### Database Tables (PostgreSQL)
The database schema is defined in `supabase/schema.sql`:
1. **`profiles`**: User profiles (id, name, email, college, department, preferred_language, avatar_url, created_at).
2. **`resumes`**: User resume entries, skills array, and ATS scores.
3. **`interview_sessions`**: Mock interview session metadata (type: HR/Technical, score, status).
4. **`interview_answers`**: Questions, candidate answers, English & Tanglish feedback explanations, grammar corrections, confidence scores.
5. **`coding_progress`**: Candidate code submissions, problem IDs, languages, complexity analysis, scores, and AI advice.
6. **`aptitude_progress`**: Category-wise test scores (Quantitative, Logical, Verbal).
7. **`learning_roadmap`**: Scheduled roadmap preparation tasks (Daily, Weekly, Monthly).

---

## 5. AI/API Integration

The core intelligence layer is located in `src/services/aiEngine.ts`.

### Primary Engine (OpenRouter API)
- **Primary AI Provider**: AceHire AI currently sends all AI requests through the **OpenRouter API** endpoint (`https://openrouter.ai/api/v1/chat/completions`). It is configured in `src/services/aiEngine.ts` via `fetchFromOpenRouter` and reads the API key from `VITE_OPENROUTER_API_KEY` (or fallback `VITE_API_KEY`).
- **Direct Gemini API History**: The direct Gemini API was used previously, but after its quota was exhausted, the application migrated to OpenRouter API as its primary provider.
- **Model Routing via OpenRouter**: Model identifiers specified in `OPENROUTER_LOWER_MODELS`—including Gemini (`google/gemini-2.0-flash-lite-001`, `google/gemini-flash-1.5-8b`), Llama (`meta-llama/llama-3.2-3b-instruct:free`), Mistral (`mistralai/mistral-7b-instruct:free`), Qwen (`qwen/qwen-2.5-7b-instruct`), DeepSeek (`deepseek/deepseek-r1-distill-llama-8b`), and OpenAI (`openai/gpt-4o-mini`)—are model names accessed **THROUGH** OpenRouter. Their presence in the model list does NOT mean the application is directly calling the Google Gemini API or OpenAI API.
- **Offline / Predefined Fallback**: When API keys are missing, quota is reached, or the server is offline, the app seamlessly falls back to a curated set of predefined questions and offline mock responses.

### Core AI Capabilities
- **Dual-Language Feedback Generation**: Simultaneous English and Tanglish explanations for candidate responses.
- **Mock Interview Generation & Evaluation**: Evaluates responses based on Relevance, Technical Accuracy, Grammar, Communication, Clarity, Completeness, and Professionalism.
- **Resume ATS Analysis**: Scores resume compatibility (0-100), extracts keywords, and highlights missing skills.
- **Coding Sandbox Assistant**: Generates dynamic coding challenges, analyzes code correctness, evaluates time/space complexity, and suggests optimal code improvements.
- **Aptitude Question Generator**: Dynamically generates Quant, Logical, and Verbal MCQs with detailed step-by-step reasoning.
- **Communication Coach**: Diagnoses grammar cases (`GIBBERISH`, `HAS_ERRORS`, `PERFECT_GRAMMAR`, `GRAMMAR_OK_CONTENT_UNRELATED`), highlights sentence errors, and suggests professional alternatives.

---

## 6. Important Project Features

1. **AI Mock Interview**: HR and Technical mock interview simulations with dual-language feedback.
2. **Resume Builder & ATS**: Visual resume editing coupled with AI ATS scoring and missing skill identification.
3. **Coding Practice**: Dynamic multi-language coding challenge platform supporting Java, Python, C, C++, and SQL with instant test results and AI review.
4. **Aptitude Practice**: Practice module for Quantitative, Logical, and Verbal reasoning with instant explanations in English and Tanglish.
5. **Communication Hub**: Interactive tool for sentence polishing, confidence evaluation, and grammar corrections.
6. **AI Learning Roadmap**: Dynamic preparation schedule (Daily, Weekly, Monthly action items).
7. **Offline / Local Mode Resilience**: Seamless operational fallback using predefined questions when external AI/API services are unconfigured or unavailable.

---

## 7. Project Folder Structure

```text
AceHireAI/
├── docs/
│   ├── Architecture.md        # Architecture overview and system diagram
│   └── PRD.md                 # Product requirements and module list
├── public/                    # Static assets
├── src/
│   ├── components/            # Modular feature components
│   │   ├── Aptitude/          # Aptitude module views and components
│   │   ├── Auth/              # Auth modal, login page, and user authentication
│   │   ├── Coding/            # Code editor sandbox and challenge views
│   │   ├── Common/            # Common UI elements (badges, cards, buttons)
│   │   ├── Communication/     # Grammar coach and communication components
│   │   ├── Dashboard/         # Dashboard view & analytics
│   │   ├── Interview/         # AI mock interview interface & evaluation views
│   │   ├── Navigation/        # Navbar, Sidebar, BottomNav, PersistentInterviewBanner
│   │   ├── Profile/           # Profile details management
│   │   ├── Resume/            # Resume editor & ATS analysis components
│   │   ├── Roadmap/           # Placement preparation roadmap view
│   │   ├── Settings/          # User settings & language preference selectors
│   │   └── Splash/            # Welcome splash screen
│   ├── context/
│   │   └── AppContext.tsx     # Global React Context provider and state hook
│   ├── services/
│   │   ├── aiEngine.ts        # AI engine integration service
│   │   └── supabaseClient.ts  # Supabase client setup, DB operations, & auth helpers
│   ├── styles/                # Global CSS styles
│   ├── types/
│   │   └── index.ts           # Type definitions and interfaces
│   ├── App.tsx                # Main App shell and dynamic view router
│   └── main.tsx               # Application entry point
├── supabase/
│   └── schema.sql             # PostgreSQL schema, table definitions, and RLS policies
├── .env.example               # Example environment configuration
├── .gitignore                 # Git ignore rules
├── index.html                 # Entry HTML document
├── package.json               # Package configuration & scripts
├── postcss.config.js          # PostCSS plugin setup
├── tailwind.config.js         # Tailwind CSS design system configuration
├── tsconfig.json              # TypeScript compiler settings
└── vite.config.js             # Vite bundler configuration
```

---

## 8. Coding Guidelines

- **TypeScript Strictness**: Define all data structures and domain types in `src/types/index.ts`. Avoid using explicit `any` types unless handling dynamic JSON parsing.
- **Component Architecture**: Keep components functional and modular. Store reusable UI primitives in `src/components/Common/`.
- **State Flow**: Use `useApp()` from `src/context/AppContext.tsx` for global state updates. Keep component-local UI state (e.g. input fields, local modal visibilities) inside component `useState`.
- **Error Handling**: Wrap external network calls (`aiEngine.ts` and `supabaseClient.ts`) in `try...catch` blocks and provide user-facing error fallbacks. Never let API failures freeze or crash the main UI shell.
- **Clean Imports**: Group imports logically (React dependencies first, shared context/types second, local components third, icons/utilities last).

---

## 9. UI/UX Guidelines

- **Modern Aesthetics**: Maintain the sleek dark/light theme using curated gradient palettes (e.g. `dark:from-[#0F172A] dark:via-[#1E1B4B] dark:to-[#2E1065]`) and refractive ambient lighting glows.
- **Responsive Layout**: Design mobile-first interfaces. Ensure views render cleanly across mobile viewports using `BottomNav` and desktop viewports using `Sidebar` and `Navbar`.
- **User Feedback & Interactivity**:
  - Show subtle hover states and smooth transitions (`transition-colors duration-300`).
  - Use skeleton indicators or loader icons during AI generation or API operations.
  - Use `canvas-confetti` to celebrate test completions and milestone achievements.
- **Iconography**: Standardize icons using `lucide-react`.

---

## 10. Database Guidelines

- **Schema Control**: The single source of truth for the database schema is `supabase/schema.sql`.
- **Primary Keys**: Always use UUID primary keys (`gen_random_uuid()` or `auth.users(id)`).
- **Foreign Key Constraints**: Include `ON DELETE CASCADE` when linking entity records back to `public.profiles(id)` or `auth.users(id)`.
- **Safe Migrations**: Write schema updates using safe migration commands like `ALTER TABLE public.<table_name> ADD COLUMN IF NOT EXISTS ...`.
- **Value Constraints**: Use SQL `CHECK` constraints to restrict enumerated columns (e.g. `CHECK (preferred_language IN ('English', 'Tanglish'))`).

---

## 11. Security Rules

- **Row Level Security (RLS)**: RLS must remain enabled on all tables in Supabase (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
- **Data Isolation**: Enforce security policies ensuring users can only read, insert, update, or delete their own data:
  ```sql
  CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
  ```
- **Environment Variables**: Never commit secrets, service role keys, or API tokens to source control. Always read configuration from environment variables (`import.meta.env`).
- **Input Sanitization**: Sanitize prompts and responses in `src/services/aiEngine.ts` to prevent broken JSON or markdown injection.

---

## 12. Testing and Validation Rules

- **Build Verification**: Run `npm run build` (`tsc && vite build`) to confirm zero TypeScript compilation or bundling errors before submitting changes.
- **Lint Verification**: Run `npm run lint` (`eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0`) to enforce code formatting and catch static issues.
- **Local Fallback Testing**: Ensure that components render and operate cleanly using predefined questions when Supabase or OpenRouter API keys are omitted.

---

## 13. Git Guidelines

- Keep commit messages concise, clear, and descriptive.
- Do not commit `.env`, build artifacts (`dist/`), node modules (`node_modules/`), or temporary files.
- Keep the project root clean and free of scratch files or unnecessary build dumps.

---

## 14. Rules to Preserve Existing Features and Avoid Unnecessary Changes

- **Preserve Dual-Language Logic**: Never remove or bypass the Dual-Language AI Feedback System (English & Tanglish).
- **Preserve App Routing & Context**: Do not break or alter the established tab navigation mechanism in `AppContext.tsx` or view routing in `App.tsx`.
- **Preserve Offline / Predefined Fallback**: Ensure the app retains predefined question sets when offline or when external AI API limits are exceeded.
- **Maintain Schema Compatibility**: Do not modify existing column names in Supabase schema without providing backward-compatible column mappings or fallback handlers in `supabaseClient.ts`.
- **Avoid Unnecessary Dependencies**: Use existing libraries (`lucide-react`, `canvas-confetti`, `clsx`, `tailwind-merge`, Tailwind CSS) rather than installing redundant UI libraries.
- **No Unused Technologies or Features**: Do not invent or add features not present in the project (e.g. no Placement Readiness Score, no company-specific interview flows like Zoho/TCS/Google/Microsoft/Amazon).
