/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'sans-serif'
        ],
        heading: [
          'Plus Jakarta Sans',
          'Inter',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'sans-serif'
        ]
      },
      colors: {
        pagluz: {
          black: '#000000',
          white: '#ffffff',
          primary: '#16a34a',
          primaryHover: '#15803d',
          primaryLight: '#22c55e',
          accent: '#0ea5e9',
          neon: '#00ff88',
          blue: '#0c3a59',
          blueMedium: '#1e40af',
          cyan: '#00d4ff',
          surface: {
            50: '#f9fafb',
            100: '#f3f4f6',
            200: '#e5e7eb',
            900: '#0b1220'
          },
          gray: {
            50: '#f9fafb',
            100: '#f3f4f6',
            200: '#e5e7eb',
            300: '#d1d5db',
            400: '#9ca3af',
            500: '#6b7280',
            600: '#4b5563',
            700: '#374151',
            800: '#333333',
            900: '#111827'
          },
          slate: {
            100: '#e2e8f0',
            300: '#93c5fd'
          },
          whatsapp: '#25d366',
          error: '#dc2626',
          warning: '#f59e0b',
          successDark: '#16a34a',
          successBg: '#f0fdf4',
          successLight: '#bbf7d0'
        }
      },
      boxShadow: {
        pagluzGreen: '0 4px 14px 0 rgba(53, 204, 32, 0.25)',
        pagluzBlue: '0 4px 14px 0 rgba(12, 58, 89, 0.25)',
        neon: '0 0 20px rgba(0, 255, 136, 0.4)'
      },
      backgroundImage: {
        'gradient-pagluz': 'linear-gradient(90deg, #35cc20, #6edc5f)',
        'gradient-pagluz-blue': 'linear-gradient(90deg, #0c3a59, #1e40af)',
        'gradient-pagluz-neon': 'linear-gradient(90deg, #00ff88, #00d4ff)'
      }
    },
  },
  plugins: [],
};
