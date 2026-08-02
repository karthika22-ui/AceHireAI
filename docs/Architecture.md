# AceHire AI - Technical Architecture Document

## Architecture Pattern
AceHire AI uses a decoupled client-server & pub-sub event architecture.

```
                    User Interface (React 18 + Vite)
                                 │
     ┌───────────────────────────┴───────────────────────────┐
     ▼                                                       ▼
AI Agent Service (Local/API)                         Supabase Client / Store
 - Dual-Language Engine                               - Profiles & Auth
 - Resume ATS Scorer                                  - Interview Records
 - Coding Reviewer                                    - Readiness Index
```

## AI Agent Ecosystem
1. **Resume Agent**: Scans keywords and generates ATS compatibility metrics.
2. **Interview Agent**: Conducts HR, Technical, and Company mock rounds.
3. **Communication Agent**: Evaluates grammar, confidence score, and returns English & Tanglish explanations.
4. **Learning Roadmap Agent**: Adapts daily/weekly tasks dynamically.
5. **Placement Readiness Score Engine**: Combines domain metrics into unified index.
