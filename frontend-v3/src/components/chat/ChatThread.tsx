import { useEffect, useRef, type KeyboardEvent } from 'react';
import { CornerDownLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  pending?: boolean;
}

/**
 * Shared conversation surface for the onboarding intake chat and the full-page
 * mentor. The slide-out MentorPanel keeps its own tighter layout; this is the
 * roomier in-page variant.
 */
export function ChatThread({
  turns,
  empty,
  className,
}: {
  turns: ChatTurn[];
  empty?: React.ReactNode;
  className?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the newest turn in view as the conversation grows.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [turns]);

  return (
    <div
      ref={scrollRef}
      className={cn('flex-1 space-y-5 overflow-y-auto', className)}
      role="log"
      aria-live="polite"
      aria-label="Conversation"
    >
      {turns.length === 0 ? empty : turns.map((t) => <ChatBubble key={t.id} turn={t} />)}
    </div>
  );
}

function ChatBubble({ turn }: { turn: ChatTurn }) {
  const isUser = turn.role === 'user';
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] whitespace-pre-wrap rounded-card px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-ion/15 text-text'
            : 'border border-line bg-surface-2 text-text/90',
        )}
      >
        {turn.pending ? (
          <span className="flex items-center gap-2 text-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            Thinking…
          </span>
        ) : (
          turn.text
        )}
      </div>
    </div>
  );
}

/**
 * Auto-growing composer. Enter sends, Shift+Enter makes a newline — the
 * convention users already expect from chat UIs.
 */
export function ChatComposer({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = 'Type your message…',
  autoFocus,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <form
      className={cn('mt-4', className)}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex items-end gap-2 rounded-card border border-line bg-surface-2 p-2 transition-colors focus-within:border-ion/50">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          autoFocus={autoFocus}
          placeholder={placeholder}
          aria-label={placeholder}
          className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-text placeholder:text-muted-dim focus:outline-none"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-ion text-void transition-opacity disabled:opacity-40"
          aria-label="Send message"
        >
          {disabled ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <CornerDownLeft className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
    </form>
  );
}

/** Clickable starter prompts shown when a conversation is empty. */
export function SuggestionList({
  suggestions,
  onPick,
  className,
}: {
  suggestions: string[];
  onPick: (text: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {suggestions.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onPick(s)}
          className="block w-full rounded-md border border-line bg-surface-2 px-4 py-3 text-left text-sm text-muted transition-colors hover:border-ion/40 hover:text-text"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
