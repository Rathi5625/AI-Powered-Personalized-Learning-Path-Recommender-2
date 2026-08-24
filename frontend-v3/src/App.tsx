import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell, ProtectedRoute, PublicLayout } from '@/components/layout';
import { PageLoader } from '@/components/common';

// Public
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));

// Protected
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const PathDetailPage = lazy(() => import('@/pages/PathDetailPage'));
const CoursesPage = lazy(() => import('@/pages/CoursesPage'));
const CourseDetailPage = lazy(() => import('@/pages/CourseDetailPage'));
const AssessmentsPage = lazy(() => import('@/pages/AssessmentsPage'));
const AssessmentTakePage = lazy(() => import('@/pages/AssessmentTakePage'));
const MentorPage = lazy(() => import('@/pages/MentorPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));

export function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public — landing is the entry point, not login */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/paths/:id" element={<PathDetailPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:id" element={<CourseDetailPage />} />
            <Route path="/assessments" element={<AssessmentsPage />} />
            <Route path="/assessments/:id" element={<AssessmentTakePage />} />
            <Route path="/mentor" element={<MentorPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
