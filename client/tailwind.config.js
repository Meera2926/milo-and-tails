/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#EEF3EF',      // page background — cool, clinical green-grey
        surface: '#FFFFFF',
        ink: '#17211E',         // primary text
        muted: '#5F6F69',       // secondary text
        line: '#DCE5DF',        // hairlines and borders
        pine: '#0E4A3C',        // deepest brand green, used for headers
        moss: {
          DEFAULT: '#12836C',   // primary action
          soft: '#DCEFE9',
          deep: '#0B6553',
        },
        marigold: {
          DEFAULT: '#E9A13B',   // accent — reminders, highlights
          soft: '#FBEED6',
        },
        coral: {
          DEFAULT: '#D9455F',   // lost pet, overdue, destructive
          soft: '#FBE3E7',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.25rem' },
      boxShadow: {
        card: '0 1px 2px rgba(23,33,30,0.04), 0 8px 24px -12px rgba(23,33,30,0.12)',
        lift: '0 2px 4px rgba(23,33,30,0.05), 0 16px 40px -16px rgba(23,33,30,0.22)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'none' } },
      },
      animation: { 'fade-up': 'fade-up .35s cubic-bezier(.2,.7,.3,1) both' },
    },
  },
  plugins: [],
};
