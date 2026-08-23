import type { Config } from 'tailwindcss';

/**
 * Knowledge Core design system.
 * Moody, desaturated, cinematic. Dark neutral base + one cool anchor (ion) and one warm anchor (ember).
 * Four layer hues span cool -> warm for the scrollytelling core layers.
 * Fonts: Instrument Serif (display), Inter (body), JetBrains Mono (HUD/data).
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#0A0C10',
        surface: '#12151C',
        'surface-2': '#1A1E28',
        'surface-3': '#222735',
        line: '#262B37',
        'line-soft': '#1D222C',
        text: '#E7E9EE',
        muted: '#8A93A6',
        'muted-dim': '#5C6474',
        ion: '#5BD1E0', // cool anchor
        'ion-deep': '#2C97A6',
        ember: '#E8A24C', // warm anchor
        'ember-deep': '#B9772C',
        'layer-1': '#5BD1E0',
        'layer-2': '#7FA0F5',
        'layer-3': '#E8A24C',
        'layer-4': '#F0785E',
        danger: '#F0785E',
        'danger-deep': '#8F3A2C',
        success: '#6FD19A',
        'success-deep': '#2F7A52',
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        'hud': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.14em' }],
        'eyebrow': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.22em' }],
      },
      letterSpacing: {
        hud: '0.14em',
        eyebrow: '0.22em',
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        'glow-ion': '0 0 0 1px rgba(91,209,224,0.28), 0 0 40px -8px rgba(91,209,224,0.35)',
        'glow-ember': '0 0 0 1px rgba(232,162,76,0.28), 0 0 40px -8px rgba(232,162,76,0.35)',
        panel: '0 24px 60px -24px rgba(0,0,0,0.75)',
        'inset-line': 'inset 0 0 0 1px rgba(38,43,55,0.9)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(rgba(38,43,55,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(38,43,55,0.35) 1px, transparent 1px)',
        'radial-fade':
          'radial-gradient(ellipse at center, rgba(91,209,224,0.10), transparent 60%)',
      },
      backgroundSize: {
        grid: '44px 44px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
        'scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in': 'fade-in 0.5s ease both',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        scan: 'scan 3.5s linear infinite',
        'slide-in-right': 'slide-in-right 0.32s cubic-bezier(0.16,1,0.3,1) both',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.16,1,0.3,1)',
      },
    },
  },
  plugins: [],
} satisfies Config;
