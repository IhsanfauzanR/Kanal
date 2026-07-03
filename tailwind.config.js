/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Tokens are declared as CSS variables in src/index.css (:root) so the
      // 3D scene constants and Tailwind chrome read from a single source.
      colors: {
        kanal: {
          bg: 'var(--bg)',
          surf: 'var(--surf)',
          surf2: 'var(--surf2)',
          line: 'var(--line)',
          fg: 'var(--fg)',
          fg2: 'var(--fg2)',
          fg3: 'var(--fg3)',
          fg4: 'var(--fg4)',
          teal: 'var(--teal)',
          'teal-on': 'var(--teal-on)',
          'teal-tint': 'var(--teal-tint)',
          'teal-bd': 'var(--teal-bd)',
          exp: 'var(--exp)',
          'exp-tint': 'var(--exp-tint)',
          'exp-bd': 'var(--exp-bd)',
          handle: 'var(--handle)',
          skeleton: 'var(--skeleton)',
          weekend: 'var(--tint-weekend)',
          glass: 'var(--glass)',
        },
      },
      boxShadow: {
        elev: 'var(--elev-shadow)',
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        phone: '44px',
      },
      transitionTimingFunction: {
        // Stage 1 spring-ish easing used across the shell
        kanal: 'cubic-bezier(.22,1,.36,1)',
      },
    },
  },
  plugins: [],
}
