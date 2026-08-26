import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0E1A29',
        card: '#16263A',
        cardBorder: '#253D5B',
        cardHover: '#1E334D',
        ea: {
          navy: '#16263A',
          ocean: '#0072BC',
          oceanHover: '#008BE6',
          black: '#000000',
          white: '#FFFFFF',
          canvas: '#0E1A29',
          surface: '#16263A',
          surfaceElevated: '#1E334D',
          surfaceHover: '#1E334D',
          border: 'rgba(255, 255, 255, 0.08)',
          borderMedium: '#253D5B',
          borderActive: '#0072BC',
          textPrimary: '#FFFFFF',
          textSecondary: '#8FA3BC',
          textMuted: '#5C728C',
          // Data & Status Colors
          success: '#00C48C',
          warning: '#FFB800',
          danger: '#FF4560',
          violet: '#8A2BE2',
          sky: '#38BDF8',
          // Backward-compat aliases mapped to brand palette
          blue: '#0072BC',
          blueGlow: 'rgba(0, 114, 188, 0.35)',
          teal: '#00C48C',
          yellow: '#FFB800',
          red: '#FF4560',
          purple: '#8A2BE2',
          orange: '#FFB800',
        },
        sidebar: '#0E1A29',
        surface: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          800: '#1E334D',
          900: '#16263A',
        }
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'Rajdhani', 'DIN Next', 'Barlow Semi Condensed', 'Montserrat', 'sans-serif'],
        sans: ['var(--font-body)', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '10px',
      },
      boxShadow: {
        'ea-card': '0 4px 20px rgba(0, 0, 0, 0.35)',
        'ea-glow': '0 0 14px rgba(0, 114, 188, 0.35)',
        'ea-glow-mint': '0 0 14px rgba(0, 196, 140, 0.35)',
        'ea-button': '0 0 12px rgba(0, 114, 188, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 114, 188, 0.2), 0 0 10px rgba(0, 114, 188, 0.2)' },
          '100%': { boxShadow: '0 0 15px rgba(0, 114, 188, 0.6), 0 0 25px rgba(0, 196, 140, 0.4)' },
        }
      }
    },
  },
  plugins: [],
};

export default config;
