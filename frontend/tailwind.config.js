/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0F7FF',
          100: '#E0EFFF',
          200: '#BAE0FD',
          300: '#7CC5FB',
          400: '#38A6F8',
          500: '#026CD6',
          600: '#0153AB',
          700: '#06478D',
          800: '#0B3C73',
          900: '#07264D',
        },
        duo: {
          green: '#026CD6',
          greenDark: '#0153AB',
          greenLight: '#E0EFFF',
          greenFaint: '#F0F7FF',
          blue: '#0284C7',
          blueDark: '#0369A1',
          blueLight: '#E0F2FE',
          yellow: '#F59E0B',
          yellowDark: '#D97706',
          yellowLight: '#FEF3C7',
          orange: '#F97316',
          orangeDark: '#C2410C',
          orangeLight: '#FFEDD5',
          red: '#EF4444',
          redDark: '#DC2626',
          redLight: '#FEE2E2',
          purple: '#4F46E5',
          purpleDark: '#3730A3',
          purpleLight: '#EEF2FF',
          bg: '#F4F7FB',
          border: '#E2E8F0',
          borderDark: '#CBD5E1',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Nunito', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'duo-sm': '0 2px 0 0 rgba(0, 0, 0, 0.08)',
        'duo': '0 4px 0 0 #E2E8F0',
        'duo-green': '0 4px 0 0 #0153AB',
        'duo-blue': '0 4px 0 0 #0369A1',
        'duo-yellow': '0 4px 0 0 #D97706',
        'duo-orange': '0 4px 0 0 #C2410C',
        'duo-red': '0 4px 0 0 #DC2626',
        'duo-purple': '0 4px 0 0 #3730A3',
        'real-blue': '0 4px 0 0 #0153AB',
      }
    },
  },
  plugins: [],
}
