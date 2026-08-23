/**
 * API contract types — mirror the Spring Boot backend response/request shapes exactly.
 * See docs/BUILD_CONTRACT.md. Do not diverge from these without checking the backend.
 */

/**
 * Every entity id in the backend is a `java.util.UUID`, which Jackson serializes as a
 * string (e.g. "3f2a…"). Never treat these as numbers — no arithmetic, no parseInt,
 * and route params stay strings.
 */
export type Uuid = string;

// ---------- Enums (as string unions) ----------
export type Role = 'USER' | 'ADMIN';

export type ExperienceLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export type LearningStyle =
  | 'VISUAL'
  | 'TEXTUAL'
  | 'PRACTICAL'
  | 'AUDITORY'
  | 'VIDEO'
  | 'TEXT'
  | 'PROJECT_BASED'
  | 'MIXED';

export type CourseLevel = 'BEGINNER' | 'EASY' | 'MEDIUM' | 'HIGH';

export type ResourceType = 'COURSE' | 'VIDEO';

export type MilestoneStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export type PathStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export type EmploymentStatus =
  | 'STUDENT'
  | 'EMPLOYED'
  | 'FREELANCER'
  | 'UNEMPLOYED'
  | 'OTHER';

export type MentorContextType = 'COURSE' | 'ASSESSMENT' | 'GENERAL';

// ---------- Auth ----------
export interface UserSummary {
  id: Uuid;
  email: string;
  fullName: string;
  role: Role;
  emailVerified: boolean;
}

export interface AuthResponse {
  token?: string;
  user?: UserSummary;
  emailVerificationRequired?: boolean;
  email?: string;
  message?: string;
}

// ---------- Skills & Courses ----------
export interface SkillResponse {
  id: Uuid;
  name: string;
  category?: string;
}

export interface CourseResponse {
  id: Uuid;
  title: string;
  description?: string;
  skillTags: SkillResponse[];
  level: CourseLevel;
  resourceType: ResourceType;
  externalId?: string;
  durationHours?: number;
  platform?: string;
  link?: string;
}

// ---------- Learning path & milestones ----------
export interface MilestoneResponse {
  id: Uuid;
  course: CourseResponse;
  sequenceOrder: number;
  status: MilestoneStatus;
  explanation?: string;
  targetCompletionDate?: string;
}

export interface LearningPathResponse {
  id: Uuid;
  learnerProfileId?: Uuid;
  goalDescription: string;
  generatedAt: string;
  status: PathStatus;
  milestones: MilestoneResponse[];
}

// ---------- Learner profile ----------
export interface LearnerProfileResponse {
  id: Uuid;
  userId: Uuid;
  email?: string;
  fullName?: string;
  experienceLevel?: ExperienceLevel;
  interests: string[];
  careerGoal?: string;
  preferredLearningStyle?: LearningStyle;
  institutionName?: string;
  organizationName?: string;
  roleTitle?: string;
  employmentStatus?: EmploymentStatus;
  bio?: string;
  avatarUrl?: string;
  completedCourses: CourseResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface ProfileUpdateRequest {
  fullName?: string;
  experienceLevel?: ExperienceLevel;
  interests?: string[];
  careerGoal?: string;
  preferredLearningStyle?: LearningStyle;
  institutionName?: string;
  organizationName?: string;
  roleTitle?: string;
  employmentStatus?: EmploymentStatus;
  bio?: string;
  avatarUrl?: string;
}

// ---------- Assessments ----------
export interface AssessmentQuestionResponse {
  id: Uuid;
  promptText: string;
  options: string[];
  /** Redacted (absent) until the attempt is submitted. */
  correctOptionIndex?: number;
  explanation?: string;
}

export interface AssessmentResponse {
  id: Uuid;
  topic: string;
  level: CourseLevel;
  generatedAt: string;
  questions: AssessmentQuestionResponse[];
}

export interface AnswerSubmissionItem {
  questionId: Uuid;
  selectedOptionIndex: number;
}

export interface SubmitAssessmentRequest {
  answers: AnswerSubmissionItem[];
}

export interface AssessmentAnswerResponse {
  questionId: Uuid;
  promptText: string;
  options: string[];
  selectedOptionIndex: number;
  correctOptionIndex: number;
  correct: boolean;
  explanation?: string;
}

export interface AssessmentAttemptResponse {
  id: Uuid;
  assessmentId: Uuid;
  topic: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: string;
  answers: AssessmentAnswerResponse[];
}

// ---------- Dashboard & progress ----------
/**
 * Mirrors `DashboardResponse.java` exactly. Note: the path field is `currentPath`
 * (not activePath), `skillsGained` is a list of plain skill NAMES, and there is no
 * `completionPercentage` or `recentActivity` — derive percentage on the client.
 */
export interface DashboardResponse {
  completedCount: number;
  inProgressCount: number;
  totalMilestones: number;
  skillsGained: string[];
  currentPath?: LearningPathResponse;
  nextRecommendedMilestone?: MilestoneResponse;
}

// ---------- Chat (onboarding) & Mentor ----------
export interface ChatResponse {
  reply: string;
  profileUpdated: boolean;
  learningPathId?: Uuid;
}

export interface MentorMessageResponse {
  reply: string;
}

// ---------- Pagination ----------
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// ---------- Error envelope ----------
export interface ApiErrorBody {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  validationErrors?: Record<string, string>;
}
