import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, CheckCircle2, Clock, Sparkles, BookOpen } from 'lucide-react';
import { useCourse } from '@/hooks/api/useCourses';
import { useMarkCourseCompleted } from '@/hooks/api/useProfile';
import { useMentorStore } from '@/store/useMentorStore';
import { Card, Button, Eyebrow, LoadingSpinner, ErrorState, LevelBadge, ResourceTypeBadge } from '@/components/common';

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
    return <div className="flex h-[70vh] items-center justify-center"><LoadingSpinner label="Fetching Course Metadata..." /></div>;
  }

  if (isError || !course) {
    return <div className="mx-auto max-w-4xl p-6"><ErrorState title="Course Not Found" message="Could not load details for this learning resource." onRetry={() => refetch()} /></div>;
  }

  const embedUrl = extractYouTubeEmbedUrl(course.link);

  const handleMarkCompleted = async () => {
    try {
      await markCompletedMutation.mutateAsync({ courseId: course.id });
      setCompletedSuccess(true);
    } catch {
      // Existing mutation error handling remains unchanged.
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-7 px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      <Link to="/courses" className="inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-ion-deep">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to Catalog
      </Link>

      <Card className="overflow-hidden p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-12">
          <div className="min-w-0">
            <Eyebrow>Learning resource</Eyebrow>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <LevelBadge level={course.level} />
              <ResourceTypeBadge type={course.resourceType} />
              {course.platform && <span className="rounded-full border border-line bg-surface-alt px-3 py-1 font-mono text-[10px] uppercase text-muted">{course.platform}</span>}
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[0.98] tracking-[-0.06em] text-text sm:text-6xl">{course.title}</h1>
            {course.durationHours && (
              <p className="mt-5 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted">
                <Clock className="h-4 w-4 text-ion" aria-hidden /> Estimated duration: {course.durationHours} hours
              </p>
            )}
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-soft">
              {course.description || 'This module provides targeted training to elevate your engineering mastery, combining conceptual foundations with modern tooling.'}
            </p>
          </div>

          <div className="flex flex-col gap-3 border-t border-line pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            {course.link && (
              <a href={course.link} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ion px-5 text-sm font-semibold text-white shadow-glow-ion transition-colors hover:bg-ion-deep">
                Access Resource <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            )}
            <Button variant="secondary" size="md" onClick={() => openMentor({ contextType: 'COURSE', contextId: course.id, contextTitle: course.title })}>
              <Sparkles className="h-4 w-4 text-ion" aria-hidden /> Ask AI Mentor
            </Button>
            <Button variant="ghost" size="md" disabled={completedSuccess} loading={markCompletedMutation.isPending} onClick={handleMarkCompleted} className={completedSuccess ? 'text-success-deep' : 'text-muted'}>
              <CheckCircle2 className="h-4 w-4" aria-hidden /> {completedSuccess ? 'Marked Completed' : 'Mark as Completed'}
            </Button>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs text-muted">
          <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-success" aria-hidden /> Ready to learn</span>
          <span className="font-mono text-[10px] uppercase tracking-wider">Resource ID · KC-COURSE-{course.id.slice(0, 8)}</span>
        </div>
      </Card>

      {embedUrl && (
        <Card className="overflow-hidden bg-dark p-0">
          <div className="relative aspect-video w-full bg-dark">
            <iframe src={embedUrl} title={course.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="h-full w-full border-none" />
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <Card className="p-6 sm:p-8">
          <Eyebrow>Curriculum overview</Eyebrow>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-text">Module Content</h2>
          <p className="mt-6 whitespace-pre-wrap text-base leading-relaxed text-ink-soft">
            {course.description || 'This module provides targeted training to elevate your engineering mastery, combining conceptual foundations with modern tooling and practical engineering decisions.'}
          </p>
          <div className="mt-8 divide-y divide-line border-t border-line">
            <div className="flex items-center justify-between py-3 text-sm"><span className="text-muted">Resource type</span><span className="font-semibold text-text">{course.resourceType === 'VIDEO' ? 'Video' : 'Course'}</span></div>
            {course.durationHours && <div className="flex items-center justify-between py-3 text-sm"><span className="text-muted">Estimated duration</span><span className="font-semibold text-text">{course.durationHours} hours</span></div>}
            {course.platform && <div className="flex items-center justify-between py-3 text-sm"><span className="text-muted">Platform</span><span className="font-semibold text-text">{course.platform}</span></div>}
          </div>
        </Card>

        <Card className="bg-accent-tint/50 p-6 sm:p-8">
          <BookOpen className="h-5 w-5 text-ion" aria-hidden />
          <Eyebrow className="mt-5" tone="ember">Learning objectives</Eyebrow>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-text">Skills Targeted</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">Competencies selected for this learning resource and its place in your trajectory.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {course.skillTags && course.skillTags.length > 0 ? course.skillTags.map((s) => (
              <span key={s.id} className="rounded-full border border-ion/20 bg-surface px-3 py-1.5 text-xs font-medium text-ion-deep">{s.name}</span>
            )) : <p className="text-xs text-muted">Core curriculum competencies</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
