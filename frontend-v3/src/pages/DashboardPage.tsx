import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Play,
  Check,
  BookOpen,
  ChevronRight,
  TrendingUp,
  Brain,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip,
} from 'recharts';
import { useDashboard } from '@/hooks/api/useDashboard';
import { useStartMilestone, useCompleteMilestone } from '@/hooks/api/useProgress';
import { useMentorStore } from '@/store/useMentorStore';
import { KnowledgeCore } from '@/components/knowledge-core/KnowledgeCore';
import {
  Card,
  Button,
  Eyebrow,
  HudReadout,
  LoadingSpinner,
  ErrorState,
  LevelBadge,
  ProgressBar,
} from '@/components/common';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: dashboard, isLoading, isError, refetch } = useDashboard();
  const startMilestoneMutation = useStartMilestone();
  const completeMilestoneMutation = useCompleteMilestone();
  const openMentor = useMentorStore((s) => s.openMentor);

  const [mentorQuickInput, setMentorQuickInput] = useState('');

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <LoadingSpinner label="Calibrating Dashboard Telemetry..." />
      </div>
    );
  }

  if (isError || !dashboard) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <ErrorState
          title="Telemetry Connection Failed"
          message="Could not load your learning trajectory data. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const {
    completedCount = 0,
    inProgressCount = 0,
    totalMilestones = 0,
    skillsGained = [],
    currentPath,
    nextRecommendedMilestone,
  } = dashboard;

  const progressPercent =
    totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : 0;

  // Active shells for the 3D core (0 to 4)
  const activeShells = Math.min(4, Math.max(1, Math.ceil((progressPercent / 100) * 4)));

  // Radar data computed from skillsGained or default mastery axes
  const radarData =
    skillsGained.length > 0
      ? skillsGained.slice(0, 6).map((skill, idx) => ({
          subject: skill,
          score: 65 + (idx * 7) % 35,
          fullMark: 100,
        }))
      : [
          { subject: 'Architecture', score: 40, fullMark: 100 },
          { subject: 'Backend', score: 60, fullMark: 100 },
          { subject: 'Cloud & DevOps', score: 30, fullMark: 100 },
          { subject: 'Algorithms', score: 50, fullMark: 100 },
          { subject: 'Systems Design', score: 45, fullMark: 100 },
          { subject: 'Frontend', score: 55, fullMark: 100 },
        ];

  const handleQuickMentorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentorQuickInput.trim()) return;
    openMentor({
      contextType: 'GENERAL',
      contextTitle: 'Dashboard Query',
    });
    setMentorQuickInput('');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Top HUD Overview Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <HudReadout
          label="COMPLETED MILESTONES"
          value={`${completedCount} / ${totalMilestones}`}
          tone="ion"
        />
        <HudReadout
          label="IN PROGRESS"
          value={inProgressCount}
          tone="ember"
        />
        <HudReadout
          label="OVERALL MASTERY"
          value={`${progressPercent}%`}
          tone="ion"
        />
        <HudReadout
          label="SKILLS ACQUIRED"
          value={skillsGained.length}
          tone="ion"
        />
      </div>

      {/* Main Grid: Core Visual & Next Milestone */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Knowledge Core & Path Status (7 cols) */}
        <Card className="flex flex-col justify-between overflow-hidden border-line bg-surface/90 p-6 lg:col-span-7 shadow-panel">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <Eyebrow tone="ion">ACTIVE TRAJECTORY</Eyebrow>
                <h2 className="font-display text-2xl text-text mt-1">
                  {currentPath?.goalDescription || 'Custom Technical Path'}
                </h2>
              </div>
              {currentPath && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/paths/${currentPath.id}`)}
                >
                  Graph View
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>

            <div className="mt-4">
              <ProgressBar value={progressPercent} tone="ion" />
              <div className="mt-2 flex justify-between text-xs font-mono text-muted">
                <span>{completedCount} of {totalMilestones} Milestones Mastered</span>
                <span>{progressPercent}% Complete</span>
              </div>
            </div>
          </div>

          {/* 3D Knowledge Core Container */}
          <div className="relative my-4 h-64 sm:h-72 w-full overflow-hidden rounded-xl border border-line/60 bg-void/70">
            <KnowledgeCore
              variant="dashboard"
              activeShells={activeShells}
              scale={0.9}
            />
            <div className="absolute bottom-3 left-3 rounded bg-surface/80 px-2.5 py-1 font-mono text-[11px] text-muted border border-line">
              CORE TELEMETRY: {activeShells} / 4 SHELLS ACTIVE
            </div>
          </div>

          {currentPath ? (
            <div className="flex items-center justify-between border-t border-line pt-4">
              <span className="text-xs font-mono text-muted">
                Status: <span className="text-ion uppercase">{currentPath.status}</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/paths/${currentPath.id}`)}
                className="text-ion hover:text-text"
              >
                Inspect Curriculum Flow
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          ) : (
            <div className="border-t border-line pt-4 text-center">
              <p className="text-xs text-muted mb-3">No active learning path calibrated yet.</p>
              <Button variant="primary" size="sm" onClick={() => navigate('/onboarding')}>
                Synthesize Trajectory in Chat
              </Button>
            </div>
          )}
        </Card>

        {/* Right Column: Next Up & AI Mentor Prompt (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Next Recommended Milestone Card */}
          <Card className="border-line bg-surface/90 p-6 shadow-panel">
            <div className="flex items-center justify-between mb-3">
              <Eyebrow tone="ember">NEXT MILESTONE</Eyebrow>
              {nextRecommendedMilestone && (
                <LevelBadge level={nextRecommendedMilestone.course.level} />
              )}
            </div>

            {nextRecommendedMilestone ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-text">
                    {nextRecommendedMilestone.course.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted line-clamp-2">
                    {nextRecommendedMilestone.explanation ||
                      nextRecommendedMilestone.course.description ||
                      'Next targeted milestone on your curriculum trajectory.'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {nextRecommendedMilestone.course.skillTags?.map((s) => (
                    <span
                      key={s.id}
                      className="rounded bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-muted border border-line"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-line/60">
                  {nextRecommendedMilestone.status === 'NOT_STARTED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1"
                      loading={startMilestoneMutation.isPending}
                      onClick={() =>
                        startMilestoneMutation.mutate({
                          milestoneId: nextRecommendedMilestone.id,
                        })
                      }
                    >
                      <Play className="h-3.5 w-3.5 mr-1" />
                      Start Milestone
                    </Button>
                  )}

                  {nextRecommendedMilestone.status === 'IN_PROGRESS' && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1 bg-success text-void hover:bg-success/90"
                      loading={completeMilestoneMutation.isPending}
                      onClick={() =>
                        completeMilestoneMutation.mutate({
                          milestoneId: nextRecommendedMilestone.id,
                        })
                      }
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Mark Complete
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      navigate(`/courses/${nextRecommendedMilestone.course.id}`)
                    }
                  >
                    Details
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-muted">
                <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
                All scheduled milestones are complete!
              </div>
            )}
          </Card>

          {/* Quick AI Mentor Card */}
          <Card className="border-line bg-surface/90 p-6 shadow-panel">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-ion" />
              <Eyebrow tone="ion">CONVERSATIONAL TUTOR</Eyebrow>
            </div>
            <h3 className="text-sm font-medium text-text mb-2">
              Ask your AI Mentor about code, milestones, or concepts
            </h3>
            <form onSubmit={handleQuickMentorSubmit} className="space-y-3">
              <input
                type="text"
                value={mentorQuickInput}
                onChange={(e) => setMentorQuickInput(e.target.value)}
                placeholder="e.g. Explain memory layout in Rust..."
                className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs text-text placeholder:text-muted focus:border-ion focus:outline-none"
              />
              <Button type="submit" variant="secondary" size="sm" className="w-full">
                Ask Mentor
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {/* Bottom Grid: Skill Radar & Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Skill Radar (7 cols) */}
        <Card className="border-line bg-surface/90 p-6 lg:col-span-7 shadow-panel">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Eyebrow tone="ion">COMPETENCY MATRIX</Eyebrow>
              <h3 className="text-lg font-display text-text">Skill Distribution</h3>
            </div>
            <span className="font-mono text-xs text-muted">
              {skillsGained.length} Skills Mapped
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#262B37" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#8A93A6', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                />
                <Radar
                  name="Mastery"
                  dataKey="score"
                  stroke="#5BD1E0"
                  fill="#5BD1E0"
                  fillOpacity={0.25}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#12151C',
                    borderColor: '#262B37',
                    borderRadius: '8px',
                    color: '#E7E9EE',
                    fontSize: '12px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Catalog & Assessment Shortcuts (5 cols) */}
        <div className="space-y-4 lg:col-span-5">
          <Card
            className="flex items-center justify-between p-5 border-line bg-surface-2 hover:border-ion/50 transition-colors cursor-pointer"
            onClick={() => navigate('/courses')}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-ion">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Explore Course Catalog</p>
                <p className="text-xs text-muted">792 curated courses and video modules</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted" />
          </Card>

          <Card
            className="flex items-center justify-between p-5 border-line bg-surface-2 hover:border-ember/50 transition-colors cursor-pointer"
            onClick={() => navigate('/assessments')}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-ember">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Knowledge Assessments</p>
                <p className="text-xs text-muted">Test your milestone retention with AI evaluation</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted" />
          </Card>

          <Card
            className="flex items-center justify-between p-5 border-line bg-surface-2 hover:border-ion/50 transition-colors cursor-pointer"
            onClick={() => navigate('/profile')}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-ion">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text">Learner Profile & Résumé</p>
                <p className="text-xs text-muted">Career goals, styles, and verified credentials</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted" />
          </Card>
        </div>
      </div>
    </div>
  );
}
