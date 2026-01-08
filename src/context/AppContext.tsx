import React, { createContext, useContext, useReducer, ReactNode, useMemo } from 'react';
import { AppState } from '../types';
import { useAuth } from '../hooks/useAuth';

type AppAction =
  | { type: 'SET_VIEW'; payload: 'dashboard' | 'geradores' | 'consumidores' | 'pendentes' | 'representantes' | 'usuarios' | 'logs' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' };

const initialState: AppState = {
  currentView: 'dashboard',
  isLoading: false,
  error: null
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return {
        ...state,
        currentView: action.payload
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  user: ReturnType<typeof useAuth>['user'];
  loading: ReturnType<typeof useAuth>['loading'];
  isAuthenticated: ReturnType<typeof useAuth>['isAuthenticated'];
  login: ReturnType<typeof useAuth>['login'];
  logout: ReturnType<typeof useAuth>['logout'];
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const auth = useAuth();

  // Memoizar o valor do contexto para evitar re-renders desnecessários
  const contextValue = useMemo(() => ({
    state, 
    dispatch, 
    user: auth.user,
    loading: auth.loading,
    isAuthenticated: auth.isAuthenticated,
    login: auth.login,
    logout: auth.logout
  }), [state, auth.user, auth.loading, auth.isAuthenticated, auth.login, auth.logout]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp deve ser usado dentro de AppProvider');
  }
  return context;
}