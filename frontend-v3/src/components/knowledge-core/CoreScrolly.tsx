import { useRef, useState } from 'react';
import {
  motion,
  useMotionValueEvent,
  useScroll,
  AnimatePresence,
} from 'framer-motion';
import { KnowledgeCore } from './KnowledgeCore';
import { CORE_LAYERS } from './coreConfig';
import { HudReadout } from '@/components/common/Hud';
import { cn } from '@/lib/cn';

/**
 * Scrollytelling: pins the Knowledge Core and separates it into its four layers as the
 * reader scrolls, foregrounding one stage at a time with a fresh caption per layer.
 */
export function CoreScrolly() {
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  });

  const [focus, setFocus] = useState(0);
  const [separation, setSeparation] = useState(0);

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setSeparation(Math.min(1, v * 1.35));
    setFocus(Math.min(CORE_LAYERS.length - 1, Math.floor(v * (CORE_LAYERS.length - 0.001))));
  });

  const active = CORE_LAYERS[focus];

  return (
    <section ref={trackRef} className="relative" style={{ height: '360vh' }}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 px-6 md:grid-cols-2">
          {/* The pinned core */}
          <div className="relative order-2 h-[46vh] md:order-1 md:h-[70vh]">
            <KnowledgeCore variant="scrolly" separation={separation} focusLayer={focus} />
          </div>

          {/* The layer readout */}
          <div className="order-1 md:order-2">
            <HudReadout label="SEQUENCE" value={active.code.split('—')[0].trim()} live />
            <div className="mt-6 min-h-[15rem]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.key}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div
                    className="font-mono text-hud uppercase"
                    style={{ color: active.color }}
                  >
                    {active.name}
                  </div>
                  <h3 className="mt-2 font-display text-4xl leading-tight text-text md:text-5xl">
                    {active.headline}
                  </h3>
                  <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-muted">
                    {active.caption}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Sequence rail — encodes the real pipeline order */}
            <div className="mt-10 flex gap-3">
              {CORE_LAYERS.map((l, i) => (
                <div key={l.key} className="flex-1">
                  <div
                    className={cn(
                      'h-0.5 w-full rounded-full transition-colors duration-500',
                    )}
                    style={{
                      backgroundColor: i <= focus ? l.color : '#262B37',
                    }}
                  />
                  <div
                    className="mt-2 font-mono text-[0.65rem] uppercase tracking-wider transition-colors duration-500"
                    style={{ color: i === focus ? l.color : '#5C6474' }}
                  >
                    0{i + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
