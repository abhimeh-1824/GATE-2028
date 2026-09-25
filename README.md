# GATE DA 2028 Academic Study Portal & Performance Tracker

An academic-grade, cognitive-science-driven study tracking and active-recall portal built specifically for candidates targeting **AIR 1–50** in **GATE Data Science & Artificial Intelligence (GATE DA 2028)**.

---

## 🎯 Target Aspirant Focus

- **Benchmark Destinations:** IISc Bangalore (M.Tech in AI), IIT Bombay (M.Tech in CS/AI), IIT Delhi, IIT Madras.
- **Core Methodology:**
  1. **Cognitive Spaced Repetition:** Automated needs-revision queue tracking confidence scores (1–5 stars) to mitigate the Ebbinghaus forgetting curve.
  2. **KaTeX Proof & Formula Vault:** 36 high-yield theorems rendered in KaTeX math notation, raw LaTeX, and plain text, complete with dual Blackboard/Paper views and dangerous examiner trap alerts.
  3. **100-Mark CBT Mock Analytics:** Diagnostic scoring, percentile prediction, and MSQ (Multiple Select Question) accuracy isolation where zero partial marking applies.
  4. **Integrated Pomodoro Focus Timer:** 25-minute deep focus sprints with audio feedback and automatic study-hour logging.

---

## 🏛️ Application Architecture

```
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   └── ErrorBoundary.tsx          # Global runtime error recovery
│   │   ├── modals/
│   │   │   ├── AuthModal.tsx              # Supabase sign-in, registration & demo access
│   │   │   ├── FormulaVaultModal.tsx      # KaTeX theorem explorer with dual blackboard/paper
│   │   │   ├── PlatformTourModal.tsx      # 8-step interactive walkthrough guide
│   │   │   ├── OmniboxModal.tsx           # ⌘K instant search across all 85 topics
│   │   │   ├── AddTaskModal.tsx           # Priority-tagged daily task scheduler
│   │   │   └── BackupModal.tsx            # Schema-validated JSON export/import
│   │   ├── views/
│   │   │   ├── LandingPageView.tsx        # Public home page & unauthenticated portal gate
│   │   │   ├── DashboardView.tsx          # Weekly pace, revision queues, and high-yield topics
│   │   │   ├── DailyView.tsx              # Focus sprint manager and task execution
│   │   │   ├── WeeklyView.tsx             # 7-day retrospective and subject distribution
│   │   │   ├── SubjectsView.tsx           # 8-subject syllabus tree, lectures & resources
│   │   │   ├── RoadmapView.tsx            # 4-year strategic phase milestones
│   │   │   ├── AnalyticsView.tsx          # Accuracy curves and study volume telemetry
│   │   │   ├── CalendarView.tsx           # Dynamic calendar and milestone scheduler
│   │   │   ├── PeerCompareView.tsx        # Verified aspirant cohort benchmarks
│   │   │   └── GuideView.tsx              # Canonical preparation blueprint & strategies
│   │   ├── Sidebar.tsx                    # Responsive desktop sidebar + mobile slide-over drawer
│   │   └── TopBar.tsx                     # Responsive timer, ⌘K search & unified profile menu
│   ├── context/
│   │   └── StudyContext.tsx               # Centralized state, Supabase auth sync & timers
│   ├── data/
│   │   ├── gateDaSyllabus.ts              # 8 subjects, 85 micro-topics & official weightages
│   │   └── formulasData.ts                # 36 KaTeX theorems, proofs & trap definitions
│   └── lib/
│       ├── supabase.ts                    # Supabase client configuration
│       ├── supabaseService.ts             # Auth, user-scoped revision queries & DB sync
│       └── peerProgressService.ts         # Privacy-preserving peer progress benchmarks
└── server.ts                              # Express server with sanitized sync endpoints
```

---

## 🔐 Authentication & Access Model

- **Public Home Page:** Anyone visiting the app sees the public **Landing Page** highlighting syllabus weightages, the KaTeX formula vault, and strategic roadmap. Unauthenticated visitors cannot enter or view internal study data.
- **Session Gating:** The portal workspace is strictly gated behind verified user authentication via Supabase Auth or instant guest trial demo.
- **Privacy:** Aspirant profiles in the peer benchmarking hub mask personal emails and protect student privacy.
- **Zero Raw Database Tasks:** Database operations run quietly in the background without confronting the student with raw database connection tasks.

---

## 📚 8-Subject Curriculum & Weightage Breakdown

| Code | Subject | GATE DA Weightage | Focus Priority |
| :--- | :--- | :---: | :---: |
| **P&S** | Probability & Statistics | 18% – 22% | Extreme (Foundational) |
| **LA** | Linear Algebra | 14% – 16% | Extreme (Foundational) |
| **ML** | Machine Learning | 18% – 20% | Extreme (Core DA) |
| **GA** | General Aptitude | 15% | Extreme (Scoring Anchor) |
| **DSA** | Programming & DSA (Python) | 12% – 14% | High |
| **DBMS** | Database Management & SQL | 10% – 12% | High |
| **AI** | Artificial Intelligence | 10% – 12% | High |
| **CALC**| Calculus & Optimization | 8% – 10% | High |

---

## 🚀 Running the Project

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run TypeScript check
npm run lint

# Build production bundle
npm run build
```
