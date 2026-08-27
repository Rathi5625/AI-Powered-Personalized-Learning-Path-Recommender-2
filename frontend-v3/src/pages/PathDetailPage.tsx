import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  CheckCircle2,
  Clock,
  Lock,
  Play,
  Check,
  Sparkles,
  ExternalLink,
  RefreshCw,
  X,
  ArrowRight,
  LayoutGrid,
  Network,
} from 'lucide-react';
import { useLearningPath, useRegeneratePath } from '@/hooks/api/useLearningPath';
import {
  useStartMilestone,
  useCompleteMilestone,
  useMilestoneFeedback,
} from '@/hooks/api/useProgress';
import { useMentorStore } from '@/store/useMentorStore';
import type { MilestoneResponse } from '@/types';
import {
  Button,
  Card,
  Eyebrow,
  LoadingSpinner,
  ErrorState,
  LevelBadge,
  ResourceTypeBadge,
  Badge,
} from '@/components/common';

interface MilestoneNodeData extends Record<string, unknown> {
  milestone: MilestoneResponse;
  isCurrent: boolean;
  onSelect: (m: MilestoneResponse) => void;
}

const MilestoneNode: React.FC<NodeProps<Node<MilestoneNodeData>>> = ({ data }) => {
  if (!data || !data.milestone) return null;
  const { milestone, isCurrent, onSelect } = data;
  const { status, sequenceOrder, course } = milestone;
  const isCompleted = status === 'COMPLETED';
  const isInProgress = status === 'IN_PROGRESS';
  const courseTitle = course?.title || 'Milestone Course';
  const courseLevel = course?.level || 'BEGINNER';
  const courseType = course?.resourceType || 'COURSE';

  return (
    <div
      onClick={() => onSelect(milestone)}
      className={`relative w-72 cursor-pointer rounded-card border p-4 shadow-card-soft transition-[border-color,background-color,transform,box-shadow] hover:-translate-y-0.5 ${
        isCompleted
          ? 'border-success/35 bg-white text-text shadow-sm'
          : isInProgress || isCurrent
          ? 'border-ion bg-accent-tint text-text shadow-glow-ion ring-1 ring-ion/50'
          : 'border-white/15 bg-dark-2 text-dark-text hover:border-white/35 hover:bg-dark-2/90'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-dark !bg-ion"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-dark !bg-ion"
      />
      <div className="mb-2.5 flex items-center justify-between">
        <span
          className={`font-mono text-[10px] uppercase tracking-widest ${
            isCompleted || isInProgress || isCurrent ? 'text-muted' : 'text-dark-text/60'
          }`}
        >
          Step {sequenceOrder}
        </span>
        {isCompleted ? (
          <span className="flex items-center gap-1 font-mono text-[10px] font-semibold text-success-deep">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Done
          </span>
        ) : isInProgress ? (
          <span className="flex items-center gap-1 font-mono text-[10px] font-semibold text-ion-deep">
            <Clock className="h-3.5 w-3.5" aria-hidden /> Active
          </span>
        ) : (
          <span className="flex items-center gap-1 font-mono text-[10px] text-dark-text/60">
            <Lock className="h-3 w-3" aria-hidden /> Queued
          </span>
        )}
      </div>
      <h4
        className={`line-clamp-2 text-sm font-bold leading-snug ${
          isCompleted || isInProgress || isCurrent ? 'text-text' : 'text-white'
        }`}
      >
        {courseTitle}
      </h4>
      <div className="mt-3.5 flex items-center justify-between gap-2">
        <LevelBadge level={courseLevel} />
        <ResourceTypeBadge type={courseType} />
      </div>
    </div>
  );
};

const nodeTypes = { milestoneNode: MilestoneNode };

export default function PathDetailPage() {
  const { id } = useParams<{ id: string }>();
  const openMentor = useMentorStore((s) => s.openMentor);
  const { data: path, isLoading, isError, refetch } = useLearningPath(id);
  const startMilestoneMutation = useStartMilestone();
  const completeMilestoneMutation = useCompleteMilestone();
  const feedbackMutation = useMilestoneFeedback();
  const regenerateMutation = useRegeneratePath();
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneResponse | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isRegenerateOpen, setIsRegenerateOpen] = useState(false);
  const [regenerateFeedback, setRegenerateFeedback] = useState('');
  const [viewMode, setViewMode] = useState<'graph' | 'timeline'>('graph');

  useEffect(() => {
    if (selectedMilestone && path && path.milestones) {
      const updated = path.milestones.find((m) => m.id === selectedMilestone.id);
      if (updated) setSelectedMilestone(updated);
    }
  }, [path, selectedMilestone]);

  const { nodes, edges } = useMemo(() => {
    if (!path || !path.milestones || path.milestones.length === 0) return { nodes: [], edges: [] };
    const sorted = [...path.milestones].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    const generatedNodes: Node<MilestoneNodeData>[] = [];
    const generatedEdges: Edge[] = [];
    const inProgressIndex = sorted.findIndex((m) => m.status === 'IN_PROGRESS');
    const firstNotStartedIndex = sorted.findIndex((m) => m.status === 'NOT_STARTED');
    const currentIndex = inProgressIndex !== -1 ? inProgressIndex : firstNotStartedIndex;
    const COLS = 3;
    const X_SPACING = 360;
    const Y_SPACING = 210;

    sorted.forEach((m, idx) => {
      const row = Math.floor(idx / COLS);
      const isReverseRow = row % 2 === 1;
      const colInRow = idx % COLS;
      const col = isReverseRow ? COLS - 1 - colInRow : colInRow;

      generatedNodes.push({
        id: String(m.id),
        type: 'milestoneNode',
        position: { x: col * X_SPACING + 80, y: row * Y_SPACING + 80 },
        data: {
          milestone: m,
          isCurrent: idx === currentIndex,
          onSelect: (milestone: MilestoneResponse) => {
            setSelectedMilestone(milestone);
            setFeedbackText('');
            setFeedbackSubmitted(false);
          },
        },
      });

      if (idx > 0) {
        const prev = sorted[idx - 1];
        const edgeColor = prev.status === 'COMPLETED' ? '#2fae7d' : '#0f9488';
        generatedEdges.push({
          id: `e-${prev.id}-${m.id}`,
          source: String(prev.id),
          target: String(m.id),
          animated: prev.status === 'COMPLETED' && m.status === 'IN_PROGRESS',
          style: { stroke: edgeColor, strokeWidth: 2.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor },
        });
      }
    });

    return { nodes: generatedNodes, edges: generatedEdges };
  }, [path]);

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <LoadingSpinner label="Constructing Curriculum Graph..." />
      </div>
    );
  }

  if (isError || !path) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <ErrorState
          title="Trajectory Graph Unavailable"
          message="Could not load this learning path graph. Verify that the path exists or generate a new path from Onboarding."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const milestonesList = path.milestones || [];

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestone || !feedbackText.trim()) return;
    try {
      await feedbackMutation.mutateAsync({
        milestoneId: selectedMilestone.id,
        feedbackText: feedbackText.trim(),
      });
      setFeedbackSubmitted(true);
    } catch {
      // Handled by react-query
    }
  };

  const handleRegenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!path || !regenerateFeedback.trim()) return;
    try {
      await regenerateMutation.mutateAsync({
        id: path.id,
        feedback: regenerateFeedback.trim(),
      });
      setIsRegenerateOpen(false);
      setRegenerateFeedback('');
    } catch {
      // Handled by react-query
    }
  };

  return (
    <div className="relative flex h-[calc(100dvh-4rem)] min-h-[640px] w-full flex-col overflow-hidden">
      {/* Top Header Bar */}
      <div className="z-10 flex shrink-0 flex-col gap-4 border-b border-line bg-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Eyebrow>Curriculum graph</Eyebrow>
            <Badge tone="neutral">{milestonesList.length} Milestones</Badge>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success-deep">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> Active path
            </span>
          </div>
          <h2 className="mt-1.5 max-w-3xl truncate text-xl font-bold tracking-[-0.035em] text-text sm:text-2xl">
            {path.goalDescription}
          </h2>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-control border border-line bg-surface-alt p-0.5">
            <button
              onClick={() => setViewMode('graph')}
              className={`flex items-center gap-1.5 rounded-control px-2.5 py-1 text-xs font-semibold transition-colors ${
                viewMode === 'graph'
                  ? 'bg-surface text-text shadow-sm'
                  : 'text-muted hover:text-text'
              }`}
              title="Graph View"
            >
              <Network className="h-3.5 w-3.5" /> Graph
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 rounded-control px-2.5 py-1 text-xs font-semibold transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-surface text-text shadow-sm'
                  : 'text-muted hover:text-text'
              }`}
              title="Timeline View"
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Timeline
            </button>
          </div>

          <Button variant="secondary" size="sm" onClick={() => setIsRegenerateOpen(true)}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden /> Adapt Curriculum
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              openMentor({
                contextType: 'GENERAL',
                contextTitle: `Path: ${path.goalDescription}`,
              })
            }
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> Ask Mentor
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'graph' ? (
        <div className="relative h-full w-full min-h-[580px] flex-1 bg-dark overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.25, minZoom: 0.4, maxZoom: 1.2 }}
            minZoom={0.2}
            maxZoom={2}
            style={{ width: '100%', height: '100%' }}
            className="bg-dark"
          >
            <Background color="#2b6064" gap={24} size={1} />
            <Controls className="!overflow-hidden !rounded-control !border-white/15 !bg-dark-2 !text-white" />
            <MiniMap
              nodeColor={(n) => {
                const status = (n.data as any)?.milestone?.status;
                if (status === 'COMPLETED') return '#2fae7d';
                if (status === 'IN_PROGRESS') return '#0f9488';
                return '#31595c';
              }}
              className="!rounded-card !border-white/15 !bg-dark-2"
            />
          </ReactFlow>

          {/* Floating UI Elements */}
          <div className="pointer-events-none absolute left-5 top-5 rounded-full border border-white/15 bg-dark-2/90 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-dark-text">
            Path flow · drag to explore
          </div>
          <div className="pointer-events-none absolute bottom-5 left-5 flex items-center gap-3 rounded-full border border-white/15 bg-dark-2/90 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-dark-text">
            <span className="text-success font-semibold">● Done</span>
            <span className="text-ion font-semibold">● Active</span>
            <span className="text-muted font-medium">○ Queued</span>
          </div>
        </div>
      ) : (
        /* Timeline View */
        <div className="h-full w-full flex-1 overflow-y-auto bg-void p-6 sm:p-8">
          <div className="mx-auto max-w-3xl space-y-4">
            {milestonesList.map((m) => {
              const isCompleted = m.status === 'COMPLETED';
              const isInProgress = m.status === 'IN_PROGRESS';
              return (
                <Card
                  key={m.id}
                  onClick={() => {
                    setSelectedMilestone(m);
                    setFeedbackText('');
                    setFeedbackSubmitted(false);
                  }}
                  className={`cursor-pointer p-5 transition-all hover:-translate-y-0.5 hover:shadow-panel ${
                    isCompleted
                      ? 'border-success/30 bg-surface'
                      : isInProgress
                      ? 'border-ion bg-accent-tint shadow-glow-ion ring-1 ring-ion/50'
                      : 'border-line bg-surface'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs uppercase tracking-widest text-muted">
                          Step {m.sequenceOrder}
                        </span>
                        {isCompleted ? (
                          <span className="flex items-center gap-1 font-mono text-xs font-semibold text-success-deep">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                          </span>
                        ) : isInProgress ? (
                          <span className="flex items-center gap-1 font-mono text-xs font-semibold text-ion-deep">
                            <Clock className="h-3.5 w-3.5" /> In Progress
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 font-mono text-xs text-muted">
                            <Lock className="h-3 w-3" /> Queued
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-text">{m.course.title}</h3>
                      {m.explanation && (
                        <p className="line-clamp-2 text-sm text-ink-soft">{m.explanation}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <LevelBadge level={m.course.level} />
                      <ResourceTypeBadge type={m.course.resourceType} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Milestone Sidebar Drawer */}
      {selectedMilestone && (
        <aside className="absolute right-0 top-[73px] bottom-0 z-30 w-full max-w-md overflow-y-auto border-l border-line bg-surface p-5 shadow-panel sm:p-6">
          <div className="mb-5 flex items-center justify-between border-b border-line pb-4">
            <span className="font-mono text-hud uppercase text-ion-deep font-semibold">
              Milestone Step {selectedMilestone.sequenceOrder}
            </span>
            <button
              onClick={() => setSelectedMilestone(null)}
              className="rounded-full p-2 text-muted hover:bg-surface-alt hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ion/40"
              aria-label="Close milestone details"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <LevelBadge level={selectedMilestone.course?.level} />
                <ResourceTypeBadge type={selectedMilestone.course?.resourceType} />
              </div>
              <h3 className="text-2xl font-bold leading-tight tracking-[-0.04em] text-text">
                {selectedMilestone.course?.title}
              </h3>
            </div>

            {selectedMilestone.explanation && (
              <Card className="border-ion/15 bg-accent-tint/55 p-4 shadow-none">
                <Eyebrow>Architect rationale</Eyebrow>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {selectedMilestone.explanation}
                </p>
              </Card>
            )}

            <div className="divide-y divide-line text-sm">
              {selectedMilestone.course?.platform && (
                <div className="flex justify-between gap-4 py-3">
                  <span className="text-muted">Platform</span>
                  <span className="font-semibold text-text">
                    {selectedMilestone.course.platform}
                  </span>
                </div>
              )}
              {selectedMilestone.course?.durationHours && (
                <div className="flex justify-between gap-4 py-3">
                  <span className="text-muted">Estimated duration</span>
                  <span className="font-semibold text-text">
                    {selectedMilestone.course.durationHours} hours
                  </span>
                </div>
              )}
              {selectedMilestone.course?.link && (
                <div className="py-3">
                  <a
                    href={selectedMilestone.course.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 font-semibold text-ion-deep hover:text-ion hover:underline"
                  >
                    Open Resource on Web <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </a>
                </div>
              )}
            </div>

            {selectedMilestone.course?.skillTags && selectedMilestone.course.skillTags.length > 0 && (
              <div>
                <p className="mb-2 font-mono text-hud uppercase text-muted">Target skills</p>
                <div className="flex flex-wrap gap-2">
                  {selectedMilestone.course.skillTags.map((s) => (
                    <span
                      key={s.id}
                      className="rounded-full border border-line bg-surface-alt px-3 py-1.5 text-xs text-text"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3 border-t border-line pt-5">
              {selectedMilestone.status === 'NOT_STARTED' && (
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  loading={startMilestoneMutation.isPending}
                  onClick={() =>
                    startMilestoneMutation.mutate({ milestoneId: selectedMilestone.id })
                  }
                >
                  <Play className="h-4 w-4" aria-hidden /> Start Milestone
                </Button>
              )}
              {selectedMilestone.status === 'IN_PROGRESS' && (
                <Button
                  variant="primary"
                  size="md"
                  className="w-full bg-success hover:bg-success-deep"
                  loading={completeMilestoneMutation.isPending}
                  onClick={() =>
                    completeMilestoneMutation.mutate({ milestoneId: selectedMilestone.id })
                  }
                >
                  <Check className="h-4 w-4" aria-hidden /> Mark as Completed
                </Button>
              )}
              <Button
                variant="secondary"
                size="md"
                className="w-full"
                onClick={() =>
                  openMentor({
                    contextType: 'COURSE',
                    contextId: selectedMilestone.course?.id,
                    contextTitle: selectedMilestone.course?.title,
                  })
                }
              >
                <Sparkles className="h-4 w-4 text-ion" aria-hidden /> Ask Mentor About This
                Milestone
              </Button>
            </div>

            <div className="border-t border-line pt-5">
              <p className="mb-2 font-mono text-hud uppercase text-muted">Provide feedback</p>
              {feedbackSubmitted ? (
                <p className="flex items-center gap-2 text-sm font-semibold text-success-deep">
                  <CheckCircle2 className="h-4 w-4" aria-hidden /> Feedback recorded!
                </p>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-2">
                  <textarea
                    rows={3}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Was this milestone too easy, too hard, or irrelevant?"
                    className="w-full rounded-control border border-line bg-surface-alt p-3 text-sm text-text placeholder:text-muted-2 focus:border-ion focus:outline-none focus:ring-2 focus:ring-ion/20"
                  />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    disabled={!feedbackText.trim() || feedbackMutation.isPending}
                  >
                    Submit Feedback <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </form>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* Adapt Curriculum Dialog */}
      {isRegenerateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/40 p-4 backdrop-blur-sm">
          <Card
            className="w-full max-w-lg p-6 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="adapt-path-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <Eyebrow>Curriculum graph</Eyebrow>
                <h3 id="adapt-path-title" className="mt-2 text-2xl font-bold tracking-tight text-text">
                  Adapt Learning Path
                </h3>
              </div>
              <button
                onClick={() => setIsRegenerateOpen(false)}
                className="rounded-full p-2 text-muted hover:bg-surface-alt hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ion/40"
                aria-label="Close adapt learning path"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <form onSubmit={handleRegenerateSubmit} className="mt-6 space-y-4">
              <p className="text-sm leading-relaxed text-muted">
                Describe any adjustments you want made (e.g. "Focus more on Go instead of Java",
                "Skip beginner modules", "Add hands-on project courses").
              </p>
              <textarea
                rows={4}
                value={regenerateFeedback}
                onChange={(e) => setRegenerateFeedback(e.target.value)}
                placeholder="Enter curriculum recalibration instructions..."
                className="w-full rounded-control border border-line bg-surface-alt p-3 text-sm text-text placeholder:text-muted-2 focus:border-ion focus:outline-none focus:ring-2 focus:ring-ion/20"
                autoFocus
              />
              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsRegenerateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!regenerateFeedback.trim()}
                  loading={regenerateMutation.isPending}
                >
                  Regenerate Path <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
