/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core
        'bg-primary': '#0a0a0f',
        'bg-secondary': '#12121a',
        'bg-tertiary': '#1a1a25',
        'bg-elevated': '#22222f',

        // Accent
        'accent-primary': '#00d4ff',
        'accent-secondary': '#00ff88',
        'accent-tertiary': '#ff6b35',

        // Text
        'text-primary': '#ffffff',
        'text-secondary': '#a0a0b0',
        'text-muted': '#606070',

        // Semantic
        'success': '#00ff88',
        'warning': '#ffb800',
        'error': '#ff4757',
        'info': '#00d4ff',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'gradient': 'gradient 8s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
        'gradient-hero': 'radial-gradient(ellipse at top, #1a1a30 0%, #0a0a0f 70%)',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 212, 255, 0.3)',
        'glow-lg': '0 0 40px rgba(0, 212, 255, 0.4)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
}
