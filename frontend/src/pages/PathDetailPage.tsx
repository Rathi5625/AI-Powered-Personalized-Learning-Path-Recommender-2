import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ReactFlow, Background, Controls, MiniMap, Handle, Position, MarkerType, type Node, type Edge, type NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CheckCircle2, Clock, Lock, Play, Check, Sparkles, ExternalLink, RefreshCw, X, ArrowRight } from 'lucide-react';
import { useLearningPath, useRegeneratePath } from '@/hooks/api/useLearningPath';
import { useStartMilestone, useCompleteMilestone, useMilestoneFeedback } from '@/hooks/api/useProgress';
import { useMentorStore } from '@/store/useMentorStore';
import type { MilestoneResponse } from '@/types';
import { Button, Card, Eyebrow, LoadingSpinner, ErrorState, LevelBadge, ResourceTypeBadge, Badge } from '@/components/common';

interface MilestoneNodeData extends Record<string, unknown> { milestone: MilestoneResponse; isCurrent: boolean; onSelect: (m: MilestoneResponse) => void; }

const MilestoneNode: React.FC<NodeProps<Node<MilestoneNodeData>>> = ({ data }) => {
  const { milestone, isCurrent, onSelect } = data;
  const { status, sequenceOrder, course } = milestone;
  const isCompleted = status === 'COMPLETED';
  const isInProgress = status === 'IN_PROGRESS';
  return <div onClick={() => onSelect(milestone)} className={`relative w-64 cursor-pointer rounded-card border p-4 shadow-card-soft transition-[border-color,background-color,transform,box-shadow] hover:-translate-y-0.5 ${isCompleted ? 'border-success/35 bg-white text-text' : isInProgress || isCurrent ? 'border-ion bg-accent-tint text-text shadow-glow-ion' : 'border-white/15 bg-dark-2/90 text-muted hover:border-white/35'}`}>
    <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-2 !border-dark !bg-ion" />
    <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border-2 !border-dark !bg-ion" />
    <div className="mb-3 flex items-center justify-between"><span className={`font-mono text-[10px] uppercase tracking-widest ${isCompleted || isInProgress || isCurrent ? 'text-muted' : 'text-dark-text/55'}`}>Step {sequenceOrder}</span>{isCompleted ? <span className="flex items-center gap-1 font-mono text-[10px] text-success-deep"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Done</span> : isInProgress ? <span className="flex items-center gap-1 font-mono text-[10px] text-ion-deep"><Clock className="h-3.5 w-3.5" aria-hidden /> Active</span> : <span className="flex items-center gap-1 font-mono text-[10px] text-dark-text/55"><Lock className="h-3 w-3" aria-hidden /> Queued</span>}</div>
    <h4 className={`line-clamp-2 text-sm font-bold leading-tight ${isCompleted || isInProgress || isCurrent ? 'text-text' : 'text-dark-text/80'}`}>{course.title}</h4>
    <div className="mt-4 flex items-center justify-between gap-2"><LevelBadge level={course.level} /><ResourceTypeBadge type={course.resourceType} /></div>
  </div>;
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

  useEffect(() => {
    if (selectedMilestone && path) {
      const updated = path.milestones.find((m) => m.id === selectedMilestone.id);
      if (updated) setSelectedMilestone(updated);
    }
  }, [path, selectedMilestone]);

  const { nodes, edges } = useMemo(() => {
    if (!path || !path.milestones) return { nodes: [], edges: [] };
    const sorted = [...path.milestones].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    const generatedNodes: Node<MilestoneNodeData>[] = [];
    const generatedEdges: Edge[] = [];
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
      generatedNodes.push({ id: m.id, type: 'milestoneNode', position: { x: col * X_SPACING + 60, y: row * Y_SPACING + 60 }, data: { milestone: m, isCurrent: idx === currentIndex, onSelect: (milestone: MilestoneResponse) => { setSelectedMilestone(milestone); setFeedbackText(''); setFeedbackSubmitted(false); } } });
      if (idx > 0) {
        const prev = sorted[idx - 1];
        const edgeColor = prev.status === 'COMPLETED' ? '#2fae7d' : '#7fa6a6';
        generatedEdges.push({ id: `e-${prev.id}-${m.id}`, source: prev.id, target: m.id, animated: prev.status === 'COMPLETED' && m.status === 'IN_PROGRESS', style: { stroke: edgeColor, strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: edgeColor } });
      }
    });
    return { nodes: generatedNodes, edges: generatedEdges };
  }, [path]);

  if (isLoading) return <div className="flex h-[70vh] items-center justify-center"><LoadingSpinner label="Constructing Curriculum Graph..." /></div>;
  if (isError || !path) return <div className="mx-auto max-w-4xl p-6"><ErrorState title="Trajectory Graph Unavailable" message="Could not load this learning path graph." onRetry={() => refetch()} /></div>;

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilestone || !feedbackText.trim()) return;
    try { await feedbackMutation.mutateAsync({ milestoneId: selectedMilestone.id, feedbackText: feedbackText.trim() }); setFeedbackSubmitted(true); } catch { /* Existing mutation error handling remains unchanged. */ }
  };
  const handleRegenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!path || !regenerateFeedback.trim()) return;
    try { await regenerateMutation.mutateAsync({ id: path.id, feedback: regenerateFeedback.trim() }); setIsRegenerateOpen(false); setRegenerateFeedback(''); } catch { /* Existing mutation error handling remains unchanged. */ }
  };

  return <div className="relative flex min-h-[calc(100dvh-4rem)] flex-col">
    <div className="z-10 flex flex-col gap-4 border-b border-line bg-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Eyebrow>Curriculum graph</Eyebrow><Badge tone="neutral">{path.milestones.length} Milestones</Badge><span className="inline-flex items-center gap-1.5 text-xs text-success-deep"><span className="h-1.5 w-1.5 rounded-full bg-success" /> Active path</span></div><h2 className="mt-2 max-w-3xl truncate text-xl font-bold tracking-[-0.035em] text-text sm:text-2xl">{path.goalDescription}</h2></div><div className="flex shrink-0 gap-2"><Button variant="secondary" size="sm" onClick={() => setIsRegenerateOpen(true)}><RefreshCw className="h-3.5 w-3.5" aria-hidden /> Adapt Curriculum</Button><Button variant="primary" size="sm" onClick={() => openMentor({ contextType: 'GENERAL', contextTitle: `Path: ${path.goalDescription}` })}><Sparkles className="h-3.5 w-3.5" aria-hidden /> Ask Mentor</Button></div></div>
    <div className="relative min-h-[620px] flex-1 bg-dark"><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView className="bg-dark"><Background color="#2b6064" gap={24} size={1} /><Controls className="!overflow-hidden !rounded-control !border-white/15 !bg-dark-2 !text-white" /><MiniMap nodeColor={(n) => { const status = (n.data as any)?.milestone?.status; if (status === 'COMPLETED') return '#2fae7d'; if (status === 'IN_PROGRESS') return '#0f9488'; return '#31595c'; }} className="!rounded-card !border-white/15 !bg-dark-2" /></ReactFlow><div className="pointer-events-none absolute left-5 top-5 rounded-full border border-white/15 bg-dark-2/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-dark-text/75">Path flow · drag to explore</div><div className="pointer-events-none absolute bottom-5 left-5 flex items-center gap-3 rounded-full border border-white/15 bg-dark-2/85 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-dark-text/75"><span className="text-success">● Done</span><span className="text-ion">● Active</span><span>○ Queued</span></div></div>
    {selectedMilestone && <aside className="absolute right-0 top-[89px] bottom-0 z-30 w-full max-w-md overflow-y-auto border-l border-line bg-surface p-5 shadow-panel sm:p-6"><div className="mb-5 flex items-center justify-between border-b border-line pb-4"><span className="font-mono text-hud uppercase text-ion-deep">Milestone Step {selectedMilestone.sequenceOrder}</span><button onClick={() => setSelectedMilestone(null)} className="rounded-full p-2 text-muted hover:bg-surface-alt hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ion/40" aria-label="Close milestone details"><X className="h-5 w-5" aria-hidden /></button></div><div className="space-y-6"><div><div className="mb-3 flex flex-wrap items-center gap-2"><LevelBadge level={selectedMilestone.course.level} /><ResourceTypeBadge type={selectedMilestone.course.resourceType} /></div><h3 className="text-2xl font-bold leading-tight tracking-[-0.04em] text-text">{selectedMilestone.course.title}</h3></div>{selectedMilestone.explanation && <Card className="border-ion/15 bg-accent-tint/55 p-4 shadow-none"><Eyebrow>Architect rationale</Eyebrow><p className="mt-2 text-sm leading-relaxed text-ink-soft">{selectedMilestone.explanation}</p></Card>}<div className="divide-y divide-line text-sm">{selectedMilestone.course.platform && <div className="flex justify-between gap-4 py-3"><span className="text-muted">Platform</span><span className="font-semibold text-text">{selectedMilestone.course.platform}</span></div>}{selectedMilestone.course.durationHours && <div className="flex justify-between gap-4 py-3"><span className="text-muted">Estimated duration</span><span className="font-semibold text-text">{selectedMilestone.course.durationHours} hours</span></div>}{selectedMilestone.course.link && <div className="py-3"><a href={selectedMilestone.course.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-semibold text-ion-deep hover:text-ion hover:underline">Open Resource on Web <ExternalLink className="h-3.5 w-3.5" aria-hidden /></a></div>}</div><div><p className="mb-2 font-mono text-hud uppercase text-muted">Target skills</p><div className="flex flex-wrap gap-2">{selectedMilestone.course.skillTags.map((s) => <span key={s.id} className="rounded-full border border-line bg-surface-alt px-3 py-1.5 text-xs text-text">{s.name}</span>)}</div></div><div className="space-y-3 border-t border-line pt-5">{selectedMilestone.status === 'NOT_STARTED' && <Button variant="primary" size="md" className="w-full" loading={startMilestoneMutation.isPending} onClick={() => startMilestoneMutation.mutate({ milestoneId: selectedMilestone.id })}><Play className="h-4 w-4" aria-hidden /> Start Milestone</Button>}{selectedMilestone.status === 'IN_PROGRESS' && <Button variant="primary" size="md" className="w-full bg-success hover:bg-success-deep" loading={completeMilestoneMutation.isPending} onClick={() => completeMilestoneMutation.mutate({ milestoneId: selectedMilestone.id })}><Check className="h-4 w-4" aria-hidden /> Mark as Completed</Button>}<Button variant="secondary" size="md" className="w-full" onClick={() => openMentor({ contextType: 'COURSE', contextId: selectedMilestone.course.id, contextTitle: selectedMilestone.course.title })}><Sparkles className="h-4 w-4 text-ion" aria-hidden /> Ask Mentor About This Milestone</Button></div><div className="border-t border-line pt-5"><p className="mb-2 font-mono text-hud uppercase text-muted">Provide feedback</p>{feedbackSubmitted ? <p className="flex items-center gap-2 text-sm font-semibold text-success-deep"><CheckCircle2 className="h-4 w-4" aria-hidden /> Feedback recorded!</p> : <form onSubmit={handleFeedbackSubmit} className="space-y-2"><textarea rows={3} value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="Was this milestone too easy, too hard, or irrelevant?" className="w-full rounded-control border border-line bg-surface-alt p-3 text-sm text-text placeholder:text-muted-2 focus:border-ion focus:outline-none focus:ring-2 focus:ring-ion/20" /><Button type="submit" variant="ghost" size="sm" disabled={!feedbackText.trim() || feedbackMutation.isPending}>Submit Feedback <ArrowRight className="h-3.5 w-3.5" aria-hidden /></Button></form>}</div></div></aside>}
    {isRegenerateOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/40 p-4 backdrop-blur-sm"><Card className="w-full max-w-lg p-6 sm:p-8" role="dialog" aria-modal="true" aria-labelledby="adapt-path-title"><div className="flex items-start justify-between gap-4"><div><Eyebrow>Curriculum graph</Eyebrow><h3 id="adapt-path-title" className="mt-2 text-2xl font-bold tracking-tight text-text">Adapt Learning Path</h3></div><button onClick={() => setIsRegenerateOpen(false)} className="rounded-full p-2 text-muted hover:bg-surface-alt hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ion/40" aria-label="Close adapt learning path"><X className="h-5 w-5" aria-hidden /></button></div><form onSubmit={handleRegenerateSubmit} className="mt-6 space-y-4"><p className="text-sm leading-relaxed text-muted">Describe any adjustments you want made (e.g. "Focus more on Go instead of Java", "Skip beginner modules", "Add hands-on project courses").</p><textarea rows={4} value={regenerateFeedback} onChange={(e) => setRegenerateFeedback(e.target.value)} placeholder="Enter curriculum recalibration instructions..." className="w-full rounded-control border border-line bg-surface-alt p-3 text-sm text-text placeholder:text-muted-2 focus:border-ion focus:outline-none focus:ring-2 focus:ring-ion/20" autoFocus /><div className="flex justify-end gap-2 border-t border-line pt-4"><Button type="button" variant="ghost" size="sm" onClick={() => setIsRegenerateOpen(false)}>Cancel</Button><Button type="submit" variant="primary" size="sm" disabled={!regenerateFeedback.trim()} loading={regenerateMutation.isPending}>Regenerate Path <ArrowRight className="h-3.5 w-3.5" aria-hidden /></Button></div></form></Card></div>}
  </div>;
}
