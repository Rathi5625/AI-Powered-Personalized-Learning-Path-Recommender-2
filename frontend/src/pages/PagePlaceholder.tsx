import { Eyebrow } from '@/components/common';

/**
 * Temporary scaffold marker. Each of these is being replaced by the real page
 * wired to the backend; this exists only so the router resolves while the build
 * is in progress.
 */
export function PagePlaceholder({
  name,
  note,
}: {
  name: string;
  note: string;
}) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <Eyebrow tone="ember">Being built</Eyebrow>
      <h1 className="mt-4 font-display text-4xl text-text">{name}</h1>
      <p className="mt-3 max-w-lg text-muted">{note}</p>
    </div>
  );
}
