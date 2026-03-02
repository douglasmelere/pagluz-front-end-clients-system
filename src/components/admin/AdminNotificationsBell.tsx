import { useState, useEffect, useRef } from 'react';
import { api } from '../../types/services/api';
import { AdminNotification } from '../../types';
import { Bell, Check, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../../hooks/useAuth';

export default function AdminNotificationsBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const data = await api.get('/admin-notifications/unread');
      setNotifications(data || []);
    } catch (err) {
      // Ignora silenciosamente
    }
  };

  useEffect(() => {
    const userRole = (user?.role as unknown as string || '').toUpperCase();
    const isOperatorPlus = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR'].includes(userRole);
    if (!isOperatorPlus) return;

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 2 * 60 * 1000); // Polling a cada 2 mins
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      await api.patch(`/admin-notifications/${id}/read`, {});
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      // Falha silenciosa
    }
  };

  const handleClearAll = async () => {
    for (const notif of notifications) {
      await handleMarkAsRead(notif.id);
    }
    setIsOpen(false);
  };

  const userRole = (user?.role as unknown as string || '').toUpperCase();
  const isOperatorPlus = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR'].includes(userRole);
  if (!isOperatorPlus) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-accent bg-white border border-slate-200 hover:bg-slate-50 transition-colors rounded-xl flex items-center justify-center shadow-sm h-9 sm:h-10 w-9 sm:w-10 focus:outline-none focus:ring-2 focus:ring-accent/20"
      >
        <Bell className="h-5 w-5" />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 transform translate-x-1/2 -translate-y-1/2 inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold leading-none text-white bg-red-500 rounded-full px-1 shadow-[0_0_0_2px_#fff]">
            {notifications.length > 99 ? '99+' : notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 z-[3000] overflow-hidden">
          <div className="flex bg-slate-50 border-b border-slate-100 items-center justify-between px-4 py-3">
            <h3 className="font-display font-semibold text-slate-800 tracking-tight">Notificações</h3>
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-xs font-medium text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Limpar tudo
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 mb-3">
                  <Bell className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-sm text-slate-500">Nenhuma notificação não lida.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((notif) => (
                  <div key={notif.id} className="p-4 hover:bg-slate-50 transition-colors flex gap-3 group">
                    <div className="shrink-0 pt-0.5">
                      <div className="w-2 h-2 mt-1.5 bg-accent rounded-full shadow-[0_0_8px_rgba(var(--accent),0.5)]"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-display font-semibold text-slate-800 truncate">{notif.title}</p>
                      <p className="text-sm text-slate-600 line-clamp-2 mt-0.5 leading-snug">{notif.message}</p>
                      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    <div>
                      <button
                        onClick={(e) => handleMarkAsRead(notif.id, e)}
                        className="p-1.5 text-slate-300 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Marcar como lida"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
