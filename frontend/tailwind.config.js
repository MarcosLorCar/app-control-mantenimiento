/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // Only apply hover: utilities on devices that actually support hover, so
  // touch devices (PWA on mobile) don't get sticky hover states while scrolling.
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      colors: {
        fg: 'var(--fg)',
        'fg-secondary': 'var(--fg-secondary)',
        muted: 'var(--muted)',
        primary: { DEFAULT: 'var(--primary)', fg: 'var(--primary-fg)' },
        card: 'var(--card)',
        'app-bg': 'var(--bg)',
        'app-border': 'var(--border)',
        'sidebar-bg': 'var(--sidebar-bg)',
        'sidebar-fg': 'var(--sidebar-fg)',
        'sidebar-active': 'var(--sidebar-active)',
        'sidebar-active-fg': 'var(--sidebar-active-fg)',
        'sidebar-border': 'var(--sidebar-border)',
        'sidebar-hover': 'var(--sidebar-hover)',
        success: { DEFAULT: 'var(--success)', bg: 'var(--success-bg)' },
        warning: { DEFAULT: 'var(--warning)', bg: 'var(--warning-bg)' },
        error: { DEFAULT: 'var(--error)', bg: 'var(--error-bg)' },
        'info-bg': 'var(--info-bg)',
      },
      borderRadius: { theme: 'var(--radius)' },
    },
  },
  plugins: [],
}
