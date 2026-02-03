import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        division: {
          dark: '#0c0c0e',
          card: '#16161a',
          border: '#2a2a2e',
          muted: '#71717a',
          orange: '#f97316',
          'orange-dim': '#ea580c',
        },
      },
    },
  },
  plugins: [],
};
export default config;
