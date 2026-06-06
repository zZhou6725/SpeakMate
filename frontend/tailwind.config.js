/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        success: '#34D399',
        bg: '#F8FAFC',
        card: '#FFFFFF',
        text: '#111827',
        muted: '#6B7280',
        'text-normal': '#333333',
        'text-weak': '#666666',
      },
      borderRadius: {
        card: '8px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};