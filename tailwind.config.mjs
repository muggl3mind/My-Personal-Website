/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#FAF7F2', // warmer off-white
          dark: '#0B0B0C',
        },
        tinted: {
          DEFAULT: '#F3EEE5', // warmer tinted section
          dark: '#141416',
        },
        ink: {
          DEFAULT: '#0A0A0A',
          dark: '#EDEDED',
        },
        muted: {
          DEFAULT: '#6B6B6B',
          dark: '#9A9A9A',
        },
        rule: {
          DEFAULT: '#E0DAD0',
          dark: '#2A2A2C',
        },
        accent: {
          DEFAULT: '#0F766E', // teal primary
          dark: '#2DD4BF',
        },
        gold: {
          DEFAULT: '#B45309', // warm burnt-gold secondary
          dark: '#F59E0B',
        },
        'chat-bg': {
          DEFAULT: '#FFFFFF',
          dark: '#171719',
        },
        'chat-border': {
          DEFAULT: '#D4D4D4',
          dark: '#404040',
        },
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      maxWidth: {
        content: '720px',
        narrow: '680px',
      },
      animation: {
        'pulse-cursor': 'pulse-cursor 1.2s ease-in-out infinite',
        'flow-dash': 'flow-dash 2s linear infinite',
      },
      keyframes: {
        'pulse-cursor': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        'flow-dash': {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        },
      },
    },
  },
  plugins: [],
};
