import { useState, useRef } from 'react';
import { Sparkles, Trash2 } from 'lucide-react';
import { useSendMentorMessage } from '@/hooks/api/useMentor';
import { useMentorStore } from '@/store/useMentorStore';
import type { MentorContextType } from '@/types';
import { ChatThread, ChatComposer, SuggestionList, type ChatTurn } from '@/components/chat/ChatThread';
import { Card, Button, Eyebrow } from '@/components/common';

const SUGGESTED_MENTOR_QUESTIONS = [
  'How do I architect event-driven microservices with Kafka and Spring Boot?',
  'Can you explain the difference between B-Trees and LSM Trees in database indexing?',
  'What are the core trade-offs between optimistic and pessimistic concurrency control?',
  'How does vector similarity search with cosine distance work under the hood in pgvector?',
];

export default function MentorPage() {
  const {
    messages,
    contextType,
    contextId,
    contextTitle,
    addMessage,
    updateMessage,
    clearMessages,
    openMentor,
  } = useMentorStore();

  const [input, setInput] = useState('');
  const sendMutation = useSendMentorMessage();
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || sendMutation.isPending) return;

    const userMsgId = crypto.randomUUID();
    const assistantMsgId = crypto.randomUUID();

    addMessage({ id: userMsgId, role: 'user', text: textToSend });
    addMessage({ id: assistantMsgId, role: 'assistant', text: '', pending: true });
    setInput('');

    try {
      const res = await sendMutation.mutateAsync({
        message: textToSend,
        contextType,
        contextId,
        sessionId: sessionIdRef.current,
      });

      updateMessage(assistantMsgId, { text: res.reply, pending: false });
    } catch (err: any) {
      updateMessage(assistantMsgId, {
        text:
          err.response?.data?.message ||
          'The AI Mentor encountered an issue generating a response. Please try again.',
        pending: false,
      });
    }
  };

  const handleContextChange = (type: MentorContextType) => {
    openMentor({
      contextType: type,
      contextId: null,
      contextTitle: null,
    });
  };

  const chatTurns: ChatTurn[] = messages.map((m) => ({
    id: m.id,
    role: m.role,
    text: m.text,
    pending: m.pending,
  }));

  return (
    <div className="mx-auto flex h-[calc(100vh-5rem)] max-w-5xl flex-col p-4 sm:p-6 lg:p-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4 mb-4 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Eyebrow tone="ion">CONVERSATIONAL TUTOR</Eyebrow>
            {contextTitle && (
              <span className="font-mono text-xs text-muted truncate max-w-xs">
                [{contextTitle}]
              </span>
            )}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl text-text">AI Mentor Studio</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Context Selector Buttons */}
          <div className="flex rounded-lg border border-line bg-surface-2 p-1 text-xs">
            <button
              onClick={() => handleContextChange('GENERAL')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                contextType === 'GENERAL' ? 'bg-ion/20 text-ion' : 'text-muted hover:text-text'
              }`}
            >
              General
            </button>
            <button
              onClick={() => handleContextChange('COURSE')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                contextType === 'COURSE' ? 'bg-ion/20 text-ion' : 'text-muted hover:text-text'
              }`}
            >
              Course
            </button>
            <button
              onClick={() => handleContextChange('ASSESSMENT')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                contextType === 'ASSESSMENT' ? 'bg-ion/20 text-ion' : 'text-muted hover:text-text'
              }`}
            >
              Assessment
            </button>
          </div>

          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearMessages}
              className="text-muted hover:text-danger"
              title="Clear conversation"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Chat Interface */}
      <Card className="flex flex-1 flex-col overflow-hidden border-line bg-surface/95 p-4 sm:p-6 shadow-panel">
        <ChatThread
          turns={chatTurns}
          className="pr-2"
          empty={
            <div className="flex h-full flex-col items-center justify-center text-center p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ion/10 border border-ion/30 text-ion mb-3 shadow-glow-ion">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl text-text">How can I assist your learning today?</h3>
              <p className="text-xs text-muted max-w-md mt-1 mb-6">
                Ask deep-dive conceptual questions, code debugging help, architectural trade-offs, or curriculum guidance.
              </p>
              <div className="w-full max-w-lg text-left">
                <SuggestionList
                  suggestions={SUGGESTED_MENTOR_QUESTIONS}
                  onPick={(q) => handleSend(q)}
                />
              </div>
            </div>
          }
        />

        <ChatComposer
          value={input}
          onChange={setInput}
          onSubmit={() => handleSend()}
          disabled={sendMutation.isPending}
          placeholder="Ask a technical or curriculum question..."
          autoFocus
        />
      </Card>
    </div>
  );
}
