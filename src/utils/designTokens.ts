// Sistema de Design Tokens Premium - PagLuz
export const designTokens = {
  // Cores Oficiais da PagLuz - Paleta Premium
  colors: {
    // Verdes Primários (Renovado - mais sophisticado)
    primary: '#10b981',      // Esmeralda premium
    primaryLight: '#34d399', // Verde claro sofisticado
    primaryHover: '#059669', // Verde hover escuro
    primaryDark: '#047857',  // Verde muito escuro
    neon: '#10b981',         // Verde sofisticado (não puro neon)
    
    // Azuis Secundários (Premium & Confiável)
    blue: '#0f766e',         // Azul teal premium
    blueDark: '#0d5d54',     // Azul teal escuro
    blueLight: '#14b8a6',    // Azul teal claro
    electric: '#14b8a6',     // Teal elétrico
    
    // Cores de Destaque (Premium)
    purple: '#7c3aed',        // Roxo sofisticado (não tão vibrante)
    purple200: '#c4b5fd',     // Roxo claro
    yellow: '#f59e0b',        // Âmbar elegante (não amarelo brilhante)
    orange: '#f97316',        // Laranja sofisticado
    
    // Neutros Premium
    white: '#ffffff',
    black: '#0a0a0a',
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
      950: '#020617',
    },
    
    // Cores de Status (Premium)
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
  
  
  // Espaçamentos Premium
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },
  
  // Border Radius Premium
  borderRadius: {
    none: '0',
    sm: '0.375rem',   // 6px - mais refinado
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.25rem', // 20px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },
  
  // Sombras Premium
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.04)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.15)',
    '3xl': '0 35px 60px -15px rgb(0 0 0 / 0.2)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    // Sombras com cores premium da PagLuz
    primary: '0 10px 24px -5px rgba(16, 185, 129, 0.2)',
    blue: '0 10px 24px -5px rgba(15, 118, 110, 0.2)',
    premium: '0 20px 40px -10px rgba(0, 0, 0, 0.15)',
  },

  // Transições Premium
  transitions: {
    instant: '0ms ease-in-out',
    fast: '100ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    verySlow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
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

// Classes utilitárias baseadas nos tokens - Premium
export const utilityClasses = {
  // Cards Premium
  card: {
    base: 'bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-slate-300',
    hover: 'hover:shadow-lg hover:border-slate-300 hover:-translate-y-1',
    active: 'active:scale-[0.98]',
    interactive: 'cursor-pointer hover:bg-slate-50',
    // Cards com tema PagLuz Premium
    primary: 'bg-white rounded-2xl border border-emerald-200 shadow-md hover:shadow-lg hover:border-emerald-300 transition-all duration-300',
    blue: 'bg-white rounded-2xl border border-teal-200 shadow-md hover:shadow-lg hover:border-teal-300 transition-all duration-300',
    gradient: 'bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 shadow-md',
  },
  
  // Botões Premium
  button: {
    base: 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95',
    // Primário - Verde esmeralda sofisticado
    primary: 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 focus:ring-emerald-500 shadow-lg hover:shadow-xl hover:-translate-y-0.5',
    // Secundário - Teal profissional
    secondary: 'bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800 focus:ring-teal-500 shadow-md hover:shadow-lg',
    // Outline elegante
    outline: 'border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 focus:ring-emerald-500 transition-all duration-200',
    ghost: 'text-slate-700 hover:bg-slate-100/50 focus:ring-slate-400 focus:ring-1 transition-colors',
    danger: 'bg-gradient-to-br from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:ring-red-500 shadow-md hover:shadow-lg',
    success: 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 focus:ring-emerald-500 shadow-md hover:shadow-lg',
    sizes: {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-sm font-medium',
      lg: 'px-6 py-3 text-base font-medium',
      xl: 'px-8 py-4 text-lg font-semibold',
    }
  },
  
  // Inputs Premium
  input: {
    base: 'w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 bg-white placeholder:text-slate-400 text-slate-900 font-medium',
    error: 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50',
    success: 'border-emerald-300 focus:ring-emerald-500 focus:border-emerald-500 bg-emerald-50',
    disabled: 'bg-slate-100 cursor-not-allowed opacity-60 border-slate-300',
  },
  
  // Estados
  states: {
    loading: 'opacity-75 cursor-wait',
    disabled: 'opacity-50 cursor-not-allowed',
    error: 'border-red-300 bg-red-50',
    success: 'border-emerald-300 bg-emerald-50',
    warning: 'border-amber-300 bg-amber-50',
  },
  
  // Gradientes Premium da PagLuz
  gradients: {
    primary: 'bg-gradient-to-br from-emerald-600 to-emerald-700',
    primarySubtle: 'bg-gradient-to-br from-emerald-50 to-teal-50',
    blue: 'bg-gradient-to-br from-teal-600 to-teal-700',
    blueSubtle: 'bg-gradient-to-br from-teal-50 to-cyan-50',
    dark: 'bg-gradient-to-br from-slate-800 to-slate-900',
    lightAccent: 'bg-gradient-to-br from-white via-emerald-50 to-white',
  }
};

// Função helper para aplicar classes condicionalmente
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};
