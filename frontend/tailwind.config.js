/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        success: '#34D399',
        bg: '#F0F4FF',
        card: '#FFFFFF',
        text: '#111827',
        muted: '#6B7280',
        'text-normal': '#333333',
        'text-weak': '#666666',
      },
      borderRadius: {
        card: '12px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 40%, #3B82F6 70%, #60A5FA 100%)',
        'card-gradient': 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(240,244,255,1) 100%)',
        'nav-gradient': 'linear-gradient(90deg, rgba(30,58,138,0.95) 0%, rgba(37,99,235,0.95) 50%, rgba(59,130,246,0.95) 100%)',
        'glass': 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(239,246,255,0.9) 100%)',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(37,99,235,0.06), 0 1px 2px rgba(37,99,235,0.04)',
        'card-hover': '0 10px 25px rgba(37,99,235,0.1), 0 4px 10px rgba(37,99,235,0.05)',
        'glow': '0 0 20px rgba(37,99,235,0.15)',
      },
    },
  },
  plugins: [],
};