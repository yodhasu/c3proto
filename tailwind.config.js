/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        panel: '0 10px 30px rgba(0,0,0,.25)',
      },
      colors: {
        bg: 'rgb(var(--c-bg) / <alpha-value>)',
        panel: 'rgb(var(--c-panel) / <alpha-value>)',
        text: 'rgb(var(--c-text) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        border: 'rgb(var(--c-border) / <alpha-value>)',
        brand: 'rgb(var(--c-brand) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}
