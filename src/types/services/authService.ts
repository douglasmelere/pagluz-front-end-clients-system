import { api } from './api';
import { User, LoginRequest, LoginResponse } from '../index';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await api.post('/auth/login', credentials);
      
      // Salvar token no localStorage
      if (response.access_token) {
        localStorage.setItem('accessToken', response.access_token);
      }
      
      return response;
    } catch (error) {
      // Remover qualquer token inválido
      this.clearToken();
      throw error;
    }
  },

/*  async logout(): Promise<void> {
    try {
      // Tentar fazer logout na API (se o endpoint existir)
      await api.post('/auth/logout', {});
    } catch (error) {
      // Silently handle logout errors
    } finally {
      this.clearToken();
    }
  },
*/

  async logout(): Promise<void> {
    try {
      // Tentar fazer logout na API (se o endpoint existir)
      await api.post('/auth/logout', {});
    } catch (error) {
      // Se não houver endpoint ou der erro, continuar
    } finally {
      // Sempre limpar o token local
      this.clearToken();
    }
  },

  async validateToken(): Promise<User> {
    try {
      const response = await api.get('/auth/profile');
      return response;
    } catch (error) {
      this.clearToken();
      throw error;
    }
  },

  getStoredToken(): string | null {
    return localStorage.getItem('accessToken');
  },

  clearToken(): void {
    localStorage.removeItem('accessToken');
  }
};