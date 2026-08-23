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

// Custom Milestone Node component
interface MilestoneNodeData extends Record<string, unknown> {
  milestone: MilestoneResponse;
  isCurrent: boolean;
  onSelect: (m: MilestoneResponse) => void;
}

const MilestoneNode: React.FC<NodeProps<Node<MilestoneNodeData>>> = ({ data }) => {
  const { milestone, isCurrent, onSelect } = data;
  const { status, sequenceOrder, course } = milestone;

  const isCompleted = status === 'COMPLETED';
  const isInProgress = status === 'IN_PROGRESS';

  return (
    <div
      onClick={() => onSelect(milestone)}
      className={`relative w-64 cursor-pointer rounded-xl border p-4 backdrop-blur-md transition-all duration-200 ${
        isCompleted
          ? 'border-success/50 bg-success/10 text-text shadow-sm'
          : isInProgress || isCurrent
          ? 'border-ion bg-ion/15 text-text shadow-glow-ion'
          : 'border-line bg-surface-2/80 text-muted hover:border-line-soft'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-ion !h-2.5 !w-2.5" />
      <Handle type="source" position={Position.Right} className="!bg-ion !h-2.5 !w-2.5" />

      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Step {sequenceOrder}
        </span>
        {isCompleted ? (
          <span className="flex items-center gap-1 font-mono text-[10px] text-success">
            <CheckCircle2 className="h-3.5 w-3.5" /> Done
          </span>
        ) : isInProgress ? (
          <span className="flex items-center gap-1 font-mono text-[10px] text-ion animate-pulse">
            <Clock className="h-3.5 w-3.5" /> Active
          </span>
        ) : (
          <span className="flex items-center gap-1 font-mono text-[10px] text-muted">
            <Lock className="h-3 w-3" /> Queued
          </span>
        )}
      </div>

      <h4 className="font-semibold text-xs line-clamp-2 text-text">
        {course.title}
      </h4>

      <div className="mt-3 flex items-center justify-between">
        <LevelBadge level={course.level} />
        <ResourceTypeBadge type={course.resourceType} />
      </div>
    </div>
  );
};

const nodeTypes = {
  milestoneNode: MilestoneNode,
};

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

  // Keep selected milestone in sync with refreshed data
  useEffect(() => {
    if (selectedMilestone && path) {
      const updated = path.milestones.find((m) => m.id === selectedMilestone.id);
      if (updated) setSelectedMilestone(updated);
    }
  }, [path]);

  // Layout milestones in horizontal serpentine or staggered graph
  const { nodes, edges } = useMemo(() => {
    if (!path || !path.milestones) return { nodes: [], edges: [] };

    const sorted = [...path.milestones].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    const generatedNodes: Node<MilestoneNodeData>[] = [];
    const generatedEdges: Edge[] = [];

    // Determine current milestone
    const inProgressIndex = sorted.findIndex((m) => m.status === 'IN_PROGRESS');
    const firstNotStartedIndex = sorted.findIndex((m) => m.status === 'NOT_STARTED');
    const currentIndex = inProgressIndex !== -1 ? inProgressIndex : firstNotStartedIndex;

    const COLS = 3;
    const X_SPACING = 340;
    const Y_SPACING = 160;

    sorted.forEach((m, idx) => {
      const row = Math.floor(idx / COLS);
      const isReverseRow = row % 2 === 1;
      const colInRow = idx % COLS;
      const col = isReverseRow ? COLS - 1 - colInRow : colInRow;

      const x = col * X_SPACING + 60;
      const y = row * Y_SPACING + 60;

      generatedNodes.push({
        id: m.id,
        type: 'milestoneNode',
        position: { x, y },
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
        generatedEdges.push({
          id: `e-${prev.id}-${m.id}`,
          source: prev.id,
          target: m.id,
          animated: prev.status === 'COMPLETED' && m.status === 'IN_PROGRESS',
          style: {
            stroke: prev.status === 'COMPLETED' ? '#6FD19A' : '#262B37',
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: prev.status === 'COMPLETED' ? '#6FD19A' : '#262B37',
          },
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
          message="Could not load this learning path graph."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

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
      // Ignored
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
      // Ignored
    }
  };

  return (
    <div className="relative flex h-[calc(100vh-4rem)] flex-col">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between border-b border-line bg-surface/90 px-6 py-3 backdrop-blur-md z-10">
        <div>
          <div className="flex items-center gap-2">
            <Eyebrow tone="ion">CURRICULUM GRAPH</Eyebrow>
            <Badge tone="neutral">
              {path.milestones.length} Milestones
            </Badge>
          </div>
          <h2 className="font-display text-xl text-text truncate max-w-xl">
            {path.goalDescription}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsRegenerateOpen(true)}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Adapt Curriculum
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
            <Sparkles className="h-3.5 w-3.5 mr-1 text-void" />
            Ask Mentor
          </Button>
        </div>
      </div>

      {/* React Flow Graph Surface */}
      <div className="relative flex-1 bg-void">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          className="bg-void"
        >
          <Background color="#262B37" gap={24} size={1} />
          <Controls className="!bg-surface-2 !border-line !text-text" />
          <MiniMap
            nodeColor={(n) => {
              const status = (n.data as any)?.milestone?.status;
              if (status === 'COMPLETED') return '#6FD19A';
              if (status === 'IN_PROGRESS') return '#5BD1E0';
              return '#262B37';
            }}
            className="!bg-surface !border-line"
          />
        </ReactFlow>
      </div>

      {/* Slide-over Milestone Details Drawer */}
      {selectedMilestone && (
        <div className="absolute right-0 top-0 bottom-0 z-30 w-full max-w-md border-l border-line bg-surface/95 p-6 shadow-2xl backdrop-blur-xl overflow-y-auto animate-slide-in-right">
          <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
            <span className="font-mono text-xs text-ion uppercase tracking-wider">
              Milestone Step {selectedMilestone.sequenceOrder}
            </span>
            <button
              onClick={() => setSelectedMilestone(null)}
              className="p-1 text-muted hover:text-text rounded-md"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <LevelBadge level={selectedMilestone.course.level} />
                <ResourceTypeBadge type={selectedMilestone.course.resourceType} />
              </div>
              <h3 className="text-xl font-display text-text">
                {selectedMilestone.course.title}
              </h3>
            </div>

            {/* Explanation card */}
            {selectedMilestone.explanation && (
              <Card className="border-line/70 bg-surface-2 p-4">
                <Eyebrow tone="ion">ARCHITECT RATIONALE</Eyebrow>
                <p className="mt-1 text-xs text-text/90 leading-relaxed">
                  {selectedMilestone.explanation}
                </p>
              </Card>
            )}

            {/* Course details */}
            <div className="space-y-2 text-xs text-muted">
              {selectedMilestone.course.platform && (
                <div className="flex justify-between">
                  <span>Platform:</span>
                  <span className="text-text font-medium">{selectedMilestone.course.platform}</span>
                </div>
              )}
              {selectedMilestone.course.durationHours && (
                <div className="flex justify-between">
                  <span>Estimated Duration:</span>
                  <span className="text-text font-medium">{selectedMilestone.course.durationHours} hours</span>
                </div>
              )}
              {selectedMilestone.course.link && (
                <div className="pt-2">
                  <a
                    href={selectedMilestone.course.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-ion hover:underline"
                  >
                    Open Resource on Web <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Skill Tags */}
            <div>
              <p className="font-mono text-[11px] uppercase text-muted mb-2">Target Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedMilestone.course.skillTags.map((s) => (
                  <span
                    key={s.id}
                    className="rounded bg-surface-2 border border-line px-2.5 py-1 text-xs text-text"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4 border-t border-line">
              {selectedMilestone.status === 'NOT_STARTED' && (
                <Button
                  variant="primary"
                  size="md"
                  className="w-full"
                  loading={startMilestoneMutation.isPending}
                  onClick={() =>
                    startMilestoneMutation.mutate({
                      milestoneId: selectedMilestone.id,
                    })
                  }
                >
                  <Play className="h-4 w-4 mr-1" />
                  Start Milestone
                </Button>
              )}

              {selectedMilestone.status === 'IN_PROGRESS' && (
                <Button
                  variant="primary"
                  size="md"
                  className="w-full bg-success text-void hover:bg-success/90"
                  loading={completeMilestoneMutation.isPending}
                  onClick={() =>
                    completeMilestoneMutation.mutate({
                      milestoneId: selectedMilestone.id,
                    })
                  }
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mark as Completed
                </Button>
              )}

              <Button
                variant="secondary"
                size="md"
                className="w-full"
                onClick={() =>
                  openMentor({
                    contextType: 'COURSE',
                    contextId: selectedMilestone.course.id,
                    contextTitle: selectedMilestone.course.title,
                  })
                }
              >
                <Sparkles className="h-4 w-4 mr-1 text-ion" />
                Ask Mentor About This Milestone
              </Button>
            </div>

            {/* Milestone Feedback */}
            <div className="pt-4 border-t border-line">
              <p className="font-mono text-xs text-muted mb-2 uppercase">Provide Feedback</p>
              {feedbackSubmitted ? (
                <p className="text-xs text-success flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" /> Feedback recorded!
                </p>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-2">
                  <textarea
                    rows={2}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Was this milestone too easy, too hard, or irrelevant?"
                    className="w-full rounded-lg border border-line bg-surface-2 p-2.5 text-xs text-text placeholder:text-muted focus:border-ion focus:outline-none"
                  />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    disabled={!feedbackText.trim() || feedbackMutation.isPending}
                  >
                    Submit Feedback
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Regenerate Modal */}
      {isRegenerateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-md p-4">
          <Card className="w-full max-w-lg border-line bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display text-text">Adapt Learning Path</h3>
              <button
                onClick={() => setIsRegenerateOpen(false)}
                className="text-muted hover:text-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRegenerateSubmit} className="space-y-4">
              <p className="text-xs text-muted">
                Describe any adjustments you want made (e.g. "Focus more on Go instead of Java", "Skip beginner modules", "Add hands-on project courses").
              </p>

              <textarea
                rows={3}
                value={regenerateFeedback}
                onChange={(e) => setRegenerateFeedback(e.target.value)}
                placeholder="Enter curriculum recalibration instructions..."
                className="w-full rounded-lg border border-line bg-surface-2 p-3 text-xs text-text focus:border-ion focus:outline-none"
                autoFocus
              />

              <div className="flex justify-end gap-2">
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
                  Regenerate Path
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
