import { MessageSquareText } from 'lucide-react';
import { useMentorStore } from '@/store/useMentorStore';

/**
 * Always-present affordance so the AI Mentor is findable within the first minute.
 * Hidden while the panel is open (the panel is the active surface then).
 */
export function MentorLauncher() {
  const { isMentorOpen, openMentor } = useMentorStore();
  if (isMentorOpen) return null;
  return (
    <button
      onClick={() => openMentor({ contextType: 'GENERAL' })}
      className="group fixed bottom-6 right-6 z-30 flex items-center gap-2.5 rounded-full border border-ion/30 bg-surface/90 py-3 pl-4 pr-5 shadow-panel backdrop-blur-md transition-colors hover:border-ion/60"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ion/15">
        <MessageSquareText className="h-3.5 w-3.5 text-ion" />
      </span>
      <span className="text-sm font-medium text-text">Ask Mentor</span>
    </button>
  );
}
