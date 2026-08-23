# frontend-v3 BUILD CONTRACT — single source of truth

This file is the verified contract between `frontend-v3/` and the running Spring Boot backend.
Every page/agent MUST import types, hooks, and components from the paths below — do NOT invent new
shared components, new axios instances, or new type shapes. If something is missing, add it to the
foundation (`src/lib`, `src/types`, `src/hooks/api`, `src/components/{common,layout,mentor,knowledge-core}`),
never inline a divergent copy.

## Backend facts (verified against source, do not re-guess)
- Base URL: `http://localhost:8080/api` (env `VITE_API_BASE_URL`).
- Auth: JWT bearer. Only `/api/auth/**` + swagger are public; everything else needs `Authorization: Bearer <token>`.
- 401 anywhere → clear token+user, redirect `/login` (handled in apiClient, except on public auth pages).
- Login on unverified account → **HTTP 403** (`AccountNotVerifiedException`). Frontend must catch 403 on
  login and route to `/verify-otp?email=<email>`.
- Register → **HTTP 201**, body `AuthResponse` with NO token when email verification required
  (`emailVerificationRequired: true`, `email` echoed). Route to `/verify-otp?email=<email>`.
- Error body shape (`@JsonInclude(NON_NULL)`):
  `{ timestamp, status, error, message, path, validationErrors?: Record<string,string> }`.
- SMTP is enabled → OTP goes to the real inbox. For automated E2E, OTP can be read from Supabase
  `otp_codes` table. In console, look for `[OTP]`-style logs only if SMTP is off.

## Endpoints (method, path, request → response)
Auth (`useAuth`):
- POST `/auth/register`  `{email,password,fullName}` → 201 `AuthResponse`
- POST `/auth/login`     `{email,password}` → 200 `AuthResponse` (token+user) | 403 unverified | 401 bad creds
- POST `/auth/verify-otp` `{email,code}` → 200 `AuthResponse` (token+user)
- POST `/auth/resend-otp` `{email}` → 200 `{message}`
- POST `/auth/forgot-password` `{email}` → 200 `{message}`
- POST `/auth/reset-password` `{email,code,newPassword}` → 200 `{message}`

Courses (`useCourses`) — PROTECTED:
- GET `/courses` query `{skill?,level?,platform?,resourceType?,page?,size?}` → `PageResponse<CourseResponse>`
- GET `/courses/{id}` → `CourseResponse`
- GET `/courses/search` query `{query,limit?}` → `CourseResponse[]` (semantic/embedding search)

Learning paths (`useLearningPath`):
- POST `/learning-paths/generate` `{goalDescription}` → 201 `LearningPathResponse`
- GET  `/learning-paths/{id}` → `LearningPathResponse`
- GET  `/learning-paths/me` → `LearningPathResponse[]` (ARRAY, not page)
- POST `/learning-paths/{id}/regenerate` `{feedback}` → `LearningPathResponse`  (field is **feedback**)

Progress (`useDashboard`, `useProgress`):
- GET  `/progress/dashboard` → `DashboardResponse`
- POST `/progress/milestones/{id}/start` → `MilestoneResponse`   (NEW hook: useStartMilestone)
- POST `/progress/milestones/{id}/complete` → `MilestoneResponse`
- POST `/progress/milestones/{id}/feedback` `{feedbackText}` → `ProgressLogResponse` (field is **feedbackText**)

Chat / onboarding (`useChat`):
- POST `/chat/message` `{message, sessionId}` → `ChatResponse`
  **sessionId is @NotBlank REQUIRED.** Generate one client-side (crypto.randomUUID) at onboarding start and reuse.

Assessments (`useAssessments`):
- POST `/assessments/generate` `{topic?}` (body optional) → 201 `AssessmentResponse` (questions have NO correct answers)
- GET  `/assessments/{id}` → `AssessmentResponse`
- POST `/assessments/{id}/submit` `{answers:[{questionId,selectedOptionIndex}]}` → `AssessmentAttemptResponse` (graded, with explanations)
- GET  `/assessments/me` query `{page?,size?}` → `PageResponse<AssessmentAttemptResponse>` (default size 10)

Mentor (`useMentor`):
- POST `/mentor/message` `{message, contextType?, contextId?, sessionId?}` → `MentorMessageResponse` `{reply}`
  contextType ∈ COURSE|ASSESSMENT|GENERAL; contextId is the related entity id (string|number) or null.

Profile (`useProfile`):
- GET `/profile/me` → `LearnerProfileResponse`
- PUT `/profile/me` `ProfileUpdateRequest` → `LearnerProfileResponse`
- POST `/profile/me/completed-courses/{courseId}` → `LearnerProfileResponse`

## Validation rules (mirror in Zod)
- register.password: min 6
- reset-password.newPassword: min 8   (DIFFERENT from register!)
- verify-otp.code / reset.code: exactly 6 chars, digits
- generate path.goalDescription: NotBlank
- regenerate.feedback: NotBlank
- milestone feedback.feedbackText: NotBlank
- chat.message: NotBlank ; chat.sessionId: NotBlank

## Enums (string unions in src/types)
Role=USER|ADMIN; ExperienceLevel=BEGINNER|INTERMEDIATE|ADVANCED;
LearningStyle=VISUAL|TEXTUAL|PRACTICAL|AUDITORY|VIDEO|TEXT|PROJECT_BASED|MIXED;
CourseLevel=BEGINNER|EASY|MEDIUM|HIGH; ResourceType=COURSE|VIDEO;
MilestoneStatus=NOT_STARTED|IN_PROGRESS|COMPLETED; PathStatus=ACTIVE|COMPLETED|ARCHIVED;
EmploymentStatus=STUDENT|EMPLOYED|FREELANCER|UNEMPLOYED|OTHER;
MentorContextType=COURSE|ASSESSMENT|GENERAL.

## Foundation inventory (import from here — do not duplicate)
- `src/lib/apiClient.ts`  → default axios instance `api`
- `src/lib/cn.ts`         → `cn(...)` class merge
- `src/lib/queryClient.ts`→ configured QueryClient
- `src/types/index.ts`    → all enums + response/request interfaces
- `src/store/useAuthStore.ts`  → { token,user,isAuthenticated,setAuth,logout }
- `src/store/useMentorStore.ts`→ { isMentorOpen, contextType, contextId, contextTitle, messages, openMentor, closeMentor, addMessage, clearMessages }
- `src/store/useUiStore.ts`    → catalog counter etc (optional HUD)
- `src/hooks/api/*`       → one file per resource (useAuth,useCourses,useDashboard,useLearningPath,useAssessments,useMentor,useProfile,useChat,useProgress)
- `src/components/layout/` → Header, AppShell (persistent header wrapper), ProtectedRoute, FirstRunRedirect
- `src/components/common/` → Button, Input, TextArea, Select, TagInput, Card, Panel, HudFrame, HudReadout, Eyebrow, LoadingSpinner, ErrorState, EmptyState, Badge, ProgressBar, StatusPill
- `src/components/mentor/` → MentorPanel (slide-out, reads useMentorStore), MentorLauncher (floating button)
- `src/components/knowledge-core/` → KnowledgeCore (R3F canvas), CoreScene, useCoreLayers; variants: hero (idle rotate), scrolly (explode on scroll), dashboard (progress-colored, lightweight)

## Design tokens (defined in tailwind.config.ts — use class names, not raw hex)
colors: void, surface, surface-2, line, text, muted, ion (cool), ember (warm),
layer-1(#5BD1E0) layer-2(#7FA0F5) layer-3(#E8A24C) layer-4(#F0785E), danger, success.
fonts: font-display (Instrument Serif), font-sans (Inter), font-mono (JetBrains Mono).
HUD chrome ONLY on: landing hero (catalog counter), dashboard corner readout (`N/M MILESTONES`), scrolly layer labels. Not on ordinary forms.

## The 4 layers (scrollytelling copy — fresh, product-specific, NOT camera/film)
- LAYER 01 / 04 — INTAKE · "Understands your goal" — onboarding chat extracts your profile (experience, interests, career goal) from a normal conversation.
- LAYER 02 / 04 — RECOMMENDATION · "Builds your path" — your goal is embedded and matched against the catalog, then ordered by prerequisites into milestones.
- LAYER 03 / 04 — ASSESSMENT · "Tests what you've learned" — AI writes quizzes scoped to the topics you've actually reached, then grades and explains.
- LAYER 04 / 04 — MENTOR · "Explains and helps, anytime" — a context-aware tutor that sees the course or quiz you're on and answers about it.

## Routes (15) + access
public: `/` (+header), `/login`, `/register`, `/verify-otp`, `/forgot-password`, `/reset-password`
protected: `/onboarding` (first-run), `/dashboard`, `/paths/:id`, `/courses`, `/courses/:id`,
`/assessments`, `/assessments/:id`, `/mentor`, `/profile`
Header persistent on ALL. Mentor panel available on ALL protected pages + `/mentor`.

## Tests (Vitest + RTL) — required minimum
1. Assessment scoring display: given an `AssessmentAttemptResponse`, the results view shows score/total,
   percentage, per-question correct/incorrect state + explanations.
2. Mentor context-passing: opening the panel from a course page sends contextType=COURSE + that course id;
   from an assessment sends ASSESSMENT; default GENERAL.
