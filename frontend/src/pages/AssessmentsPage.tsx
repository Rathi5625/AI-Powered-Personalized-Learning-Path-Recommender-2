import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Sparkles, CheckCircle2, Clock, X, ArrowRight } from 'lucide-react';
import { useMyAttempts, useGenerateAssessment } from '@/hooks/api/useAssessments';
import { Card, Button, Eyebrow, LoadingSpinner, ErrorState } from '@/components/common';

export default function AssessmentsPage() {
  const navigate = useNavigate();
  const { data: attemptsData, isLoading, isError, refetch } = useMyAttempts(0, 20);
  const generateMutation = useGenerateAssessment();
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [topicInput, setTopicInput] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const assessment = await generateMutation.mutateAsync({ topic: topicInput.trim() || undefined });
      setIsGenerateOpen(false);
      navigate(`/assessments/${assessment.id}`);
    } catch {
      // Existing mutation error handling remains unchanged.
    }
  };

  const attempts = attemptsData?.content || [];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      <div className="flex flex-col gap-6 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow>Evaluation system</Eyebrow>
          <h1 className="mt-2 text-4xl font-extrabold tracking-[-0.055em] text-text sm:text-5xl">Knowledge Assessments</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">Benchmark your milestone mastery with AI-generated technical evaluations</p>
        </div>
        <Button variant="primary" size="md" onClick={() => setIsGenerateOpen(true)}>
          <Sparkles className="h-4 w-4" aria-hidden /> Generate New Assessment <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
        <span className="inline-flex items-center gap-2 rounded-full border border-ion/20 bg-accent-tint px-3 py-2 font-semibold text-ion-deep"><Brain className="h-4 w-4" aria-hidden /> Evaluation log</span>
        <span><strong className="text-text">{attempts.length}</strong> completed assessments</span>
        {attempts.length > 0 && <span><strong className="text-text">{Math.round(attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length)}%</strong> average mastery</span>}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-card border border-line bg-surface"><LoadingSpinner label="Loading Assessment History..." /></div>
      ) : isError ? (
        <ErrorState title="Telemetry Unavailable" message="Could not load assessment history from the backend." onRetry={() => refetch()} />
      ) : attempts.length === 0 ? (
        <Card className="border-dashed p-12 text-center">
          <Brain className="mx-auto mb-4 h-12 w-12 text-ion/50" aria-hidden />
          <h3 className="text-xl font-bold tracking-tight text-text">No Assessments Taken Yet</h3>
          <p className="mx-auto mt-2 mb-6 max-w-sm text-sm leading-relaxed text-muted">Generate your first targeted technical evaluation to measure your curriculum comprehension.</p>
          <Button variant="primary" size="sm" onClick={() => setIsGenerateOpen(true)}>Generate First Assessment</Button>
        </Card>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between"><h2 className="font-mono text-hud uppercase text-muted">Evaluation Log</h2><span className="text-xs text-muted-2">{attempts.length} total</span></div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {attempts.map((attempt) => {
              const isPassing = attempt.percentage >= 70;
              return (
                <Card key={attempt.id} className="flex min-h-[220px] flex-col justify-between p-5 transition-[border-color,box-shadow,transform] hover:-translate-y-1 hover:border-ion/45 hover:shadow-panel">
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-muted">{new Date(attempt.completedAt).toLocaleDateString()}</span>
                      <span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold ${isPassing ? 'border-success/25 bg-success/10 text-success-deep' : 'border-ember/25 bg-ember/10 text-ember-deep'}`}>{attempt.percentage}% score</span>
                    </div>
                    <h3 className="mt-6 line-clamp-2 text-xl font-bold tracking-[-0.035em] text-text">{attempt.topic}</h3>
                  </div>
                  <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4 text-xs text-muted">
                    <span>{attempt.score} / {attempt.totalQuestions} questions correct</span>
                    {isPassing ? <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-success-deep"><CheckCircle2 className="h-4 w-4" aria-hidden /> Mastered</span> : <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase text-ember-deep"><Clock className="h-4 w-4" aria-hidden /> Reinforce</span>}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {isGenerateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/35 p-4 backdrop-blur-sm" role="presentation">
          <Card className="w-full max-w-md p-6 shadow-panel sm:p-8" role="dialog" aria-modal="true" aria-labelledby="generate-assessment-title">
            <div className="flex items-start justify-between gap-4">
              <div><Eyebrow>Evaluation system</Eyebrow><h3 id="generate-assessment-title" className="mt-2 text-2xl font-bold tracking-tight text-text">Generate Assessment</h3></div>
              <button onClick={() => setIsGenerateOpen(false)} className="rounded-full p-2 text-muted hover:bg-surface-alt hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ion/40" aria-label="Close generate assessment"><X className="h-5 w-5" aria-hidden /></button>
            </div>
            <form onSubmit={handleGenerate} className="mt-6 space-y-5">
              <p className="text-sm leading-relaxed text-muted">Leave blank to automatically synthesize an evaluation based on your active trajectory milestones, or specify a custom topic.</p>
              <div>
                <label htmlFor="assessment-topic" className="mb-1.5 block text-xs font-semibold text-ink-soft">Topic or Skill (Optional)</label>
                <input id="assessment-topic" type="text" value={topicInput} onChange={(e) => setTopicInput(e.target.value)} placeholder="e.g. Distributed Consensus, React Flow, Postgres pgvector" className="h-11 w-full rounded-control border border-line bg-surface-alt px-3.5 text-sm text-text placeholder:text-muted-2 focus:border-ion focus:outline-none focus:ring-2 focus:ring-ion/20" autoFocus />
              </div>
              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsGenerateOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" loading={generateMutation.isPending}>Generate Quiz <ArrowRight className="h-3.5 w-3.5" aria-hidden /></Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
