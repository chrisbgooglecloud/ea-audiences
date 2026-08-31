import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
    './src/context/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0E1A29',
        card: '#16263A',
        cardBorder: '#253D5B',
        cardHover: '#1E334D',
        surface: {
          DEFAULT: '#0D131D',
          raised: '#141D2B',
          border: '#1E2C42',
          card: '#16263A',
          elevated: '#1E334D',
        },
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
          // Franchise neon accents
          fcVolt: '#E6FF00',
          apexCyan: '#00F0FF',
          maddenGreen: '#00FF88',
          bfOrange: '#FF7A00',
          simsPurple: '#A855F7',
          hudGold: '#FFB800',
          tiltRed: '#FF4757',
        },
        // Direct aliases
        "fc-volt": "#E6FF00",
        "apex-cyan": "#00F0FF",
        "madden-green": "#00FF88",
        "bf-orange": "#FF7A00",
        "sims-purple": "#A855F7",
        "hud-gold": "#FFB800",
        "tilt-red": "#FF4757",
        "cyber-cyan": "#00F0FF",
        "neon-green": "#00FF88",
        "electric-purple": "#A855F7",
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'Rajdhani', 'DIN Next', 'Barlow Semi Condensed', 'Montserrat', 'sans-serif'],
        sans: ['var(--font-body)', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
      },
      boxShadow: {
        'ea-card': '0 4px 20px rgba(0, 0, 0, 0.35)',
        'ea-glow': '0 0 14px rgba(0, 114, 188, 0.35)',
        'ea-glow-mint': '0 0 14px rgba(0, 196, 140, 0.35)',
        'ea-button': '0 0 12px rgba(0, 114, 188, 0.4)',
        'neon-cyan': '0 0 15px rgba(0, 240, 255, 0.4)',
        'neon-orange': '0 0 15px rgba(255, 122, 0, 0.4)',
        'neon-green': '0 0 15px rgba(0, 255, 136, 0.4)',
        'neon-purple': '0 0 15px rgba(168, 85, 247, 0.4)',
        'neon-red': '0 0 15px rgba(255, 71, 87, 0.4)',
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
