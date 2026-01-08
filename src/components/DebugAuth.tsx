import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Button from './common/Button';

export default function DebugAuth() {
  const { user, loading, error, isAuthenticated, login } = useAuth();
  const { showToast } = useToast();

  const testLogin = async () => {
    try {
      const response = await login({
        email: 'douglasmelere@gmail.com',
        password: 'Juninhoplay13!'
      });
      
      // Atualizar o componente após o login
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      alert(`Erro no login: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const testAPI = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch('https://supabase-pagluz-backend-new.ztdny5.easypanel.hostauth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`API funcionando! Usuário: ${data.name}`);
      } else {
        const errorData = await response.json();
        alert(`Erro na API: ${response.status} - ${errorData.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      showToast('error', `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const testRepresentatives = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Teste 1: URL completa
      const response1 = await fetch('https://supabase-pagluz-backend-new.ztdny5.easypanel.hostrepresentatives', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response1.ok) {
        const data = await response1.json();
        alert(`Representantes carregados! Total: ${data.length}`);
        return;
      } else {
        const errorData = await response1.json();
      }
      
      // Teste 2: URL relativa (como o api.ts faz)
      const response2 = await fetch('/representatives', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response2.ok) {
        const data = await response2.json();
        alert(`Representantes carregados! Total: ${data.length}`);
      } else {
        const errorData = await response2.json();
        alert(`Erro ao buscar representantes: ${response2.status} - ${errorData.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      showToast('error', `Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const testApiService = async () => {
    try {
      // Verificar se a variável de ambiente está sendo carregada
      if (!import.meta.env.VITE_API_BASE_URL) {
        alert('ERRO: VITE_API_BASE_URL não está definida!');
        return;
      }
      
      // Importar e testar o api.ts
      const { api } = await import('../types/services/api');
      
      // Testar GET simples
      const response = await api.get('/representatives');
      alert('API Service funcionando!');
    } catch (error) {
      alert(`Erro no API Service: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const testDirectLogin = async () => {
    try {
      // Fazer login diretamente com fetch
      const response = await fetch('https://supabase-pagluz-backend-new.ztdny5.easypanel.hostauth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'douglasmelere@gmail.com',
          password: 'Juninhoplay13!'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Salvar token diretamente
        if (data.access_token) {
          localStorage.setItem('accessToken', data.access_token);
          alert('Login direto funcionou! Token salvo.');
          
          // Recarregar para atualizar o estado
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          alert('ERRO: access_token não encontrado na resposta');
        }
      } else {
        const errorData = await response.json();
        alert(`Erro no login direto: ${response.status} - ${errorData.message}`);
      }
    } catch (error) {
      alert(`Erro no login direto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const testEndpoints = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        alert('Faça login primeiro!');
        return;
      }

      // Testar auth/profile
      const profileResponse = await fetch('https://supabase-pagluz-backend-new.ztdny5.easypanel.hostauth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Testar consumers
      const consumersResponse = await fetch('https://supabase-pagluz-backend-new.ztdny5.easypanel.hostconsumers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (consumersResponse.ok) {
        const data = await consumersResponse.json();
        alert(`Consumers funcionando! Total: ${data.length}`);
      } else {
        const errorData = await consumersResponse.json();
        alert(`Consumers erro: ${consumersResponse.status} - ${errorData.message}`);
      }
      
      // Testar generators
      const generatorsResponse = await fetch('https://supabase-pagluz-backend-new.ztdny5.easypanel.hostgenerators', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (generatorsResponse.ok) {
        const data = await generatorsResponse.json();
        alert(`Generators funcionando! Total: ${data.length}`);
      } else {
        const errorData = await generatorsResponse.json();
        alert(`Generators erro: ${generatorsResponse.status} - ${errorData.message}`);
      }
      
    } catch (error) {
      alert(`Erro ao testar endpoints: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const clearToken = () => {
    localStorage.removeItem('accessToken');
    window.location.reload();
  };

  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-50 max-w-sm">
      <h3 className="font-bold text-lg mb-2">Debug Auth</h3>
      
      <div className="space-y-2 text-sm">
        <div><strong>Status:</strong> {isAuthenticated ? '✅ Autenticado' : '❌ Não autenticado'}</div>
        <div><strong>Loading:</strong> {loading ? '⏳ Carregando...' : '✅ Pronto'}</div>
        <div><strong>Token:</strong> {localStorage.getItem('accessToken') ? '✅ Presente' : '❌ Ausente'}</div>
        <div><strong>API Base:</strong> {import.meta.env.VITE_API_BASE_URL || 'Não definida'}</div>
        {user && (
          <div><strong>Usuário:</strong> {user.name} ({user.role})</div>
        )}
        {error && (
          <div><strong>Erro:</strong> <span className="text-red-600">{error}</span></div>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <Button onClick={testLogin} size="sm" variant="primary">
          Testar Login
        </Button>
        <Button onClick={testAPI} size="sm" variant="secondary">
          Testar API
        </Button>
        <Button onClick={testRepresentatives} size="sm" variant="neon">
          Testar Representantes
        </Button>
        <Button onClick={testApiService} size="sm" variant="danger">
          Testar API Service
        </Button>
        <Button onClick={testDirectLogin} size="sm" variant="success">
          Testar Login Direto
        </Button>
        <Button onClick={testEndpoints} size="sm" variant="warning">
          Testar Endpoints
        </Button>
        <Button onClick={clearToken} size="sm" variant="outline">
          Limpar Token
        </Button>
      </div>
    </div>
  );
}
