import type { Config } from 'tailwindcss';

/**
 * Knowledge Core / Signalyst visual system.
 * Bright editorial surfaces, deep teal feature bands, and a restrained learning accent.
 * Existing semantic aliases are kept so route components can be restyled without changing behavior.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Reference tokens
        ink: '#132229',
        'ink-soft': '#3b4c54',
        muted: '#6d7d84',
        'muted-2': '#8a979d',
        accent: '#0f9488',
        'accent-strong': '#0b7d72',
        'accent-tint': '#e7f4f2',
        dark: '#062a2f',
        'dark-2': '#0b3a41',
        'dark-3': '#124b53',
        'dark-text': '#dfeeee',
        ok: '#2fae7d',
        surface: '#ffffff',
        'surface-alt': '#f6f8f8',
        border: '#e6ecec',
        'border-soft': '#eef2f2',

        // Compatibility aliases used across the existing frontend
        void: '#f6f8f8',
        'surface-2': '#f6f8f8',
        'surface-3': '#eef2f2',
        line: '#e6ecec',
        'line-soft': '#eef2f2',
        text: '#132229',
        'muted-dim': '#8a979d',
        ion: '#0f9488',
        'ion-deep': '#0b7d72',
        ember: '#e07a5f',
        'ember-deep': '#b75b46',
        'layer-1': '#0f9488',
        'layer-2': '#2fae7d',
        'layer-3': '#e6aa4f',
        'layer-4': '#e07a5f',
        danger: '#c85f55',
        'danger-deep': '#9c433c',
        success: '#2fae7d',
        'success-deep': '#277957',
      },
      fontFamily: {
        display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        hud: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.14em' }],
        eyebrow: ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.2em' }],
      },
      letterSpacing: {
        hud: '0.14em',
        eyebrow: '0.2em',
      },
      borderRadius: {
        card: '18px',
        control: '10px',
      },
      boxShadow: {
        'glow-ion': '0 14px 30px -18px rgba(15, 148, 136, 0.48)',
        'glow-ember': '0 14px 30px -18px rgba(224, 122, 95, 0.35)',
        panel: '0 24px 60px -24px rgba(6, 42, 47, 0.18)',
        'card-soft': '0 12px 30px -18px rgba(6, 42, 47, 0.16)',
        'inset-line': 'inset 0 0 0 1px rgba(230, 236, 236, 0.9)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(rgba(255,255,255,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.09) 1px, transparent 1px)',
        'radial-fade':
          'radial-gradient(ellipse at center, rgba(15,148,136,0.16), transparent 62%)',
        'signalyst-feature':
          'radial-gradient(90% 80% at 50% 10%, rgba(231,244,242,0.98), transparent 58%), linear-gradient(180deg, #ffffff 0%, #e7f4f2 32%, #5cb9b4 56%, #124b53 78%, #062a2f 100%)',
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
          '50%': { opacity: '0.55' },
        },
        scan: {
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
