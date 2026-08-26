import { useState, useRef } from 'react';
import { Sparkles, Trash2, ShieldCheck } from 'lucide-react';
import { useSendMentorMessage } from '@/hooks/api/useMentor';
import { useMentorStore } from '@/store/useMentorStore';
import type { MentorContextType } from '@/types';
import { ChatThread, ChatComposer, SuggestionList, type ChatTurn } from '@/components/chat/ChatThread';
import { Button, Eyebrow } from '@/components/common';

const SUGGESTED_MENTOR_QUESTIONS = [
  'How do I architect event-driven microservices with Kafka and Spring Boot?',
  'Can you explain the difference between B-Trees and LSM Trees in database indexing?',
  'What are the core trade-offs between optimistic and pessimistic concurrency control?',
  'How does vector similarity search with cosine distance work under the hood in pgvector?',
];

export default function MentorPage() {
  const { messages, contextType, contextId, contextTitle, addMessage, updateMessage, clearMessages, openMentor } = useMentorStore();
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
    try { const res = await sendMutation.mutateAsync({ message: textToSend, contextType, contextId, sessionId: sessionIdRef.current }); updateMessage(assistantMsgId, { text: res.reply, pending: false }); } catch (err: any) { updateMessage(assistantMsgId, { text: err.response?.data?.message || 'The AI Mentor encountered an issue generating a response. Please try again.', pending: false }); }
  };

  const handleContextChange = (type: MentorContextType) => openMentor({ contextType: type, contextId: null, contextTitle: null });
  const chatTurns: ChatTurn[] = messages.map((m) => ({ id: m.id, role: m.role, text: m.text, pending: m.pending }));

  return <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted"><Sparkles className="h-4 w-4 text-ion" aria-hidden /><span>Workspace</span><span>/</span><span>Conversational Tutor</span>{contextTitle && <><span>/</span><span className="truncate">{contextTitle}</span></>}</div>
    <div className="grid min-h-[680px] flex-1 grid-cols-1 overflow-hidden rounded-card border border-line bg-surface shadow-panel lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="relative overflow-hidden bg-dark p-7 text-dark-text sm:p-9"><div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full border border-white/10" /><div className="relative flex h-full flex-col justify-between"><div><Eyebrow className="text-dark-text/65">Conversational tutor</Eyebrow><h1 className="mt-4 text-4xl font-extrabold leading-[0.98] tracking-[-0.055em] text-white">AI Mentor Studio</h1><p className="mt-5 text-sm leading-relaxed text-dark-text/75">Ask deep-dive conceptual questions, code debugging help, architectural trade-offs, or curriculum guidance.</p><span className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs text-dark-text"><Sparkles className="h-3.5 w-3.5 text-ion" aria-hidden /> {contextType === 'GENERAL' ? 'Your learning' : contextType.toLowerCase()}</span></div><div><Eyebrow className="text-dark-text/55">Ground this conversation in</Eyebrow><div className="mt-4 flex rounded-full border border-white/15 bg-white/10 p-1"><button onClick={() => handleContextChange('GENERAL')} className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition-colors ${contextType === 'GENERAL' ? 'bg-white text-dark' : 'text-dark-text/65 hover:text-white'}`}>General</button><button onClick={() => handleContextChange('COURSE')} className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition-colors ${contextType === 'COURSE' ? 'bg-white text-dark' : 'text-dark-text/65 hover:text-white'}`}>Course</button><button onClick={() => handleContextChange('ASSESSMENT')} className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition-colors ${contextType === 'ASSESSMENT' ? 'bg-white text-dark' : 'text-dark-text/65 hover:text-white'}`}>Assessment</button></div><div className="mt-5 flex items-center gap-2 text-xs text-dark-text/60"><ShieldCheck className="h-4 w-4 text-success" aria-hidden /> Your mentor stays aligned to the current context.</div></div></div></aside>
      <section className="flex min-h-[680px] flex-col bg-surface p-4 sm:p-6"><div className="flex items-center justify-between border-b border-line pb-4"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-tint text-ion"><Sparkles className="h-4 w-4" aria-hidden /></span><div><p className="text-sm font-semibold text-text">AI Mentor</p><p className="font-mono text-hud uppercase text-muted">{contextType === 'GENERAL' ? 'General · your learning' : `${contextType} · ${contextTitle ?? contextId}`}</p></div></div>{messages.length > 0 && <Button variant="ghost" size="icon" onClick={clearMessages} className="text-muted hover:text-danger" title="Clear conversation" aria-label="Clear conversation"><Trash2 className="h-4 w-4" aria-hidden /></Button>}</div><ChatThread turns={chatTurns} className="py-5 pr-1 sm:px-2" empty={<div className="flex h-full flex-col items-center justify-center p-6 text-center"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-tint text-ion shadow-card-soft"><Sparkles className="h-7 w-7" aria-hidden /></span><h3 className="mt-5 text-2xl font-bold tracking-[-0.04em] text-text">How can I assist your learning today?</h3><p className="mt-2 max-w-md text-sm leading-relaxed text-muted">Ask deep-dive conceptual questions, code debugging help, architectural trade-offs, or curriculum guidance.</p><div className="mt-7 w-full max-w-xl"><SuggestionList suggestions={SUGGESTED_MENTOR_QUESTIONS} onPick={(q) => handleSend(q)} /></div></div>} /><ChatComposer value={input} onChange={setInput} onSubmit={() => handleSend()} disabled={sendMutation.isPending} placeholder="Ask a technical or curriculum question..." autoFocus /></section>
    </div>
    <div className="flex items-center justify-between border-t border-line pt-3 text-[11px] text-muted-2"><span>One focused conversation, grounded in your learning path.</span><span>AI Mentor Studio</span></div>
  </div>;
}
