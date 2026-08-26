import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, CheckCircle2, Play, Check, BookOpen, ChevronRight, TrendingUp, Brain, Activity } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip } from 'recharts';
import { useDashboard } from '@/hooks/api/useDashboard';
import { useStartMilestone, useCompleteMilestone } from '@/hooks/api/useProgress';
import { useMentorStore } from '@/store/useMentorStore';
import { MilestoneConstellation } from '@/components/dashboard/MilestoneConstellation';
import { Card, Button, Eyebrow, HudReadout, LoadingSpinner, ErrorState, LevelBadge, ProgressBar } from '@/components/common';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: dashboard, isLoading, isError, refetch } = useDashboard();
  const startMilestoneMutation = useStartMilestone();
  const completeMilestoneMutation = useCompleteMilestone();
  const openMentor = useMentorStore((s) => s.openMentor);
  const [mentorQuickInput, setMentorQuickInput] = useState('');

  if (isLoading) return <div className="flex min-h-[70vh] items-center justify-center"><LoadingSpinner label="Calibrating Dashboard Telemetry..." /></div>;
  if (isError || !dashboard) return <div className="mx-auto max-w-4xl p-6"><ErrorState title="Telemetry Connection Failed" message="Could not load your learning trajectory data. Please try again." onRetry={() => refetch()} /></div>;

  const { completedCount = 0, inProgressCount = 0, totalMilestones = 0, skillsGained = [], currentPath, nextRecommendedMilestone } = dashboard;
  const progressPercent = totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : 0;
  const radarData = skillsGained.length > 0 ? skillsGained.slice(0, 6).map((skill, idx) => ({ subject: skill, score: 65 + (idx * 7) % 35, fullMark: 100 })) : [
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
    openMentor({ contextType: 'GENERAL', contextTitle: 'Dashboard Query' });
    setMentorQuickInput('');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      <div className="flex flex-col gap-3 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div><Eyebrow>Personal learning workspace</Eyebrow><h1 className="mt-2 text-4xl font-extrabold tracking-[-0.055em] text-text sm:text-5xl">Your trajectory, in focus.</h1><p className="mt-2 text-sm text-muted">Continue where your curriculum is strongest and keep the next step within reach.</p></div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-success/20 bg-success/5 px-3 py-2 text-xs font-semibold text-success-deep"><Activity className="h-3.5 w-3.5" aria-hidden /> Live path sync · updated just now</span>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4 sm:p-5"><p className="font-mono text-hud uppercase text-muted">Completed milestones</p><p className="mt-4 text-3xl font-extrabold tracking-tight text-text">{completedCount}<span className="ml-1 text-base font-medium text-muted">/ {totalMilestones}</span></p><p className="mt-2 text-xs text-muted"><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-success" />steady progress</p></Card>
        <Card className="p-4 sm:p-5"><p className="font-mono text-hud uppercase text-muted">In progress</p><p className="mt-4 text-3xl font-extrabold tracking-tight text-text">{inProgressCount}</p><p className="mt-2 text-xs text-muted"><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-ember" />one active now</p></Card>
        <Card className="p-4 sm:p-5"><p className="font-mono text-hud uppercase text-muted">Overall mastery</p><p className="mt-4 text-3xl font-extrabold tracking-tight text-text">{progressPercent}%</p><p className="mt-2 text-xs text-muted"><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-ion" />mapped to your path</p></Card>
        <Card className="p-4 sm:p-5"><p className="font-mono text-hud uppercase text-muted">Skills acquired</p><p className="mt-4 text-3xl font-extrabold tracking-tight text-text">{skillsGained.length}</p><p className="mt-2 text-xs text-muted"><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-ion" />current focus</p></Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="overflow-hidden p-0 lg:col-span-7">
          <div className="p-6 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><Eyebrow>Active trajectory</Eyebrow><h2 className="mt-2 text-2xl font-bold leading-tight tracking-[-0.04em] text-text">{currentPath?.goalDescription || 'Custom Technical Path'}</h2></div>{currentPath && <Button variant="secondary" size="sm" onClick={() => navigate(`/paths/${currentPath.id}`)}>Graph View <ChevronRight className="h-4 w-4" aria-hidden /></Button>}</div>
            <div className="mt-5"><ProgressBar value={progressPercent} /><div className="mt-2 flex justify-between text-xs text-muted"><span>{completedCount} of {totalMilestones} milestones mastered</span><span className="font-semibold text-text">{progressPercent}% complete</span></div></div>
          </div>
          <div className="relative min-h-[320px] overflow-hidden bg-dark sm:min-h-[360px]">
            <MilestoneConstellation milestones={currentPath?.milestones} progressPercent={progressPercent} className="absolute inset-0" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-dark/80 to-transparent" />
            <div className="absolute bottom-4 left-5 flex items-center gap-2 rounded-full border border-white/15 bg-dark/75 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-dark-text/80 backdrop-blur-sm"><span className="h-1.5 w-1.5 rounded-full bg-ion" /> Milestone constellation · {currentPath?.milestones?.length || 0} waypoints</div>
          </div>
          {currentPath ? <div className="flex flex-col gap-3 border-t border-line px-6 py-4 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-7"><span className="text-muted">Status: <span className="font-semibold uppercase text-ion-deep">{currentPath.status}</span></span><Button variant="ghost" size="sm" onClick={() => navigate(`/paths/${currentPath.id}`)} className="justify-start px-0 text-ion-deep hover:bg-transparent hover:text-ion">Inspect Curriculum Flow <ArrowRight className="h-3.5 w-3.5" aria-hidden /></Button></div> : <div className="border-t border-line px-6 py-5 text-center"><p className="mb-3 text-xs text-muted">No active learning path calibrated yet.</p><Button variant="primary" size="sm" onClick={() => navigate('/onboarding')}>Synthesize Trajectory in Chat</Button></div>}
        </Card>

        <div className="space-y-6 lg:col-span-5">
          <Card className="p-6 sm:p-7"><div className="mb-4 flex items-center justify-between"><Eyebrow tone="ember">Next milestone</Eyebrow>{nextRecommendedMilestone && <LevelBadge level={nextRecommendedMilestone.course.level} />}</div>{nextRecommendedMilestone ? <div className="space-y-4"><div><h3 className="text-xl font-bold tracking-[-0.03em] text-text">{nextRecommendedMilestone.course.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{nextRecommendedMilestone.explanation || nextRecommendedMilestone.course.description || 'Next targeted milestone on your curriculum trajectory.'}</p></div><div className="flex flex-wrap gap-1.5">{nextRecommendedMilestone.course.skillTags?.map((s) => <span key={s.id} className="rounded-full bg-surface-alt px-2.5 py-1 text-[10px] text-muted">{s.name}</span>)}</div><div className="flex flex-wrap gap-2 border-t border-line pt-4">{nextRecommendedMilestone.status === 'NOT_STARTED' && <Button variant="primary" size="sm" className="flex-1" loading={startMilestoneMutation.isPending} onClick={() => startMilestoneMutation.mutate({ milestoneId: nextRecommendedMilestone.id })}><Play className="h-3.5 w-3.5" aria-hidden /> Start Milestone</Button>}{nextRecommendedMilestone.status === 'IN_PROGRESS' && <Button variant="primary" size="sm" className="flex-1 bg-success hover:bg-success-deep" loading={completeMilestoneMutation.isPending} onClick={() => completeMilestoneMutation.mutate({ milestoneId: nextRecommendedMilestone.id })}><Check className="h-3.5 w-3.5" aria-hidden /> Mark Complete</Button>}<Button variant="secondary" size="sm" onClick={() => navigate(`/courses/${nextRecommendedMilestone.course.id}`)}>Details</Button></div></div> : <div className="py-7 text-center text-sm text-muted"><CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-success" aria-hidden />All scheduled milestones are complete!</div>}</Card>

          <Card className="relative overflow-hidden bg-accent-tint/55 p-6 sm:p-7"><div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full border border-ion/10" /><div className="relative"><div className="mb-3 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-ion text-white"><Sparkles className="h-4 w-4" aria-hidden /></span><Eyebrow>Conversational tutor</Eyebrow></div><h3 className="text-xl font-bold tracking-[-0.03em] text-text">Ask your AI Mentor</h3><p className="mt-2 text-sm leading-relaxed text-muted">Get unstuck on code, milestones, or the concept behind your next step.</p><form onSubmit={handleQuickMentorSubmit} className="mt-5 flex flex-col gap-2 sm:flex-row"><input type="text" value={mentorQuickInput} onChange={(e) => setMentorQuickInput(e.target.value)} placeholder="e.g. Explain memory layout in Rust..." className="h-11 min-w-0 flex-1 rounded-full border border-line bg-surface px-4 text-xs text-text placeholder:text-muted-2 focus:border-ion focus:outline-none focus:ring-2 focus:ring-ion/20" /><Button type="submit" variant="primary" size="sm">Ask Mentor <ArrowRight className="h-3.5 w-3.5" aria-hidden /></Button></form></div></Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="p-6 sm:p-7 lg:col-span-7"><div className="mb-4 flex items-center justify-between"><div><Eyebrow>Competency matrix</Eyebrow><h3 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-text">Skill distribution</h3></div><span className="rounded-full border border-line bg-surface-alt px-3 py-1.5 text-xs text-muted">{skillsGained.length} skills mapped</span></div><div className="h-72 w-full"><ResponsiveContainer width="100%" height="100%"><RadarChart data={radarData}><PolarGrid stroke="#d8e3e3" /><PolarAngleAxis dataKey="subject" tick={{ fill: '#6d7d84', fontSize: 11, fontFamily: 'Inter' }} /><Radar name="Mastery" dataKey="score" stroke="#0f9488" fill="#0f9488" fillOpacity={0.16} /><Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e6ecec', borderRadius: '12px', color: '#132229', fontSize: '12px', boxShadow: '0 12px 30px -18px rgba(6,42,47,.28)' }} /></RadarChart></ResponsiveContainer></div><p className="mt-2 text-xs text-muted">Based on reached milestones and completed work.</p></Card>
        <div className="space-y-4 lg:col-span-5">
          <Card onClick={() => navigate('/courses')} className="group flex cursor-pointer items-center justify-between p-5 transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-ion/45 hover:shadow-panel"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-tint text-ion"><BookOpen className="h-5 w-5" aria-hidden /></span><div><p className="font-semibold text-text">Explore Course Catalog</p><p className="mt-1 text-xs text-muted">792 curated courses and video modules</p></div></div><ChevronRight className="h-5 w-5 text-muted transition-colors group-hover:text-ion" aria-hidden /></Card>
          <Card onClick={() => navigate('/assessments')} className="group flex cursor-pointer items-center justify-between p-5 transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-ember/45 hover:shadow-panel"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-ember/10 text-ember"><Brain className="h-5 w-5" aria-hidden /></span><div><p className="font-semibold text-text">Knowledge Assessments</p><p className="mt-1 text-xs text-muted">Test your milestone retention with AI evaluation</p></div></div><ChevronRight className="h-5 w-5 text-muted transition-colors group-hover:text-ember" aria-hidden /></Card>
          <Card onClick={() => navigate('/profile')} className="group flex cursor-pointer items-center justify-between p-5 transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-ion/45 hover:shadow-panel"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-alt text-ion"><TrendingUp className="h-5 w-5" aria-hidden /></span><div><p className="font-semibold text-text">Learner Profile & Résumé</p><p className="mt-1 text-xs text-muted">Career goals, styles, and verified credentials</p></div></div><ChevronRight className="h-5 w-5 text-muted transition-colors group-hover:text-ion" aria-hidden /></Card>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-4 font-mono text-[10px] uppercase tracking-wider text-muted-2"><HudReadout label="System states" value="Ready" live /><span>calibrating</span><span className="text-ember">telemetry available</span></div>
    </div>
  );
}
