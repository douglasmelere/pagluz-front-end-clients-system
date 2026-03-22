import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, Trash2, PlusCircle, Loader2, Sparkles } from 'lucide-react';
import { AiAssistantService, ConversationInfo } from '../../types/services/ai-assistant.service';
import { useToast } from '../../hooks/useToast';
import Toast from '../common/Toast';
interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp?: string;
}

export default function AIAssistant() {
  const [conversations, setConversations] = useState<ConversationInfo[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    // Scroll para baixo quando nova mensagem chega
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const loadConversations = async () => {
    try {
      const data = await AiAssistantService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Erro ao listar conversas:', error);
    }
  };

  const loadHistory = async (id: string) => {
    try {
      setIsLoading(true);
      const data = await AiAssistantService.getConversationHistory(id);
      setMessages(data.messages);
      setActiveConvId(id);
    } catch (error) {
      toast.showError('Erro ao carregar histórico');
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    setActiveConvId(null);
    setMessages([]);
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await AiAssistantService.deleteConversation(id);
      if (activeConvId === id) {
        startNewConversation();
      }
      loadConversations();
      toast.showSuccess('Conversa excluída');
    } catch (error) {
      toast.showError('Erro ao excluir');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput('');
    
    // Adiciona msg do usuário na tela instantaneamente
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);
    
    try {
      const result = await AiAssistantService.sendMessage({
        message: userMsg,
        conversationId: activeConvId || undefined
      });
      // Puxa a resposta e atualiza o ID da conversa caso fosse nova
      setMessages(prev => [...prev, { role: 'model', content: result.response }]);
      
      if (!activeConvId) {
        setActiveConvId(result.conversationId);
        loadConversations(); // recarrega a sidebar
      }
    } catch (error: any) {
      toast.showError('Erro ao comunicar com a IA');
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: `❌ Ocorreu um erro: ${error.response?.data?.message || 'Falha de conexão. Tente novamente.'}` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] w-full gap-4 bg-gray-50 p-4 relative">
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toast.toasts.map(t => (<div key={t.id} className="pointer-events-auto"><Toast type={t.type} message={t.message} onClose={() => toast.removeToast(t.id)} /></div>))}
      </div>

      {/* SIDEBAR DE CONVERSAS */}
      <div className="flex w-80 flex-col rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <button 
            onClick={startNewConversation}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700 transition"
          >
            <PlusCircle size={18} />
            Nova Conversa
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <p className="p-4 text-center text-sm text-gray-500">Nenhuma conversa recente.</p>
          ) : (
            conversations.map(conv => (
              <div 
                key={conv.id}
                onClick={() => loadHistory(conv.id)}
                className={`group flex cursor-pointer items-center justify-between rounded-lg p-3 outline-none transition-colors ${activeConvId === conv.id ? 'bg-emerald-50 text-emerald-800' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <div className="truncate pr-2">
                  <p className="truncate text-sm font-medium">
                    {conv.preview || 'Nova Conversa'}
                  </p>
                  <p className="text-xs opacity-70">
                    {new Date(conv.lastMessageAt).toLocaleDateString()}
                  </p>
                </div>
                <button 
                  onClick={(e) => handleDeleteConversation(conv.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      {/* ÁREA DE CHAT */}
      <div className="flex flex-1 flex-col rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden relative">
        {/* CABEÇALHO CHAT */}
        <div className="flex items-center gap-3 border-b border-gray-100 bg-white p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">IA Assistant (Monica)</h2>
            <p className="text-xs text-emerald-600 font-medium tracking-wide flex items-center gap-1">
               <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              ON-LINE PARA ADMINS
            </p>
          </div>
        </div>
        {/* LISTA DE MENSAGENS */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8fafc]">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center opacity-60">
              <Bot size={48} className="mb-4 text-emerald-600" />
              <h3 className="text-xl font-bold text-gray-700">Como posso ajudar hoje?</h3>
              <p className="mt-2 text-sm text-gray-500 max-w-sm">
                Eu posso listar, criar, editar informações de consumidores, geradores, representantes e calcular comissões do sistema para você.
              </p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[80%] gap-4 rounded-2xl p-4 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-br-none' 
                  : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
              }`}>
                {msg.role === 'model' && (
                  <div className="flex-shrink-0 pt-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <Bot size={18} />
                    </div>
                  </div>
                )}
                
                <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : 'prose-emerald'}`}>
                  {msg.role === 'user' ? (
                     <span className="whitespace-pre-wrap">{msg.content}</span>
                  ) : (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex w-full justify-start">
              <div className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm rounded-bl-none items-center border border-gray-100">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Bot size={18} />
                </div>
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                  <Loader2 className="animate-spin" size={16} />
                   Processando ações no sistema...
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {/* INPUT AREA */}
        <div className="border-t border-gray-100 bg-white p-4">
          <form onSubmit={handleSendMessage} className="relative flex items-end overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              disabled={isLoading}
              placeholder="Ex: Liste os consumidores rejeitados de SC..."
              className="max-h-32 min-h-[56px] w-full resize-none border-0 bg-transparent py-4 pl-4 pr-14 text-sm focus:ring-0 disabled:opacity-50"
              rows={1}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 bottom-2 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </form>
          <div className="mt-2 text-center text-[10px] text-gray-400">
            A IA pode cometer erros em seus cálculos informativos. Recomendações críticas requerem sua aprovação. Pressione Shift + Enter para quebrar linha.
          </div>
        </div>
      </div>
    </div>
  );
}
