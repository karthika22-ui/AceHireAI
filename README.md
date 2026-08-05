# AceHire AI

## Project Overview
AceHire AI is an advanced, AI-powered placement preparation platform designed to help candidates ace their tech interviews. The platform provides a comprehensive suite of tools, including AI-driven mock interviews, resume ATS analysis, dynamic coding challenges, aptitude testing, and personalized placement roadmaps.

## Problem Statement
Preparing for tech placements involves multiple hurdles: mastering coding tests, performing well in technical interviews, ensuring a resume passes ATS checks, and communicating effectively. Candidates often lack personalized, constructive feedback to identify and bridge their skill gaps. AceHire AI solves this by acting as a personal AI placement mentor, offering real-time, actionable feedback across all stages of preparation.

## Key Features
- **AI Mock Interviews**: Conduct realistic mock interviews powered by Gemini AI.
- **Resume ATS Analysis**: Upload your resume for automated ATS scoring and optimization suggestions.
- **Dynamic Coding Challenges**: Practice AI-generated coding challenges with instant review and feedback.
- **Aptitude Preparation**: Take aptitude tests with dynamically generated questions.
- **Communication Assessment**: Get dual-language feedback (English & Tanglish) to improve communication skills.
- **Skill Gap Analysis**: Identify missing skills based on current trends and get recommendations.
- **Personalized Roadmaps**: Generate customized placement preparation roadmaps.
- **Dashboard**: Track overall progress and performance metrics.
- **Authentication**: Secure user authentication and profile management via Supabase.

## Tech Stack Used
- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS, PostCSS, Canvas Confetti (for animations), Lucide React (for icons)
- **Backend as a Service (BaaS)**: Supabase (Database & Authentication)
- **AI Engine**: Google Gemini API (`@google/genai`, `@google/generative-ai`)

## Frontend Architecture
The frontend is a Single Page Application (SPA) built with React and TypeScript, bootstrapped using Vite. 
- **State Management**: React Context API (`AppContext.tsx`) is used to manage global state such as authentication, active tabs, and theme configurations.
- **Routing**: Handled dynamically within the `AppShell` component, switching views (e.g., Dashboard, MockInterview, Coding) based on the active tab state.
- **Styling**: Tailwind CSS provides a robust utility-first design system with support for dark mode and complex gradient backgrounds.
- **Component Structure**: Highly modular, with feature-based directories under `src/components/` (e.g., Auth, Dashboard, Interview, Resume, Coding).

## Backend and Database Details
AceHire AI utilizes **Supabase** for its backend infrastructure.
- **Authentication**: User sign-up, login, and session management.
- **Database**: PostgreSQL database provided by Supabase to store user profiles, progress, and historical data.
- **Client Integration**: Interacts with the backend via `@supabase/supabase-js` configured in `src/services/supabaseClient.ts`.

## AI Integration Details
The core intelligence of the platform is driven by Google's Gemini models (e.g., `gemini-2.0-flash`). The AI integration logic resides in `src/services/aiEngine.ts` and handles:
- **Generative Tasks**: Creating dynamic aptitude questions, interview scenarios, and coding challenges.
- **Analysis & Feedback**: Evaluating code submissions, grading mock interview responses, and performing deep Resume/ATS parsing.
- **Natural Language Processing**: Offering culturally relevant "Dual-Language Feedback" (English and Tanglish) for communication improvements.

## Folder Structure
```text
acehire-ai/
├── src/
│   ├── components/      # Feature-based UI components (Auth, Dashboard, Coding, etc.)
│   ├── context/         # React Context providers (AppContext.tsx)
│   ├── services/        # External service integrations (aiEngine.ts, supabaseClient.ts)
│   ├── styles/          # Global styles
│   ├── types/           # TypeScript interfaces and type definitions
│   ├── App.tsx          # Main Application Shell
│   └── main.tsx         # React entry point
├── supabase/            # Supabase configuration & migrations
├── public/              # Static assets (if applicable)
├── .env.example         # Example environment variables
├── package.json         # Project dependencies and scripts
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
└── vite.config.js       # Vite bundler configuration
```

## Installation Steps
1. Clone the repository to your local machine.
2. Navigate to the project directory:
   ```bash
   cd acehire-ai
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```

## Environment Variable Setup
Create a `.env` file in the root of the project by copying the provided example:
```bash
cp .env.example .env
```
Populate the `.env` file with your specific API keys and configuration:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key

# AI Engine API Key
VITE_API_KEY=your-gemini-api-key
VITE_GEMINI_API_KEY=your-gemini-api-key
```

## How to Run the Project Locally
Once dependencies are installed and environment variables are configured, start the development server:
```bash
npm run dev
```
The application will typically be available at `http://localhost:5173` (or the port specified by Vite in your terminal).

## Deployment Details
The project can be built for production using Vite:
```bash
npm run build
```
This generates an optimized static bundle in the `dist` directory, which can be deployed to any static hosting provider (e.g., Vercel, Netlify, Firebase Hosting, GitHub Pages). The Supabase backend remains hosted on the Supabase platform, requiring only the correct environment variables in the production environment.

## Future Enhancements
- **Multi-User Collaboration**: Live peer-to-peer mock interviews.
- **Advanced Code Execution**: Secure, sandboxed remote code execution for compiling and running more complex multi-file projects.
- **Extended AI Models**: Integration with other LLMs for diverse interview persona simulations.
- **Analytics Dashboard**: More granular insights and visual charts detailing user growth over time.
