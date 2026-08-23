import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { KnowledgeCore, CoreScrolly, CORE_LAYERS } from '@/components/knowledge-core';
import { HudReadout, Eyebrow, buttonVariants } from '@/components/common';

/** Real catalog figures, verified against the imported curated dataset. */
const CATALOG_RESOURCES = 792;
const CATALOG_SKILLS = 203;

export default function LandingPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-blueprint opacity-[0.35]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-void to-transparent" />

        <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl grid-cols-1 items-center gap-10 px-6 py-16 md:grid-cols-[1.05fr_1fr] md:py-0">
          {/* Copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <Eyebrow>Four layers, one model of you</Eyebrow>
            </motion.div>

            <motion.h1
              className="mt-5 max-w-xl text-balance font-display text-5xl leading-[1.05] text-text sm:text-6xl lg:text-7xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              Look inside the machine that builds your learning path.
            </motion.h1>

            <motion.p
              className="mt-6 max-w-lg text-pretty text-base leading-relaxed text-muted sm:text-lg"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            >
              It reads your goal from a normal conversation, orders the catalog into
              milestones you are actually ready for, quizzes you only on what you have
              reached, and explains whatever you are stuck on. Scroll to take it apart.
            </motion.p>

            <motion.div
              className="mt-9 flex flex-wrap items-center gap-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link to="/register" className={buttonVariants('primary', 'lg')}>
                Start with a conversation
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className={buttonVariants('secondary', 'lg')}>
                Log in
              </Link>
            </motion.div>

            <motion.div
              className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <HudReadout
                label="Catalog"
                value={`${CATALOG_RESOURCES.toLocaleString()} resources`}
                live
              />
              <HudReadout
                label="Skills mapped"
                value={CATALOG_SKILLS.toLocaleString()}
                tone="ember"
              />
            </motion.div>
          </div>

          {/* The core, assembled and idling */}
          <motion.div
            className="relative h-[42vh] min-h-[300px] md:h-[68vh]"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <KnowledgeCore variant="hero" />
          </motion.div>
        </div>

        {/* Scroll cue */}
        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
          <motion.div
            className="flex flex-col items-center gap-2 font-mono text-hud uppercase text-muted-dim"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span>Scroll to disassemble</span>
            <ArrowDown className="h-3.5 w-3.5" />
          </motion.div>
        </div>
      </section>

      {/* ── Section intro ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-4 pt-24">
        <Eyebrow tone="muted">How it works</Eyebrow>
        <h2 className="mt-4 max-w-2xl text-balance font-display text-4xl leading-tight text-text sm:text-5xl">
          Four things happen, in this order.
        </h2>
        <p className="mt-4 max-w-xl text-pretty text-muted">
          Each shell of the core is one stage. They run in sequence — the outer layers
          only have something to work with once the inner ones have run.
        </p>
      </section>

      {/* ── The signature: scroll-driven disassembly ─────────────────── */}
      <CoreScrolly />

      {/* ── Layer summary ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {CORE_LAYERS.map((layer) => (
            <div key={layer.key} className="bg-surface p-6">
              <div
                className="font-mono text-hud uppercase"
                style={{ color: layer.color }}
              >
                {layer.code.split('—')[0].trim()}
              </div>
              <h3 className="mt-3 font-display text-2xl text-text">{layer.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {layer.headline}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Close ────────────────────────────────────────────────────── */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h2 className="mx-auto max-w-2xl text-balance font-display text-4xl leading-tight text-text sm:text-5xl">
            Tell it what you want to build. It handles the order.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-pretty text-muted">
            Onboarding is a short conversation. You get a path with milestones, quizzes
            scoped to your progress, and a mentor that knows where you are.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link to="/register" className={buttonVariants('primary', 'lg')}>
              Create an account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
          <p className="font-mono text-hud uppercase text-muted-dim">
            Knowledge Core
          </p>
          <p className="text-xs text-muted-dim">
            {CATALOG_RESOURCES.toLocaleString()} curated resources across{' '}
            {CATALOG_SKILLS} skills.
          </p>
        </div>
      </footer>
    </>
  );
}
