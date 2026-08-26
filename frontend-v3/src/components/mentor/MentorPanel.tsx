import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CornerDownLeft, Loader2, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { uid } from '@/lib/uid';
import { getApiErrorMessage } from '@/lib/apiClient';
import { useMentorStore } from '@/store/useMentorStore';
import { useSendMentorMessage } from '@/hooks/api/useMentor';
import type { MentorContextType } from '@/types';

const CONTEXT_LABEL: Record<MentorContextType, string> = {
  COURSE: 'this course',
  ASSESSMENT: 'this assessment',
  GENERAL: 'your learning',
};

function suggestions(type: MentorContextType, title: string | null): string[] {
  if (type === 'COURSE') {
    return [
      `What will I actually learn in ${title ?? 'this course'}?`,
      'What should I know before starting this?',
      'How does this fit into my path?',
    ];
  }
  if (type === 'ASSESSMENT') {
    return [
      'Explain the question I got wrong.',
      'What topic should I review next?',
      'Give me a harder example to try.',
    ];
  }
  return [
    'What should I work on next?',
    'Explain my current milestone in plain terms.',
    'How is my path chosen for me?',
  ];
}

export function MentorPanel() {
  const {
    isMentorOpen,
    contextType,
    contextId,
    contextTitle,
    messages,
    closeMentor,
    addMessage,
    updateMessage,
  } = useMentorStore();
  const send = useSendMentorMessage();
  const [draft, setDraft] = useState('');
  const sessionRef = useRef<string>(uid());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionRef.current = uid();
  }, [contextType, contextId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isMentorOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeMentor();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMentorOpen, closeMentor]);

  async function submit(text: string) {
    const message = text.trim();
    if (!message || send.isPending) return;
    setDraft('');
    addMessage({ id: uid(), role: 'user', text: message });
    const replyId = uid();
    addMessage({ id: replyId, role: 'assistant', text: '', pending: true });
    try {
      const res = await send.mutateAsync({
        message,
        contextType,
        contextId,
        sessionId: sessionRef.current,
      });
      updateMessage(replyId, { text: res.reply, pending: false });
    } catch (err) {
      updateMessage(replyId, {
        text: getApiErrorMessage(err, 'The mentor could not respond. Try again.'),
        pending: false,
      });
    }
  }

  return (
    <AnimatePresence>
      {isMentorOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-dark/35 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMentor}
            aria-hidden
          />
          <motion.aside
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-line bg-surface shadow-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            role="dialog"
            aria-modal="true"
            aria-label="AI Mentor"
          >
            <div className="flex items-center justify-between border-b border-line bg-dark px-5 py-4 text-dark-text">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-ion">
                  <Sparkles className="h-4 w-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold">AI Mentor</p>
                  <p className="font-mono text-hud uppercase text-dark-text/60">
                    {contextType === 'GENERAL'
                      ? 'General'
                      : `${contextType} · ${contextTitle ?? contextId}`}
                  </p>
                </div>
              </div>
              <button
                onClick={closeMentor}
                className="rounded-full p-2 text-dark-text/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                aria-label="Close mentor"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {messages.length === 0 ? (
                <div className="pt-4">
                  <p className="text-sm leading-relaxed text-muted">
                    Ask me anything about {CONTEXT_LABEL[contextType]}. I can see what you are looking at.
                  </p>
                  <div className="mt-4 space-y-2">
                    {suggestions(contextType, contextTitle).map((s) => (
                      <button
                        key={s}
                        onClick={() => submit(s)}
                        className="block w-full rounded-control border border-line bg-surface-alt px-3 py-2.5 text-left text-sm text-muted transition-[border-color,background-color,color] hover:border-ion/40 hover:bg-accent-tint hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ion/40"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn('flex gap-2', m.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    {m.role === 'assistant' && (
                      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-tint text-ion">
                        <Sparkles className="h-3 w-3" aria-hidden />
                      </span>
                    )}
                    <div
                      className={cn(
                        'max-w-[85%] whitespace-pre-wrap rounded-card px-3.5 py-2.5 text-sm leading-relaxed shadow-card-soft',
                        m.role === 'user'
                          ? 'bg-ion text-white'
                          : 'border border-line bg-surface-alt text-text',
                      )}
                    >
                      {m.pending ? (
                        <span className="flex items-center gap-2 text-muted">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-ion" aria-hidden />
                          Thinking…
                        </span>
                      ) : (
                        m.text
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <form
              className="border-t border-line p-4"
              onSubmit={(e) => {
                e.preventDefault();
                submit(draft);
              }}
            >
              <div className="flex items-end gap-2 rounded-card border border-line bg-surface-alt p-2 transition-[border-color,box-shadow] focus-within:border-ion/50 focus-within:ring-2 focus-within:ring-ion/15">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      submit(draft);
                    }
                  }}
                  rows={1}
                  placeholder="Ask the mentor…"
                  aria-label="Ask the mentor"
                  className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-text placeholder:text-muted-2 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || send.isPending}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ion text-white transition-[background-color,transform,opacity] hover:bg-ion-deep active:scale-95 disabled:opacity-40"
                  aria-label="Send message"
                >
                  {send.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <CornerDownLeft className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
