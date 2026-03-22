import { api } from './api';

export interface ChatMessageDto {
  message: string;
  conversationId?: string;
}
export interface ConversationInfo {
  id: string;
  messagesCount: number;
  preview: string;
  createdAt: string;
  lastMessageAt: string;
}
export interface AIAction {
  tool: string;
  result: any;
  success: boolean;
}
export interface ChatResponse {
  response: string;
  conversationId: string;
  actionsExecuted: AIAction[];
}
export const AiAssistantService = {
  // Envia mensagem para a IA
  async sendMessage(data: ChatMessageDto): Promise<ChatResponse> {
    const response = await api.post('/ai-assistant/chat', data);
    return response.data;
  },
  // Lista histórico de conversas
  async getConversations(): Promise<ConversationInfo[]> {
    const response = await api.get('/ai-assistant/conversations');
    return response.data;
  },
  // Puxa histórico de uma conversa específica
  async getConversationHistory(id: string) {
    const response = await api.get(`/ai-assistant/conversations/${id}`);
    return response.data;
  },
  // Exclui uma conversa
  async deleteConversation(id: string): Promise<void> {
    await api.delete(`/ai-assistant/conversations/${id}`);
  }
};
