import { api } from '../types/services/api';

// Listar todos os comunicados (admin vê todos + quem leu)
export async function getComunicados() {
  const data = await api.get('/announcements');
  return Array.isArray(data) ? data : (data?.announcements || []);
}

// Criar comunicado
export async function createComunicado(data: {
  title: string;
  message: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  representativeId?: string; // omitir = envia para TODOS
}) {
  return await api.post('/announcements', data);
}

// Excluir comunicado
export async function deleteComunicado(id: string) {
  return await api.delete(`/announcements/${id}`);
}

// Detalhes com lista de quem leu
export async function getComunicadoDetails(id: string) {
  return await api.get(`/announcements/${id}`);
}
