import { useEffect, useRef, type KeyboardEvent } from 'react';
import { CornerDownLeft, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  pending?: boolean;
}

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
    <div className={cn('flex gap-2.5', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-tint text-ion">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
        </span>
      )}
      <div
        className={cn(
          'max-w-[82%] whitespace-pre-wrap rounded-card px-4 py-3 text-sm leading-relaxed shadow-card-soft',
          isUser
            ? 'bg-ion text-white'
            : 'border border-line bg-surface-alt text-text',
        )}
      >
        {turn.pending ? (
          <span className="flex items-center gap-2 text-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-ion" aria-hidden />
            Thinking…
          </span>
        ) : (
          turn.text
        )}
      </div>
    </div>
  );
}

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
      <div className="flex items-end gap-2 rounded-card border border-line bg-surface-alt p-2 transition-[border-color,box-shadow] focus-within:border-ion/50 focus-within:ring-2 focus-within:ring-ion/15">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          autoFocus={autoFocus}
          placeholder={placeholder}
          aria-label={placeholder}
          className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-text placeholder:text-muted-2 focus:outline-none"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ion text-white transition-[background-color,transform,opacity] hover:bg-ion-deep active:scale-95 disabled:opacity-40"
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
          className="block w-full rounded-control border border-line bg-surface px-4 py-3 text-left text-sm text-muted shadow-card-soft transition-[border-color,background-color,color,transform] hover:-translate-y-0.5 hover:border-ion/40 hover:bg-accent-tint hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ion/40"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
