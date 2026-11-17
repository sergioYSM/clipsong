// Every colour, size and radius comes from the design tokens (app/tokens.css).
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent', current: 'currentColor',
      bg: 'var(--color-bg)',
      surface: { DEFAULT: 'var(--color-surface)', raised: 'var(--color-surface-raised)', hover: 'var(--color-surface-hover)' },
      border: { DEFAULT: 'var(--color-border)', input: 'var(--color-border-input)' },
      text: { DEFAULT: 'var(--color-text)', muted: 'var(--color-text-muted)', subtle: 'var(--color-text-subtle)' },
      accent: { DEFAULT: 'var(--color-accent)', on: 'var(--color-on-accent)' },
      danger: 'var(--color-danger)', success: 'var(--color-success)', warning: 'var(--color-warning)',
    },
    fontFamily: { sans: 'var(--font-sans)' },
    fontSize: {
      xs: ['12px', '16px'], sm: ['14px', '20px'], base: ['16px', '24px'],
      lg: ['20px', '28px'], xl: ['24px', '32px'], '2xl': ['32px', '38px'], display: ['72px', '80px'],
    },
    borderRadius: { none: '0', sm: 'var(--radius-sm)', md: 'var(--radius-md)', lg: 'var(--radius-lg)', full: 'var(--radius-pill)' },
    boxShadow: { card: 'var(--shadow-card)', pop: 'var(--shadow-pop)', none: 'none' },
    extend: {
      spacing: { sidebar: 'var(--sidebar-w)', panel: 'var(--right-panel-w)', player: 'var(--player-h)', topbar: 'var(--topbar-h)' },
    },
  },
  plugins: [],
};
