/**
 * The Knowledge Core is an original abstract instrument: a bright kernel (the learner model)
 * wrapped in four concentric shells, one per stage of how the product's AI works.
 * The visual vocabulary follows the light Signalyst system while retaining the same product meaning.
 */
export interface CoreLayer {
  index: number;
  key: 'intake' | 'recommendation' | 'assessment' | 'mentor';
  code: string;
  name: string;
  headline: string;
  caption: string;
  color: string;
  radius: number;
  detail: number;
  mode: 'faceted' | 'wireframe' | 'points';
  rotate: [number, number, number];
}

export const CORE_LAYERS: CoreLayer[] = [
  {
    index: 0,
    key: 'intake',
    code: 'LAYER 01 / 04 — INTAKE',
    name: 'Intake',
    headline: 'Understands your goal',
    caption: 'A plain conversation, not a form. The onboarding chat reads your experience, your interests, and what you are actually trying to become — and turns it into a profile.',
    color: '#0f9488',
    radius: 1.05,
    detail: 0,
    mode: 'faceted',
    rotate: [0.0, 0.12, 0.0],
  },
  {
    index: 1,
    key: 'recommendation',
    code: 'LAYER 02 / 04 — RECOMMENDATION',
    name: 'Recommendation',
    headline: 'Builds your path',
    caption: 'Your goal is embedded and matched against the whole catalog by meaning, then ordered by what depends on what — so each milestone is one you are ready for.',
    color: '#2fae7d',
    radius: 1.55,
    detail: 1,
    mode: 'wireframe',
    rotate: [0.03, -0.09, 0.01],
  },
  {
    index: 2,
    key: 'assessment',
    code: 'LAYER 03 / 04 — ASSESSMENT',
    name: 'Assessment',
    headline: 'Tests what you have learned',
    caption: 'Short quizzes written for exactly the topics you have reached — never further ahead. Every answer comes back graded, with an explanation you can push back on.',
    color: '#e6aa4f',
    radius: 2.05,
    detail: 1,
    mode: 'faceted',
    rotate: [-0.02, 0.07, 0.02],
  },
  {
    index: 3,
    key: 'mentor',
    code: 'LAYER 04 / 04 — MENTOR',
    name: 'Mentor',
    headline: 'Explains and helps, anytime',
    caption: 'A tutor that already knows the course or quiz in front of you. Open it from anywhere and it answers about what you are looking at — not in the abstract.',
    color: '#e07a5f',
    radius: 2.62,
    detail: 1,
    mode: 'wireframe',
    rotate: [0.02, 0.05, -0.01],
  },
];

export const CORE_KERNEL_COLOR = '#e7f4f2';
