const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.pagluz.com.br';

// Configuração base do fetch
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('accessToken');
  
  const method = (options.method || 'GET').toUpperCase();

  const baseHeaders: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Só definir Content-Type quando houver body (POST/PUT/PATCH)
  const contentTypeHeader = options.body ? { 'Content-Type': 'application/json' } : {};

  const headers = {
    ...baseHeaders,
    ...contentTypeHeader,
    ...(options.headers as any),
  } as HeadersInit;

  const config: RequestInit = {
    ...options,
    method,
    headers,
  };

  const fullUrl = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(fullUrl, config);
    
    if (!response.ok) {
      // Tentar fazer parsing da resposta de erro, mas não falhar se estiver vazia
      let errorData = {};
      try {
        const errorText = await response.text();
        if (errorText.trim()) {
          errorData = JSON.parse(errorText);
        }
      } catch (parseError) {
        // Se não conseguir fazer parse, usar dados básicos
        errorData = { message: `HTTP error! status: ${response.status}` };
      }
      
      const message = Array.isArray((errorData as any).message) 
        ? (errorData as any).message.join(', ') 
        : (errorData as any).message || `HTTP error! status: ${response.status}`;
      
      throw new Error(message);
    }
    
    // Verificar se há conteúdo antes de fazer parsing
    const responseText = await response.text();
    if (!responseText.trim()) {
      // Resposta vazia (comum em DELETE)
      return null;
    }
    
    const data = JSON.parse(responseText);
    return data;
  } catch (error) {
    throw error;
  }
};

export const api = {
  get: (endpoint: string) => apiRequest(endpoint),
  post: (endpoint: string, data: any) => apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  put: (endpoint: string, data: any) => apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  patch: (endpoint: string, data: any) => apiRequest(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (endpoint: string) => apiRequest(endpoint, {
    method: 'DELETE',
  }),
};