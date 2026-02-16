import { useState, useEffect, useMemo, useCallback } from 'react';
import { authService } from '../types/services/authService';
import { User, LoginRequest } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    validateStoredToken();
  }, []);

  const validateStoredToken = async () => {
    const token = authService.getStoredToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const userData = await authService.validateToken();

      // Mapear a resposta para incluir campos obrigatórios
      const userWithDefaults = {
        ...userData,
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: userData.updatedAt || new Date().toISOString()
      };

      setUser(userWithDefaults);
    } catch (error) {
      authService.clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = useCallback(async (credentials: LoginRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.login(credentials);

      // Mapear a resposta para incluir campos obrigatórios
      const userWithDefaults = {
        ...response.user,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Definir usuário imediatamente após login bem-sucedido
      setUser(userWithDefaults);

      return response;
    } catch (error: any) {
      let errorMessage = 'Erro ao fazer login';

      // Verificar se é erro 401 (credenciais inválidas)
      if (error.message.includes('401') || error.message.toLowerCase().includes('unauthorized')) {
        errorMessage = 'Credenciais incorretas. Verifique seu email e senha.';
      } else if (error.message.includes('400')) {
        errorMessage = 'Dados inválidos. Verifique os campos preenchidos.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Tentar fazer logout na API
      await authService.logout();
    } catch (error) {
      // Mesmo com erro, garantir que o token seja limpo
      authService.clearToken();
    } finally {
      // Limpar estado imediatamente
      setUser(null);
      setLoading(false);

      // Forçar reload da página para garantir estado limpo
      window.location.reload();
    }
  }, []);

  const isAuthenticated = useMemo(() => !loading && !!user, [loading, user]);

  const result = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated
  };

  // Removido log que pode causar re-renders

  return result;
}