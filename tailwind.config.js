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
          // Cores primárias premium
          primary: '#10b981',      // Esmeralda sofisticada
          primaryLight: '#34d399',  // Verde claro
          primaryDark: '#059669',   // Verde escuro
          primaryHover: '#059669',
          // Cores secundárias premium
          blue: '#0f766e',         // Teal premium
          blueDark: '#0d5d54',
          blueLight: '#14b8a6',
          cyan: '#14b8a6',
          // Cores de suporte
          accent: '#0ea5e9',
          purple: '#7c3aed',
          orange: '#f97316',
          neon: '#10b981',
          // Superfícies
          surface: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            900: '#0f172a'
          },
          gray: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
            950: '#020617'
          },
          slate: {
            100: '#e2e8f0',
            300: '#93c5fd'
          },
          whatsapp: '#25d366',
          error: '#ef4444',
          warning: '#f59e0b',
          success: '#10b981',
          successDark: '#10b981',
          successBg: '#f0fdf4',
          successLight: '#d1fae5'
        }
      },
      boxShadow: {
        // Sombras premium
        soft: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        pagluzGreen: '0 10px 24px -5px rgba(16, 185, 129, 0.2)',
        pagluzBlue: '0 10px 24px -5px rgba(15, 118, 110, 0.2)',
        premium: '0 20px 40px -10px rgba(0, 0, 0, 0.15)',
        neon: '0 0 20px rgba(16, 185, 129, 0.3)'
      },
      backgroundImage: {
        // Gradientes premium
        'gradient-pagluz': 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
        'gradient-pagluz-dark': 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
        'gradient-pagluz-blue': 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
        'gradient-pagluz-light': 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
