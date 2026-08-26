import { useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll, AnimatePresence } from 'framer-motion';
import { KnowledgeCore } from './KnowledgeCore';
import { CORE_LAYERS } from './coreConfig';
import { HudReadout } from '@/components/common/Hud';
import { cn } from '@/lib/cn';

export function CoreScrolly() {
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] });
  const [focus, setFocus] = useState(0);
  const [separation, setSeparation] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => { setSeparation(Math.min(1, v * 1.35)); setFocus(Math.min(CORE_LAYERS.length - 1, Math.floor(v * (CORE_LAYERS.length - 0.001)))); });
  const active = CORE_LAYERS[focus];
  return <section ref={trackRef} className="relative" style={{ height: '360vh' }}><div className="sticky top-16 flex h-[calc(100dvh-4rem)] items-center overflow-hidden bg-dark"><div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 px-6 md:grid-cols-2"><div className="relative order-2 h-[46vh] md:order-1 md:h-[70vh]"><KnowledgeCore variant="scrolly" separation={separation} focusLayer={focus} /></div><div className="order-1 text-dark-text md:order-2"><HudReadout label="Sequence" value={active.code.split('—')[0].trim()} live className="text-dark-text/65" /><div className="mt-6 min-h-[15rem]"><AnimatePresence mode="wait"><motion.div key={active.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}><div className="font-mono text-hud uppercase" style={{ color: active.color }}>{active.name}</div><h3 className="mt-2 max-w-xl text-4xl font-extrabold leading-tight tracking-[-0.05em] text-white md:text-5xl">{active.headline}</h3><p className="mt-4 max-w-md text-base leading-relaxed text-dark-text/75">{active.caption}</p></motion.div></AnimatePresence></div><div className="mt-10 flex gap-3">{CORE_LAYERS.map((l, i) => <div key={l.key} className="flex-1"><div className="h-0.5 w-full rounded-full transition-colors duration-500" style={{ backgroundColor: i <= focus ? l.color : '#31595c' }} /><div className={cn('mt-2 font-mono text-[0.65rem] uppercase tracking-wider', i === focus ? 'text-white' : 'text-dark-text/45')}>0{i + 1}</div></div>)}</div></div></div></div></section>;
}
