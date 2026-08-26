import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Sparkles, ArrowRight, Circle } from 'lucide-react';
import { useAssessment, useSubmitAssessment } from '@/hooks/api/useAssessments';
import { useMentorStore } from '@/store/useMentorStore';
import type { AssessmentAttemptResponse } from '@/types';
import { Card, Button, Eyebrow, LoadingSpinner, ErrorState, LevelBadge, ProgressBar } from '@/components/common';

export default function AssessmentTakePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const openMentor = useMentorStore((s) => s.openMentor);
  const { data: assessment, isLoading, isError, refetch } = useAssessment(id);
  const submitMutation = useSubmitAssessment();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [attemptResult, setAttemptResult] = useState<AssessmentAttemptResponse | null>(null);

  if (isLoading) return <div className="flex h-[70vh] items-center justify-center"><LoadingSpinner label="Calibrating Assessment Parameters..." /></div>;
  if (isError || !assessment) return <div className="mx-auto max-w-4xl p-6"><ErrorState title="Assessment Not Found" message="Could not load questions for this evaluation." onRetry={() => refetch()} /></div>;

  const { questions, topic, level } = assessment;
  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQuestions = questions.length;
  const allAnswered = answeredCount === totalQuestions;

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (attemptResult) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = async () => {
    if (!id || !allAnswered) return;
    try {
      const answersPayload = questions.map((q) => ({ questionId: q.id, selectedOptionIndex: selectedAnswers[q.id] ?? 0 }));
      const res = await submitMutation.mutateAsync({ id, answers: answersPayload });
      setAttemptResult(res);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // Existing mutation error handling remains unchanged.
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-7 px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
      <Link to="/assessments" className="inline-flex items-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-ion-deep"><ArrowLeft className="h-4 w-4" aria-hidden /> Back to Assessments</Link>

      <div className="flex flex-col gap-6 border-b border-line pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div><Eyebrow>Active evaluation</Eyebrow><h1 className="mt-2 max-w-4xl text-4xl font-extrabold leading-[0.98] tracking-[-0.06em] text-text sm:text-6xl">{topic}</h1><p className="mt-3 text-sm text-muted">Work through each question at your own pace. Your answers lock after grading.</p></div>
        <div className="flex items-center gap-3"><LevelBadge level={level} /><div className="min-w-[170px] rounded-card border border-line bg-surface p-3 shadow-card-soft"><div className="flex justify-between text-[11px] font-semibold text-muted"><span>Progress</span><span className="text-text">{answeredCount} / {totalQuestions} Answered</span></div><ProgressBar value={totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0} className="mt-2" /></div></div>
      </div>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-card border border-line bg-surface-alt p-5 shadow-card-soft">
            <Eyebrow tone="muted">Evaluation map</Eyebrow>
            <div className="mt-5 space-y-3">
              {questions.map((q, index) => {
                const answered = selectedAnswers[q.id] !== undefined;
                return <div key={q.id} className="flex items-center gap-2.5 text-xs"><span className={`flex h-6 w-6 items-center justify-center rounded-full border ${answered ? 'border-ion bg-ion text-white' : 'border-line bg-surface text-muted'}`}>{answered ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : index + 1}</span><span className={answered ? 'font-semibold text-text' : 'text-muted'}>Question {index + 1}</span></div>;
              })}
            </div>
            <div className="mt-6 rounded-control bg-dark p-4 text-dark-text"><p className="font-mono text-[10px] uppercase tracking-wider text-dark-text/60">Assessment scope</p><p className="mt-2 text-xs font-semibold leading-relaxed">Questions are generated from the skills reached on your current learning path.</p></div>
          </div>
        </aside>

        <div className="space-y-5">
          {questions.map((q, qIndex) => {
            const gradedAnswer = attemptResult?.answers?.find((a) => a.questionId === q.id);
            const selectedOption = selectedAnswers[q.id];
            return (
              <Card key={q.id} className={`p-5 sm:p-7 ${gradedAnswer ? gradedAnswer.correct ? 'border-success/35' : 'border-danger/35' : ''}`}>
                <div className="flex items-start justify-between gap-4"><span className="font-mono text-hud uppercase text-ion-deep">Question {String(qIndex + 1).padStart(2, '0')}</span>{gradedAnswer && <span className={`flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase ${gradedAnswer.correct ? 'text-success-deep' : 'text-danger'}`}>{gradedAnswer.correct ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <XCircle className="h-4 w-4" aria-hidden />}{gradedAnswer.correct ? 'Correct' : 'Incorrect'}</span>}</div>
                <h3 className="mt-5 text-lg font-bold leading-relaxed tracking-[-0.02em] text-text">{q.promptText}</h3>
                <div className="mt-5 space-y-2.5">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = selectedOption === optIdx;
                    const isCorrectAnswer = gradedAnswer && gradedAnswer.correctOptionIndex === optIdx;
                    const isUserWrongChoice = gradedAnswer && !gradedAnswer.correct && isSelected;
                    let optionStyle = 'border-line bg-surface-alt text-muted hover:border-ion/40 hover:bg-accent-tint/50';
                    if (isSelected && !gradedAnswer) optionStyle = 'border-ion bg-accent-tint text-ion-deep shadow-card-soft';
                    else if (isCorrectAnswer) optionStyle = 'border-success/40 bg-success/10 text-text';
                    else if (isUserWrongChoice) optionStyle = 'border-danger/40 bg-danger/5 text-text line-through';
                    return <button key={optIdx} type="button" disabled={Boolean(attemptResult)} onClick={() => handleSelectOption(q.id, optIdx)} className={`flex w-full items-center gap-3 rounded-control border p-3.5 text-left text-sm transition-[border-color,background-color,box-shadow] ${optionStyle}`}><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] ${isSelected || isCorrectAnswer ? 'border-current' : 'border-line'}`}>{isCorrectAnswer ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : isUserWrongChoice ? <XCircle className="h-3.5 w-3.5" aria-hidden /> : String.fromCharCode(65 + optIdx)}</span><span className="flex-1 leading-relaxed">{opt}</span>{isSelected && !gradedAnswer && <Circle className="h-3 w-3 fill-current" aria-hidden />}</button>;
                  })}
                </div>
                {gradedAnswer && gradedAnswer.explanation && <div className="mt-5 rounded-control border border-line bg-surface-alt p-4 text-sm leading-relaxed text-ink-soft"><span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ion-deep">Explanation: </span>{gradedAnswer.explanation}</div>}
              </Card>
            );
          })}

          {!attemptResult && <Card className="flex flex-col gap-4 border-ion/20 bg-accent-tint/50 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-text">Ready to submit?</p><p className="mt-1 text-xs text-muted">Answer all {totalQuestions} questions to unlock grading and explanations.</p></div><Button variant="primary" size="md" disabled={!allAnswered} loading={submitMutation.isPending} onClick={handleSubmit}>Submit Assessment for Grading <ArrowRight className="h-4 w-4" aria-hidden /></Button></Card>}

          {attemptResult && <Card className="bg-dark p-6 text-dark-text shadow-panel"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><Eyebrow className="text-dark-text/60">Evaluation results</Eyebrow><h2 className="mt-2 text-2xl font-bold tracking-tight text-white">Score: {attemptResult.score} / {attemptResult.totalQuestions} ({attemptResult.percentage}%)</h2><p className="mt-2 text-sm text-dark-text/75">{attemptResult.percentage >= 70 ? 'Congratulations! You have demonstrated strong competency in this domain.' : 'Review the question explanations below to reinforce concepts.'}</p></div><div className="flex flex-wrap gap-2"><Button variant="secondary" size="sm" onClick={() => openMentor({ contextType: 'ASSESSMENT', contextId: id, contextTitle: `Assessment: ${topic}` })}><Sparkles className="h-4 w-4 text-ion" aria-hidden /> Ask Mentor for Help</Button><Button variant="secondary" size="sm" onClick={() => navigate('/assessments')}>Done <ArrowRight className="h-4 w-4" aria-hidden /></Button></div></div></Card>}
        </div>
      </div>
    </div>
  );
}
