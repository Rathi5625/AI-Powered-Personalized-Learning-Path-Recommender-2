import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAssessment, useSubmitAssessment } from '@/hooks/api/useAssessments';
import { useMentorStore } from '@/store/useMentorStore';
import type { AssessmentAttemptResponse } from '@/types';
import {
  Card,
  Button,
  Eyebrow,
  LoadingSpinner,
  ErrorState,
  LevelBadge,
  ProgressBar,
} from '@/components/common';

export default function AssessmentTakePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const openMentor = useMentorStore((s) => s.openMentor);

  const { data: assessment, isLoading, isError, refetch } = useAssessment(id);
  const submitMutation = useSubmitAssessment();

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [attemptResult, setAttemptResult] = useState<AssessmentAttemptResponse | null>(null);

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <LoadingSpinner label="Calibrating Assessment Parameters..." />
      </div>
    );
  }

  if (isError || !assessment) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <ErrorState
          title="Assessment Not Found"
          message="Could not load questions for this evaluation."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const { questions, topic, level } = assessment;
  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQuestions = questions.length;
  const allAnswered = answeredCount === totalQuestions;

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (attemptResult) return; // Locked after grading
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmit = async () => {
    if (!id || !allAnswered) return;
    try {
      const answersPayload = questions.map((q) => ({
        questionId: q.id,
        selectedOptionIndex: selectedAnswers[q.id] ?? 0,
      }));

      const res = await submitMutation.mutateAsync({
        id,
        answers: answersPayload,
      });

      setAttemptResult(res);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // Ignored
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Back button */}
      <div>
        <Link
          to="/assessments"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assessments
        </Link>
      </div>

      {/* Header Banner */}
      <Card className="border-line bg-surface/90 p-6 shadow-panel">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Eyebrow tone="ion">ACTIVE EVALUATION</Eyebrow>
              <LevelBadge level={level} />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl text-text">{topic}</h1>
          </div>

          <div className="text-right">
            <span className="font-mono text-xs text-muted">Progress</span>
            <p className="font-mono text-base text-ion">
              {answeredCount} / {totalQuestions} Answered
            </p>
          </div>
        </div>

        <div className="mt-4">
          <ProgressBar
            value={totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}
            tone="ion"
          />
        </div>
      </Card>

      {/* Post-submission Result Scoreboard */}
      {attemptResult && (
        <Card
          className={`border p-6 shadow-panel animate-fade-up ${
            attemptResult.percentage >= 70
              ? 'border-success/50 bg-success/10'
              : 'border-ember/50 bg-ember/10'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-muted">
                Evaluation Results
              </span>
              <h2 className="font-display text-3xl text-text mt-1">
                Score: {attemptResult.score} / {attemptResult.totalQuestions} ({attemptResult.percentage}%)
              </h2>
              <p className="text-xs text-muted mt-1">
                {attemptResult.percentage >= 70
                  ? 'Congratulations! You have demonstrated strong competency in this domain.'
                  : 'Review the question explanations below to reinforce concepts.'}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  openMentor({
                    contextType: 'ASSESSMENT',
                    contextId: id,
                    contextTitle: `Assessment: ${topic}`,
                  })
                }
              >
                <Sparkles className="h-4 w-4 mr-1 text-ion" />
                Ask Mentor for Help
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/assessments')}
              >
                Done
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Questions list */}
      <div className="space-y-6">
        {questions.map((q, qIndex) => {
          const gradedAnswer = attemptResult?.answers?.find((a) => a.questionId === q.id);
          const selectedOption = selectedAnswers[q.id];

          return (
            <Card
              key={q.id}
              className={`p-6 border-line bg-surface/90 shadow-panel transition-all ${
                gradedAnswer
                  ? gradedAnswer.correct
                    ? 'border-success/40'
                    : 'border-danger/40'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <span className="font-mono text-xs text-ion uppercase tracking-widest">
                  Question {qIndex + 1}
                </span>

                {gradedAnswer && (
                  <span
                    className={`flex items-center gap-1 font-mono text-xs font-semibold ${
                      gradedAnswer.correct ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {gradedAnswer.correct ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Correct
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" /> Incorrect
                      </>
                    )}
                  </span>
                )}
              </div>

              <h3 className="text-base font-semibold text-text mb-4 leading-relaxed">
                {q.promptText}
              </h3>

              {/* Options */}
              <div className="space-y-2.5">
                {q.options.map((opt, optIdx) => {
                  const isSelected = selectedOption === optIdx;
                  const isCorrectAnswer =
                    gradedAnswer && gradedAnswer.correctOptionIndex === optIdx;
                  const isUserWrongChoice =
                    gradedAnswer && !gradedAnswer.correct && isSelected;

                  let optionStyle =
                    'border-line bg-surface-2 text-muted hover:border-line-soft';
                  if (isSelected && !gradedAnswer) {
                    optionStyle = 'border-ion bg-ion/15 text-text shadow-glow-ion';
                  } else if (isCorrectAnswer) {
                    optionStyle = 'border-success/60 bg-success/20 text-text font-medium';
                  } else if (isUserWrongChoice) {
                    optionStyle = 'border-danger/60 bg-danger/20 text-text line-through';
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={Boolean(attemptResult)}
                      onClick={() => handleSelectOption(q.id, optIdx)}
                      className={`flex w-full items-center gap-3 rounded-lg border p-3.5 text-left text-xs transition-all ${optionStyle}`}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line font-mono text-[11px]">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="flex-1 leading-relaxed">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Revealed Explanation */}
              {gradedAnswer && gradedAnswer.explanation && (
                <div className="mt-4 border-t border-line/60 pt-3 text-xs text-text/80 leading-relaxed bg-surface-2 p-3 rounded-lg">
                  <span className="font-mono text-ion text-[11px] uppercase block mb-1">
                    Explanation:
                  </span>
                  {gradedAnswer.explanation}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Submit Button */}
      {!attemptResult && (
        <div className="flex justify-end pt-4">
          <Button
            variant="primary"
            size="lg"
            disabled={!allAnswered}
            loading={submitMutation.isPending}
            onClick={handleSubmit}
            className="w-full sm:w-auto shadow-glow-ion"
          >
            Submit Assessment for Grading
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
