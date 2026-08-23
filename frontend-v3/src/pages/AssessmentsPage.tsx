import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Sparkles,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';
import { useMyAttempts, useGenerateAssessment } from '@/hooks/api/useAssessments';
import {
  Card,
  Button,
  Eyebrow,
  LoadingSpinner,
  ErrorState,
} from '@/components/common';

export default function AssessmentsPage() {
  const navigate = useNavigate();
  const { data: attemptsData, isLoading, isError, refetch } = useMyAttempts(0, 20);
  const generateMutation = useGenerateAssessment();

  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [topicInput, setTopicInput] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const assessment = await generateMutation.mutateAsync({
        topic: topicInput.trim() || undefined,
      });
      setIsGenerateOpen(false);
      navigate(`/assessments/${assessment.id}`);
    } catch {
      // Ignored
    }
  };

  const attempts = attemptsData?.content || [];

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-6">
        <div>
          <Eyebrow tone="ion">EVALUATION SYSTEM</Eyebrow>
          <h1 className="font-display text-3xl text-text mt-1">Knowledge Assessments</h1>
          <p className="text-sm text-muted">
            Benchmark your milestone mastery with AI-generated technical evaluations
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsGenerateOpen(true)}
          className="shadow-glow-ion"
        >
          <Sparkles className="h-4 w-4 mr-1.5 text-void" />
          Generate New Assessment
        </Button>
      </div>

      {/* Attempts History */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner label="Loading Assessment History..." />
        </div>
      ) : isError ? (
        <ErrorState
          title="Telemetry Unavailable"
          message="Could not load assessment history from the backend."
          onRetry={() => refetch()}
        />
      ) : attempts.length === 0 ? (
        <Card className="border-line bg-surface/90 p-12 text-center shadow-panel">
          <Brain className="h-12 w-12 text-ion/40 mx-auto mb-4" />
          <h3 className="text-lg font-display text-text">No Assessments Taken Yet</h3>
          <p className="text-xs text-muted max-w-sm mx-auto mt-1 mb-6">
            Generate your first targeted technical evaluation to measure your curriculum comprehension.
          </p>
          <Button variant="primary" size="sm" onClick={() => setIsGenerateOpen(true)}>
            Generate First Assessment
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="font-mono text-xs text-muted uppercase tracking-wider">
            Evaluation Log ({attempts.length} Total)
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {attempts.map((attempt) => {
              const isPassing = attempt.percentage >= 70;
              return (
                <Card
                  key={attempt.id}
                  className="flex flex-col justify-between border-line bg-surface/90 p-5 shadow-panel hover:border-line-soft transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-[11px] text-muted">
                        {new Date(attempt.completedAt).toLocaleDateString()}
                      </span>
                      <span
                        className={`font-mono text-xs font-semibold px-2 py-0.5 rounded border ${
                          isPassing
                            ? 'border-success/50 bg-success/15 text-success'
                            : 'border-ember/50 bg-ember/15 text-ember'
                        }`}
                      >
                        {attempt.percentage}% SCORE
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-text line-clamp-2">
                      {attempt.topic}
                    </h3>
                  </div>

                  <div className="mt-4 pt-4 border-t border-line/60 flex items-center justify-between text-xs text-muted">
                    <span>
                      {attempt.score} / {attempt.totalQuestions} Questions Correct
                    </span>
                    {isPassing ? (
                      <span className="flex items-center gap-1 text-success text-[11px] font-mono">
                        <CheckCircle2 className="h-3.5 w-3.5" /> MASTERED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-ember text-[11px] font-mono">
                        <Clock className="h-3.5 w-3.5" /> REINFORCE
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Generate Assessment Modal */}
      {isGenerateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-md p-4">
          <Card className="w-full max-w-md border-line bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display text-text">Generate Assessment</h3>
              <button
                onClick={() => setIsGenerateOpen(false)}
                className="text-muted hover:text-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <p className="text-xs text-muted">
                Leave blank to automatically synthesize an evaluation based on your active trajectory milestones, or specify a custom topic.
              </p>

              <div>
                <label className="block text-xs font-mono text-muted uppercase mb-1">
                  Topic or Skill (Optional)
                </label>
                <input
                  type="text"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder="e.g. Distributed Consensus, React Flow, Postgres pgvector"
                  className="w-full rounded-lg border border-line bg-surface-2 p-2.5 text-xs text-text placeholder:text-muted focus:border-ion focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsGenerateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={generateMutation.isPending}
                >
                  Generate Quiz
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
