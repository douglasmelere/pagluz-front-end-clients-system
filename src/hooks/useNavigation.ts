import { useCallback } from 'react';

export type ViewType = 'dashboard' | 'geradores' | 'consumidores' | 'pendentes' | 'mudancas' | 'representantes' | 'contratos' | 'usuarios' | 'logs' | 'configuracoes' | 'comissoes';

// Hook para navegação entre views
// Usa eventos customizados para comunicação entre componentes
export function useNavigation() {
  const navigate = useCallback((view: ViewType) => {
    // Disparar evento customizado que o App pode escutar
    window.dispatchEvent(new CustomEvent('navigate', { detail: { view } }));
  }, []);

  return { navigate };
}






