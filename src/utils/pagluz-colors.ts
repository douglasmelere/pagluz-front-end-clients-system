// Configuração de cores da identidade visual da Pagluz
export const pagluzColors = {
  // Cores principais
  primary: {
    50: '#ecfdf5',
    100: '#d1fae5', 
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#22c55e', // Verde principal
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  // Verde vibrante da Pagluz
  pagluzGreen: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80', // Verde principal da Pagluz
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
  },
  
  // Azul escuro da Pagluz
  pagluzBlue: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B', // Azul escuro principal
    900: '#0F172A',
  },
  
  // Gradientes
  gradients: {
    primary: 'from-pagluz-blue-800 via-pagluz-blue-700 to-pagluzGreen-500',
    secondary: 'from-pagluzGreen-500 to-pagluzGreen-600',
    accent: 'from-pagluz-blue-50 to-pagluzGreen-50',
  }
};

// Classes Tailwind customizadas para a Pagluz
export const pagluzClasses = {
  // Botões
  button: {
    primary: 'bg-gradient-to-r from-pagluz-green-500 to-pagluz-green-600 hover:from-pagluz-green-600 hover:to-pagluz-green-700 text-white font-medium px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl',
    secondary: 'bg-white hover:bg-pagluz-blue-50 text-pagluz-blue-800 border border-pagluz-blue-200 font-medium px-6 py-3 rounded-xl transition-all duration-300',
    outline: 'border-2 border-pagluz-green-500 text-pagluz-green-600 hover:bg-pagluz-green-500 hover:text-white font-medium px-6 py-3 rounded-xl transition-all duration-300'
  },
  
  // Cards
  card: {
    default: 'bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300',
    elevated: 'bg-white rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300',
    gradient: 'bg-gradient-to-br from-pagluz-blue-50 via-white to-pagluz-green-50 rounded-2xl shadow-lg border border-gray-100'
  },
  
  // Headers
  header: {
    primary: 'bg-gradient-to-r from-pagluz-blue-800 via-pagluz-blue-700 to-pagluz-green-600 shadow-xl',
    secondary: 'bg-gradient-to-r from-pagluz-green-600 via-pagluz-green-500 to-emerald-600 shadow-xl'
  },
  
  // Inputs
  input: {
    default: 'w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pagluz-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white',
    search: 'w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pagluz-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white'
  },
  
  // Status badges
  badge: {
    success: 'bg-gradient-to-r from-pagluz-green-50 to-green-50 text-pagluz-green-700 border border-pagluz-green-200',
    info: 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200',
    warning: 'bg-gradient-to-r from-yellow-50 to-orange-50 text-yellow-700 border border-yellow-200',
    error: 'bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border border-red-200'
  }
};

