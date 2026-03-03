import { useState, useEffect, useCallback, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAStatus {
  /** O dispositivo/navegador suporta instalação PWA */
  canInstall: boolean;
  /** O app já está instalado (standalone) */
  isInstalled: boolean;
  /** O usuário está no iOS (precisa de instruções manuais) */
  isIOS: boolean;
  /** O usuário está no Android */
  isAndroid: boolean;
  /** O app está offline */
  isOffline: boolean;
  /** Há uma atualização do Service Worker disponível */
  hasUpdate: boolean;
  /** Versão do Service Worker ativa */
  swVersion: string | null;
  /** Se o prompt foi descartado recentemente (respeitamos "não perturbe") */
  wasDismissed: boolean;
}

const DISMISS_KEY = 'pagluz_pwa_dismiss_ts';
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

// ═══════════════════════════════════════════════════════════════
// Hook principal
// ═══════════════════════════════════════════════════════════════

export function usePWA() {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [swVersion, setSwVersion] = useState<string | null>(null);
  const waitingSwRef = useRef<ServiceWorker | null>(null);

  // ── Detecção de plataforma ───────────────────────────────
  const ua = navigator.userAgent || '';
  const isIOS = /iP(ad|hone|od)/.test(ua) && !(window as any).MSStream;
  const isAndroid = /Android/i.test(ua);

  // ── Verificar se foi descartado recentemente ─────────────
  const wasDismissed = (() => {
    try {
      const ts = localStorage.getItem(DISMISS_KEY);
      if (!ts) return false;
      return Date.now() - parseInt(ts, 10) < DISMISS_COOLDOWN_MS;
    } catch {
      return false;
    }
  })();

  // ── Verificar se já está instalado ───────────────────────
  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    };

    checkInstalled();

    // Escuta mudanças no display-mode (quando instala/desinstala)
    const mql = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mql.addEventListener?.('change', handleChange);

    return () => mql.removeEventListener?.('change', handleChange);
  }, []);

  // ── Capturar evento beforeinstallprompt ───────────────────
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      deferredPromptRef.current = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // ── Monitorar estado da conexão ──────────────────────────
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ── Monitorar atualizações do Service Worker ─────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Escutar mensagens do SW
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SW_UPDATED') {
        setHasUpdate(true);
        setSwVersion(event.data.version);
      }
      if (event.data?.type === 'SYNC_COMPLETE') {
        // Poderia disparar um toast aqui via evento
        console.log('[PWA] Sincronização concluída');
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    // Verificar se há SW waiting (atualização pendente)
    navigator.serviceWorker.ready.then((registration) => {
      // Obter versão atual
      if (registration.active) {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (e) => {
          if (e.data?.version) {
            setSwVersion(e.data.version);
          }
        };
        registration.active.postMessage(
          { type: 'GET_VERSION' },
          [messageChannel.port2]
        );
      }

      // SW waiting = atualização disponível
      if (registration.waiting) {
        waitingSwRef.current = registration.waiting;
        setHasUpdate(true);
      }

      // Detectar novas atualizações
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            waitingSwRef.current = newWorker;
            setHasUpdate(true);
          }
        });
      });
    });

    // Verificar atualização periodicamente (a cada 30min)
    const interval = setInterval(() => {
      navigator.serviceWorker.ready.then((reg) => reg.update());
    }, 30 * 60 * 1000);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
      clearInterval(interval);
    };
  }, []);

  // ── Ações ────────────────────────────────────────────────

  /** Dispara o prompt de instalação nativo */
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPromptRef.current) return false;

    try {
      await deferredPromptRef.current.prompt();
      const { outcome } = await deferredPromptRef.current.userChoice;

      if (outcome === 'accepted') {
        setIsInstalled(true);
        setCanInstall(false);
        deferredPromptRef.current = null;
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }, []);

  /** Descarta o prompt com cooldown de 7 dias */
  const dismissPrompt = useCallback(() => {
    setCanInstall(false);
    deferredPromptRef.current = null;
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch { /* quota exceeded, ignore */ }
  }, []);

  /** Aplica a atualização pendente do SW (reload) */
  const applyUpdate = useCallback(() => {
    if (waitingSwRef.current) {
      waitingSwRef.current.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  }, []);

  /** Limpa todos os caches do SW */
  const clearCaches = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return;
    const registration = await navigator.serviceWorker.ready;
    if (registration.active) {
      const messageChannel = new MessageChannel();
      return new Promise<void>((resolve) => {
        messageChannel.port1.onmessage = () => resolve();
        registration.active!.postMessage(
          { type: 'CLEAR_CACHES' },
          [messageChannel.port2]
        );
      });
    }
  }, []);

  const status: PWAStatus = {
    canInstall: canInstall && !isInstalled && !wasDismissed,
    isInstalled,
    isIOS,
    isAndroid,
    isOffline,
    hasUpdate,
    swVersion,
    wasDismissed,
  };

  return {
    ...status,
    promptInstall,
    dismissPrompt,
    applyUpdate,
    clearCaches,
  };
}
