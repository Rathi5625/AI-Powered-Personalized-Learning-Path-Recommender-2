import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Compass, CheckCircle2 } from 'lucide-react';
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

  // Persistent sessionId across chat turns
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
        current.map((t) =>
          t.id === assistantTurnId
            ? { ...t, text: res.reply, pending: false }
            : t
        )
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
                text:
                  err.response?.data?.message ||
                  'I encountered an error synthesizing your request. Please try rephrasing your goal.',
                pending: false,
              }
            : t
        )
      );
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-5rem)] max-w-4xl flex-col p-4 sm:p-6 lg:p-8">
      {/* Header Banner */}
      <div className="mb-4 flex items-center justify-between border-b border-line pb-4">
        <div>
          <div className="mb-1">
            <Eyebrow tone="ion">INTAKE SYNTHESIS</Eyebrow>
          </div>
          <h1 className="font-display text-2xl text-text sm:text-3xl">
            Calibrate Your Trajectory
          </h1>
        </div>

        {generatedPathId ? (
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate(`/paths/${generatedPathId}`)}
            className="shadow-glow-ion animate-pulse-soft"
          >
            <Sparkles className="h-4 w-4 mr-1 text-void" />
            Explore Path
            <ArrowRight className="h-4 w-4 ml-1 text-void" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="text-muted"
          >
            Skip to Dashboard
          </Button>
        )}
      </div>

      {/* Trajectory Generated Banner (if active) */}
      {generatedPathId && (
        <Card className="mb-4 flex items-center justify-between border-ion/40 bg-ion/10 p-4 animate-fade-up">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-ion shrink-0" />
            <div>
              <p className="text-sm font-semibold text-text">
                Your Learning Path is Ready!
              </p>
              <p className="text-xs text-muted">
                Milestones and skill dependencies have been generated for you.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/paths/${generatedPathId}`)}
          >
            View Graph
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </Card>
      )}

      {/* Main Conversation Container */}
      <Card className="flex flex-1 flex-col overflow-hidden border-line bg-surface/95 p-4 sm:p-6 shadow-panel">
        <ChatThread
          turns={turns}
          className="pr-2"
          empty={
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Compass className="h-10 w-10 text-ion/40 mb-3 animate-spin" />
              <p className="text-sm text-muted">Awaiting intake parameters...</p>
            </div>
          }
        />

        {/* Suggestion Chips when turns are few */}
        {turns.length <= 2 && !generatedPathId && (
          <div className="mt-4 pt-4 border-t border-line/60">
            <p className="font-mono text-xs text-muted mb-2 uppercase tracking-wider">
              Example Ambitions:
            </p>
            <SuggestionList
              suggestions={STARTER_PROMPTS}
              onPick={(text) => handleSend(text)}
            />
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
      </Card>
    </div>
  );
}
