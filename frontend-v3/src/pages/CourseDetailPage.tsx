import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useCourse } from '@/hooks/api/useCourses';
import { useMarkCourseCompleted } from '@/hooks/api/useProfile';
import { useMentorStore } from '@/store/useMentorStore';
import {
  Card,
  Button,
  Eyebrow,
  LoadingSpinner,
  ErrorState,
  LevelBadge,
  ResourceTypeBadge,
} from '@/components/common';

function extractYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const openMentor = useMentorStore((s) => s.openMentor);

  const { data: course, isLoading, isError, refetch } = useCourse(id);
  const markCompletedMutation = useMarkCourseCompleted();
  const [completedSuccess, setCompletedSuccess] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <LoadingSpinner label="Fetching Course Metadata..." />
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <ErrorState
          title="Course Not Found"
          message="Could not load details for this learning resource."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const embedUrl = extractYouTubeEmbedUrl(course.link);

  const handleMarkCompleted = async () => {
    try {
      await markCompletedMutation.mutateAsync({ courseId: course.id });
      setCompletedSuccess(true);
    } catch {
      // Ignored
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Back button */}
      <div>
        <Link
          to="/courses"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Catalog
        </Link>
      </div>

      {/* Main Detail Header Card */}
      <Card className="border-line bg-surface/90 p-6 sm:p-8 shadow-panel">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <LevelBadge level={course.level} />
              <ResourceTypeBadge type={course.resourceType} />
              {course.platform && (
                <span className="rounded bg-surface-2 px-2.5 py-0.5 font-mono text-[11px] text-muted border border-line">
                  {course.platform}
                </span>
              )}
            </div>

            <h1 className="font-display text-2xl sm:text-3xl text-text leading-tight">
              {course.title}
            </h1>

            {course.durationHours && (
              <p className="flex items-center gap-1.5 text-xs font-mono text-muted">
                <Clock className="h-3.5 w-3.5" />
                Estimated duration: {course.durationHours} hours
              </p>
            )}
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            {course.link && (
              <a
                href={course.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-ion px-4 py-2.5 text-sm font-semibold text-void hover:bg-ion/90 transition-colors shadow-glow-ion"
              >
                Access Resource
                <ExternalLink className="h-4 w-4" />
              </a>
            )}

            <Button
              variant="secondary"
              size="md"
              onClick={() =>
                openMentor({
                  contextType: 'COURSE',
                  contextId: course.id,
                  contextTitle: course.title,
                })
              }
            >
              <Sparkles className="h-4 w-4 mr-1 text-ion" />
              Ask AI Mentor
            </Button>

            <Button
              variant="ghost"
              size="md"
              disabled={completedSuccess}
              loading={markCompletedMutation.isPending}
              onClick={handleMarkCompleted}
              className={completedSuccess ? 'text-success' : 'text-muted'}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              {completedSuccess ? 'Marked Completed' : 'Mark as Completed'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Video Embed Section (if applicable) */}
      {embedUrl && (
        <Card className="overflow-hidden border-line bg-surface/90 shadow-panel">
          <div className="aspect-video w-full bg-void">
            <iframe
              src={embedUrl}
              title={course.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full border-none"
            />
          </div>
        </Card>
      )}

      {/* Description & Target Skills */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 border-line bg-surface/90 lg:col-span-2 shadow-panel">
          <Eyebrow tone="ion">CURRICULUM OVERVIEW</Eyebrow>
          <h2 className="font-display text-xl text-text mt-1 mb-4">Module Content</h2>
          <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">
            {course.description ||
              'This module provides targeted training to elevate your engineering mastery, combining conceptual foundations with modern tooling.'}
          </p>
        </Card>

        <Card className="p-6 border-line bg-surface/90 shadow-panel space-y-4">
          <div>
            <Eyebrow tone="ember">LEARNING OBJECTIVES</Eyebrow>
            <h2 className="font-display text-xl text-text mt-1 mb-3">Skills Targeted</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {course.skillTags && course.skillTags.length > 0 ? (
              course.skillTags.map((s) => (
                <span
                  key={s.id}
                  className="rounded-md border border-line bg-surface-2 px-3 py-1.5 text-xs text-text font-mono"
                >
                  {s.name}
                </span>
              ))
            ) : (
              <p className="text-xs text-muted">Core curriculum competencies</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
