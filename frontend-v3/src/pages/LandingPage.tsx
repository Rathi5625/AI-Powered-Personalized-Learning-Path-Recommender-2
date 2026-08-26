import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowRight, Check } from 'lucide-react';
import { KnowledgeCore, CoreScrolly, CORE_LAYERS } from '@/components/knowledge-core';
import { HudReadout, Eyebrow, buttonVariants } from '@/components/common';

/** Real catalog figures, verified against the imported curated dataset. */
const CATALOG_RESOURCES = 792;
const CATALOG_SKILLS = 203;

export default function LandingPage() {
  return (
    <div className="bg-void">
      <section className="relative bg-surface">
        <div className="pointer-events-none absolute inset-0 bg-blueprint opacity-[0.18]" />
        <div className="relative mx-auto grid min-h-[calc(100dvh-4rem)] max-w-6xl grid-cols-1 items-center gap-12 px-6 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:py-14">
          <div className="max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <Eyebrow>Four layers, one model of you</Eyebrow>
            </motion.div>

            <motion.h1
              className="mt-5 text-balance font-sans text-5xl font-extrabold leading-[0.98] tracking-[-0.055em] text-text sm:text-6xl lg:text-7xl"
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
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link to="/login" className={buttonVariants('secondary', 'lg')}>
                Log in
              </Link>
            </motion.div>

            <motion.div
              className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-line pt-6"
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

          <motion.div
            className="knowledge-core-card relative flex min-h-0 flex-col rounded-card border border-line bg-surface-alt p-3 shadow-panel"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="absolute inset-0 rounded-card bg-[radial-gradient(circle_at_50%_48%,rgba(15,148,136,0.16),transparent_48%)]" />
            <div className="absolute left-6 top-6 z-10 font-mono text-hud uppercase text-muted-2">
              Knowledge Core / live model
            </div>
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-[14px]">
              <KnowledgeCore variant="hero" className="absolute inset-0" />
            </div>
            <div className="absolute bottom-6 left-6 right-6 z-10 flex items-center justify-between rounded-full border border-line bg-surface/90 px-4 py-2 text-xs text-muted shadow-card-soft backdrop-blur-sm">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-success" aria-hidden />
                Four stages ordered for you
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider">Scroll to disassemble</span>
            </div>
          </motion.div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center">
          <motion.div
            className="flex flex-col items-center gap-2 font-mono text-hud uppercase text-muted-2"
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span>Scroll to disassemble</span>
            <ArrowDown className="h-3.5 w-3.5" aria-hidden />
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-4 pt-24">
        <Eyebrow tone="muted">How it works</Eyebrow>
        <h2 className="mt-4 max-w-2xl text-balance font-sans text-4xl font-extrabold leading-[1.02] tracking-[-0.045em] text-text sm:text-5xl">
          Four things happen, in this order.
        </h2>
        <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted">
          Each shell of the core is one stage. They run in sequence — the outer layers
          only have something to work with once the inner ones have run.
        </p>
      </section>

      <CoreScrolly />

      <section className="bg-surface-alt py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Eyebrow tone="muted">Layer summary</Eyebrow>
          <div className="mt-5 grid grid-cols-1 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            {CORE_LAYERS.map((layer) => (
              <div key={layer.key} className="bg-surface p-6 transition-colors hover:bg-accent-tint/50">
                <div className="font-mono text-hud uppercase" style={{ color: layer.color }}>
                  {layer.code.split('—')[0].trim()}
                </div>
                <h3 className="mt-3 font-sans text-2xl font-bold tracking-tight text-text">{layer.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{layer.headline}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl rounded-card bg-dark px-6 py-16 text-center shadow-panel sm:px-12 sm:py-20">
          <div className="mx-auto max-w-2xl">
            <Eyebrow className="text-dark-text/65">Your next step</Eyebrow>
            <h2 className="mt-4 text-balance font-sans text-4xl font-extrabold leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl">
              Tell it what you want to build. It handles the order.
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-pretty leading-relaxed text-dark-text/75">
              Onboarding is a short conversation. You get a path with milestones, quizzes
              scoped to your progress, and a mentor that knows where you are.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link
                to="/register"
                className={buttonVariants('secondary', 'lg') + ' border-transparent bg-white text-dark hover:bg-accent-tint'}
              >
                Create an account
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-dark-text/65">
              {['Conversation first', 'Milestones in order', 'Mentor when you need it'].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-ion" aria-hidden />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-surface-alt">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 sm:flex-row">
          <p className="font-mono text-hud uppercase text-muted-2">Knowledge Core</p>
          <p className="text-xs text-muted-2">
            {CATALOG_RESOURCES.toLocaleString()} curated resources across {CATALOG_SKILLS} skills.
          </p>
        </div>
      </footer>
    </div>
  );
}
