import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface TagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  label?: string;
  placeholder?: string;
  hint?: string;
  id?: string;
}

/** Comma or Enter adds a tag; Backspace on an empty field removes the last. */
export function TagInput({
  value,
  onChange,
  label,
  placeholder = 'Type and press Enter',
  hint,
  id,
}: TagInputProps) {
  const [draft, setDraft] = useState('');

  function commit(raw: string) {
    const tag = raw.trim().replace(/,$/, '').trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setDraft('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit(draft);
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text/90">
          {label}
        </label>
      )}
      <div
        className={cn(
          'flex min-h-11 flex-wrap items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-2',
          'focus-within:border-ion/60 focus-within:ring-2 focus-within:ring-ion/60',
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded bg-surface-3 px-2 py-1 text-xs text-text"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="text-muted hover:text-danger"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => draft && commit(draft)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="min-w-[8ch] flex-1 bg-transparent text-sm text-text placeholder:text-muted-dim focus:outline-none"
        />
      </div>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}
