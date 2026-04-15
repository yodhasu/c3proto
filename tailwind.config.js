/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel:  '0 10px 30px rgba(0,0,0,.25)',
        brand:  '0 0 24px rgba(139,92,246,.25)',
        card:   '0 4px 24px rgba(0,0,0,.55), 0 1px 2px rgba(0,0,0,.3)',
        'card-hover': '0 8px 40px rgba(0,0,0,.7), 0 0 0 1px rgba(139,92,246,.35)',
      },
      colors: {
        bg:       'rgb(var(--c-bg) / <alpha-value>)',
        surface:  'rgb(var(--c-surface) / <alpha-value>)',
        panel:    'rgb(var(--c-panel) / <alpha-value>)',
        overlay:  'rgb(var(--c-overlay) / <alpha-value>)',
        text:     'rgb(var(--c-text) / <alpha-value>)',
        muted:    'rgb(var(--c-muted) / <alpha-value>)',
        faint:    'rgb(var(--c-faint) / <alpha-value>)',
        border:   'rgb(var(--c-border) / <alpha-value>)',
        'border-hi': 'rgb(var(--c-border-hi) / <alpha-value>)',
        brand:    'rgb(var(--c-brand) / <alpha-value>)',
        'brand-hi': 'rgb(var(--c-brand-hi) / <alpha-value>)',
        cyan:     'rgb(var(--c-cyan) / <alpha-value>)',
        'cyan-hi': 'rgb(var(--c-cyan-hi) / <alpha-value>)',
        green:    'rgb(var(--c-green) / <alpha-value>)',
        amber:    'rgb(var(--c-amber) / <alpha-value>)',
        red:      'rgb(var(--c-red) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}
