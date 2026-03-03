import { api } from '../types/services/api';

// Listar todos os materiais
export async function getMateriais(onlyActive?: boolean) {
  const query = onlyActive ? '?onlyActive=true' : '';
  const data = await api.get(`/commercial-materials${query}`);
  return Array.isArray(data) ? data : [];
}

// Upload de novo material
export async function uploadMaterial(formData: FormData) {
  return await api.post('/commercial-materials', formData);
}

// Atualizar metadados
export async function updateMaterial(id: string, data: {
  title?: string;
  description?: string;
  category?: string;
  isActive?: boolean;
}) {
  return await api.patch(`/commercial-materials/${id}`, data);
}

// Obter URL assinada de download
export async function getDownloadUrl(id: string) {
  const data: any = await api.get(`/commercial-materials/${id}/download-url`);
  return {
    url: data.url || data.downloadUrl,
    fileName: data.fileName || 'arquivo'
  };
}

// Excluir material
export async function deleteMaterial(id: string) {
  return await api.delete(`/commercial-materials/${id}`);
}
