import { MessageSquareText } from 'lucide-react';
import { useMentorStore } from '@/store/useMentorStore';

/** Always-present affordance for opening the AI Mentor. */
export function MentorLauncher() {
  const { isMentorOpen, openMentor } = useMentorStore();
  if (isMentorOpen) return null;
  return (
    <button
      onClick={() => openMentor({ contextType: 'GENERAL' })}
      className="group fixed bottom-5 right-5 z-30 flex items-center gap-2.5 rounded-full border border-line bg-surface py-3 pl-4 pr-5 shadow-panel transition-[border-color,transform] hover:-translate-y-0.5 hover:border-ion/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ion/40 sm:bottom-6 sm:right-6"
      aria-label="Open AI Mentor"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-tint">
        <MessageSquareText className="h-3.5 w-3.5 text-ion" aria-hidden />
      </span>
      <span className="text-sm font-semibold text-text">Ask Mentor</span>
    </button>
  );
}
