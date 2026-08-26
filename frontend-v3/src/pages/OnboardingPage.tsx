import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, CheckCircle2, MessageCircle, Route, Target } from 'lucide-react';
import { useSendChatMessage } from '@/hooks/api/useChat';
import { useAuthStore } from '@/store/useAuthStore';
import { ChatThread, ChatComposer, SuggestionList, type ChatTurn } from '@/components/chat/ChatThread';
import { Card, Button, Eyebrow } from '@/components/common';

const STARTER_PROMPTS = [
  'I want to transition from frontend development to machine learning engineering.',
  'I am a beginner in Python and want to learn backend systems and distributed architectures.',
  'I want to master cloud-native Kubernetes, DevOps pipelines, and site reliability engineering.',
  'I know Java and SQL and want to become a full-stack Spring Boot + React developer.',
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const sendMutation = useSendChatMessage();

  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const [input, setInput] = useState('');
  const [generatedPathId, setGeneratedPathId] = useState<string | null>(null);

  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hello ${user?.fullName || 'there'}! I am your AI Trajectory Architect.\n\nTell me about your background, the technical role you want to achieve, and your preferred learning style (e.g. video courses, project-based exercises). I will analyze your goals and synthesize your curriculum.`,
    },
  ]);

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || sendMutation.isPending) return;

    const userTurnId = crypto.randomUUID();
    const assistantTurnId = crypto.randomUUID();

    const nextTurns: ChatTurn[] = [
      ...turns,
      { id: userTurnId, role: 'user', text: textToSend },
      { id: assistantTurnId, role: 'assistant', text: '', pending: true },
    ];

    setTurns(nextTurns);
    setInput('');

    try {
      const res = await sendMutation.mutateAsync({
        message: textToSend,
        sessionId: sessionIdRef.current,
      });

      setTurns((current) =>
        current.map((t) => (t.id === assistantTurnId ? { ...t, text: res.reply, pending: false } : t)),
      );

      if (res.learningPathId) {
        setGeneratedPathId(res.learningPathId);
      }
    } catch (err: any) {
      setTurns((current) =>
        current.map((t) =>
          t.id === assistantTurnId
            ? {
                ...t,
                text: err.response?.data?.message || 'I encountered an error synthesizing your request. Please try rephrasing your goal.',
                pending: false,
              }
            : t,
        ),
      );
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Eyebrow>Intake synthesis</Eyebrow>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.045em] text-text sm:text-4xl">Calibrate Your Trajectory</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            A short conversation turns your experience, goals, and preferred learning style into a path you can actually follow.
          </p>
        </div>
        {generatedPathId ? (
          <Button variant="primary" size="md" onClick={() => navigate(`/paths/${generatedPathId}`)}>
            <Sparkles className="h-4 w-4" aria-hidden />
            Explore Path
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
            Skip to Dashboard
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Button>
        )}
      </div>

      {generatedPathId && (
        <Card className="flex flex-col gap-4 border-success/25 bg-success/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success/10 text-success-deep">
              <CheckCircle2 className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-text">Your Learning Path is Ready!</p>
              <p className="text-xs text-muted">Milestones and skill dependencies have been generated for you.</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate(`/paths/${generatedPathId}`)}>
            View Graph
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </Card>
      )}

      <div className="grid min-h-[620px] flex-1 grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="relative overflow-hidden rounded-card bg-dark p-6 text-dark-text shadow-panel sm:p-7">
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full border border-white/10" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-ion">
                <MessageCircle className="h-5 w-5" aria-hidden />
              </span>
              <Eyebrow className="mt-8 text-dark-text/65">Your intake covers</Eyebrow>
              <h2 className="mt-3 text-2xl font-extrabold leading-tight tracking-[-0.04em] text-white">One clear goal. A smarter starting point.</h2>
              <p className="mt-4 text-sm leading-relaxed text-dark-text/70">
                Tell your AI Trajectory Architect where you are today and where you want to go. It handles the order from there.
              </p>
            </div>
            <div className="mt-10 space-y-4 border-t border-white/10 pt-5">
              {[
                ['01', 'Background & experience'],
                ['02', 'Target technical role'],
                ['03', 'Preferred learning style'],
              ].map(([number, label]) => (
                <div key={number} className="flex items-center gap-3 text-sm text-dark-text/80">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 font-mono text-[10px] text-white">{number}</span>
                  {label}
                </div>
              ))}
              <div className="mt-5 rounded-control border border-white/15 bg-white/10 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <Target className="h-4 w-4 text-ember" aria-hidden />
                  Path synthesis
                </div>
                <p className="mt-2 text-xs leading-relaxed text-dark-text/65">Milestones are scoped to your current reach and updated as you learn.</p>
              </div>
            </div>
          </div>
        </aside>

        <Card className="flex min-h-[620px] flex-col overflow-hidden p-4 sm:p-6">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-tint text-ion">
                <Sparkles className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-text">AI Trajectory Architect</p>
                <p className="text-xs text-muted">Personalized intake · replies in seconds</p>
              </div>
            </div>
            <span className="hidden rounded-full border border-success/20 bg-success/5 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-success-deep sm:inline-flex">Conversation active</span>
          </div>

          <ChatThread
            turns={turns}
            className="py-5 pr-1 sm:px-2"
            empty={
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Route className="mb-3 h-10 w-10 text-ion/50" aria-hidden />
                <p className="text-sm text-muted">Awaiting intake parameters...</p>
              </div>
            }
          />

          {turns.length <= 2 && !generatedPathId && (
            <div className="mt-2 border-t border-line pt-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-mono text-hud uppercase text-muted">Example ambitions</p>
                <span className="text-[11px] text-muted-2">Pick one to begin</span>
              </div>
              <SuggestionList suggestions={STARTER_PROMPTS} onPick={(text) => handleSend(text)} />
            </div>
          )}

          <ChatComposer
            value={input}
            onChange={setInput}
            onSubmit={() => handleSend()}
            disabled={sendMutation.isPending}
            placeholder="Describe your goals, experience level, and timeline..."
            autoFocus
          />
          <p className="mt-2 text-center text-[11px] text-muted-2">Press Enter to send · Shift + Enter for a new line</p>
        </Card>
      </div>
    </div>
  );
}
