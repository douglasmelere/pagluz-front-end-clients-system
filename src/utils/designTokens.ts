// Sistema de Design Tokens - PagLuz
export const designTokens = {
  // Cores Oficiais da PagLuz
  colors: {
    // Verdes (emerald modernizado)
    primary: '#16a34a',      // Verde principal (emerald-600)
    primaryLight: '#22c55e', // Verde claro (emerald-500)
    primaryHover: '#15803d', // Verde hover (emerald-700)
    neon: '#00ff88',         // Verde neon
    
    // Azuis
    blue: '#0c3a59',         // Azul principal
    blueDark: '#081f31',     // Azul escuro levemente ajustado
    electric: '#00d4ff',     // Azul elétrico
    
    // Cores de destaque
    purple: '#6200ff',        // Roxo profundo
    yellow: '#ffcc00',        // Amarelo cyber
    
    // Neutros
    white: '#ffffff',
    black: '#0a0a0a',
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    }
  },
  
  // Espaçamentos
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },
  
  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',    // 4px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px',
  },
  
  // Sombras
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    // Sombras com cores da PagLuz
    green: '0 4px 14px 0 rgba(53, 204, 32, 0.25)',
    blue: '0 4px 14px 0 rgba(12, 58, 89, 0.25)',
    neon: '0 0 20px rgba(0, 255, 136, 0.4)',
  },
  
  // Transições
  transitions: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
  
  // Z-index
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },
  
  // Breakpoints responsivos
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // Espaçamentos responsivos
  responsiveSpacing: {
    mobile: {
      xs: '0.125rem',  // 2px
      sm: '0.25rem',   // 4px
      md: '0.5rem',    // 8px
      lg: '0.75rem',   // 12px
      xl: '1rem',      // 16px
    },
    desktop: {
      xs: '0.25rem',   // 4px
      sm: '0.5rem',    // 8px
      md: '1rem',      // 16px
      lg: '1.5rem',    // 24px
      xl: '2rem',      // 32px
    }
  }
};

// Classes utilitárias baseadas nos tokens
export const utilityClasses = {
  // Cards
  card: {
    base: 'bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300',
    hover: 'hover:shadow-lg hover:border-gray-300 hover:scale-[1.02]',
    active: 'active:scale-[0.98]',
    interactive: 'cursor-pointer hover:bg-gray-50',
    // Cards com tema PagLuz
    primary: 'bg-white rounded-xl border-2 border-[#35cc20] shadow-[0_4px_14px_0_rgba(53,204,32,0.25)] hover:shadow-[0_0_20px_rgba(0,255,136,0.4)] transition-all duration-300',
    blue: 'bg-white rounded-xl border-2 border-[#0c3a59] shadow-[0_4px_14px_0_rgba(12,58,89,0.25)] hover:shadow-lg transition-all duration-300',
  },
  
  // Botões
  button: {
    base: 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
    // Botões com cores oficiais da PagLuz
    primary: 'bg-gradient-to-r from-[#16a34a] to-[#22c55e] text-white hover:from-[#15803d] hover:to-[#16a34a] focus:ring-[#16a34a] shadow-[0_4px_14px_0_rgba(22,163,74,0.25)] hover:shadow-[0_0_20px_rgba(0,255,136,0.35)]',
    secondary: 'bg-[#0c3a59] text-white hover:bg-[#081f31] focus:ring-[#0c3a59] shadow-[0_4px_14px_0_rgba(12,58,89,0.25)]',
    outline: 'border-2 border-[#16a34a] text-[#15803d] hover:bg-[#16a34a] hover:text-white focus:ring-[#16a34a] transition-all duration-300',
    ghost: 'text-[#0c3a59] hover:bg-[#0c3a59]/10 focus:ring-[#0c3a59] focus:ring-1',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-[#16a34a] text-white hover:bg-[#15803d] focus:ring-[#16a34a]',
    neon: 'bg-[#00ff88] text-[#0a0a0a] hover:bg-[#00d4ff] focus:ring-[#00ff88] font-bold shadow-[0_0_20px_rgba(0,255,136,0.4)]',
    sizes: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
      xl: 'px-8 py-4 text-lg',
    }
  },
  
  // Inputs
  input: {
    base: 'w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-[#16a34a] focus:border-[#16a34a] transition-all duration-200 bg-white placeholder:text-gray-400',
    error: 'border-red-300 focus:ring-red-500 focus:border-red-300',
    success: 'border-[#16a34a] focus:ring-[#16a34a] focus:border-[#16a34a] bg-[#16a34a]/5',
    disabled: 'bg-gray-100 cursor-not-allowed opacity-60',
  },
  
  // Estados
  states: {
    loading: 'opacity-75 cursor-wait',
    disabled: 'opacity-50 cursor-not-allowed',
    error: 'border-red-300 bg-red-50',
    success: 'border-[#16a34a] bg-[#16a34a]/10',
    warning: 'border-[#f59e0b] bg-[#f59e0b]/10',
  },
  
  // Gradientes da PagLuz
  gradients: {
    primary: 'bg-gradient-to-r from-[#16a34a] to-[#22c55e]',
    blue: 'bg-gradient-to-r from-[#0c3a59] to-[#041e31]',
    neon: 'bg-gradient-to-r from-[#00ff88] to-[#00d4ff]',
    cyber: 'bg-gradient-to-r from-[#00ff88] to-[#6200ff]',
  }
};

// Função helper para aplicar classes condicionalmente
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};
