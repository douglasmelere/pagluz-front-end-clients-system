import { useState } from 'react';
import {
  Download,
  X,
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw,
  Zap,
  Share,
  Plus,
  CheckCircle,
  ChevronUp,
  Monitor,
} from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

// ═══════════════════════════════════════════════════════════════
// PWA Install Prompt — Componente premium
// ═══════════════════════════════════════════════════════════════

export default function PWAInstallPrompt() {
  const {
    canInstall,
    isInstalled,
    isIOS,
    isAndroid,
    isOffline,
    hasUpdate,
    promptInstall,
    dismissPrompt,
    applyUpdate,
  } = usePWA();

  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // ── Handler de instalação ────────────────────────────────
  const handleInstall = async () => {
    setIsInstalling(true);
    const accepted = await promptInstall();
    setIsInstalling(false);
    if (accepted) {
      setJustInstalled(true);
      setTimeout(() => setJustInstalled(false), 4000);
    }
  };

  // ── Feedback de sucesso ──────────────────────────────────
  if (justInstalled) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] animate-bounce-in">
        <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl shadow-2xl shadow-green-500/30">
          <CheckCircle className="h-6 w-6" />
          <div>
            <p className="font-bold text-sm">App instalado com sucesso!</p>
            <p className="text-xs text-white/80">Acesse pelo ícone na sua tela inicial</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Indicador de Offline ──────────────────────────── */}
      <OfflineIndicator isOffline={isOffline} />

      {/* ── Banner de Atualização ─────────────────────────── */}
      {hasUpdate && <UpdateBanner onApply={applyUpdate} />}

      {/* ── Prompt de Instalação (Android/Desktop) ────────── */}
      {canInstall && !isIOS && (
        <InstallCard
          isAndroid={isAndroid}
          isInstalling={isInstalling}
          onInstall={handleInstall}
          onDismiss={dismissPrompt}
        />
      )}

      {/* ── Prompt de Instalação (iOS) ────────────────────── */}
      {!isInstalled && isIOS && !canInstall && (
        <IOSInstallCard
          showGuide={showIOSGuide}
          onToggleGuide={() => setShowIOSGuide(!showIOSGuide)}
          onDismiss={dismissPrompt}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// Sub-componentes
// ═══════════════════════════════════════════════════════════════

/** Indicador de status offline — barra superior animada */
function OfflineIndicator({ isOffline }: { isOffline: boolean }) {
  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] animate-slide-down">
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white py-2.5 px-4 shadow-lg">
        <div className="max-w-screen-xl mx-auto flex items-center justify-center gap-3">
          <div className="relative">
            <WifiOff className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-red-400 rounded-full animate-pulse" />
          </div>
          <p className="text-sm font-semibold">
            Sem conexão — O app funciona offline com dados em cache
          </p>
          <button
            onClick={() => window.location.reload()}
            className="ml-2 p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            title="Tentar reconectar"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Banner de atualização disponível — fixo no topo */
function UpdateBanner({ onApply }: { onApply: () => void }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9998] animate-slide-down">
      <div className="bg-gradient-to-r from-accent to-accent-secondary text-white py-3 px-4 shadow-xl">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <RefreshCw className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold">Nova versão disponível!</p>
              <p className="text-xs text-white/80">Atualize para ter novos recursos e correções</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onApply}
              className="px-4 py-2 bg-white text-accent font-bold text-xs rounded-lg hover:bg-white/90 transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              Atualizar agora
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Card de instalação para Android/Desktop */
function InstallCard({
  isAndroid,
  isInstalling,
  onInstall,
  onDismiss,
}: {
  isAndroid: boolean;
  isInstalling: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 w-[360px] max-w-[calc(100vw-3rem)] z-[9000] animate-slide-up">
      <div className="relative overflow-hidden bg-white rounded-2xl shadow-2xl shadow-black/15 border border-slate-100">
        {/* Stripe decorativo superior */}
        <div className="h-1.5 bg-gradient-to-r from-accent via-accent-secondary to-[#EFEA45]" />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="p-2.5 bg-gradient-to-br from-[#01375A] to-[#0c5a8f] rounded-xl shadow-lg">
                  <Zap className="h-6 w-6 text-[#EFEA45]" />
                </div>
                {/* Ponto verde de "ao vivo" */}
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-400 rounded-full border-2 border-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Instalar PagLuz</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {isAndroid ? 'Adicione à sua tela inicial' : 'Como um app nativo'}
                </p>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Benefícios */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { icon: Wifi, label: 'Acesso offline', color: 'text-blue-500 bg-blue-50' },
              { icon: Zap, label: 'Mais rápido', color: 'text-amber-500 bg-amber-50' },
              { icon: isAndroid ? Smartphone : Monitor, label: isAndroid ? 'Como um app' : 'Na área de trabalho', color: 'text-emerald-500 bg-emerald-50' },
            ].map((benefit, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-slate-100 bg-slate-50/50"
              >
                <div className={`p-1.5 rounded-lg ${benefit.color}`}>
                  <benefit.icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] text-slate-600 font-semibold text-center leading-tight">
                  {benefit.label}
                </span>
              </div>
            ))}
          </div>

          {/* Botão de instalar */}
          <button
            onClick={onInstall}
            disabled={isInstalling}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5
              bg-gradient-to-r from-[#01375A] to-[#0c5a8f]
              text-white font-bold text-sm rounded-xl
              hover:shadow-xl hover:shadow-[#01375A]/25 hover:-translate-y-0.5
              active:scale-[0.98] transition-all duration-200
              disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {isInstalling ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Instalando...</span>
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                <span>Instalar App</span>
              </>
            )}
          </button>

          {/* Texto de segurança */}
          <p className="text-[10px] text-slate-400 text-center mt-3 leading-relaxed">
            Instalação leve e rápida · Sem ocupar espaço · Sem loja de apps
          </p>
        </div>
      </div>
    </div>
  );
}

/** Card de instalação iOS (com instruções manuais) */
function IOSInstallCard({
  showGuide,
  onToggleGuide,
  onDismiss,
}: {
  showGuide: boolean;
  onToggleGuide: () => void;
  onDismiss: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);

  // Verificar se foi descartado
  if (dismissed) return null;

  // Verificar cooldown do dismiss
  try {
    const ts = localStorage.getItem('pagluz_pwa_ios_dismiss');
    if (ts && Date.now() - parseInt(ts, 10) < 3 * 24 * 60 * 60 * 1000) return null;
  } catch { /* ignore */ }

  const handleDismiss = () => {
    setDismissed(true);
    try { localStorage.setItem('pagluz_pwa_ios_dismiss', Date.now().toString()); } catch { /* ignore */ }
    onDismiss();
  };

  return (
    <div className="fixed bottom-6 right-6 w-[360px] max-w-[calc(100vw-3rem)] z-[9000] animate-slide-up">
      <div className="relative overflow-hidden bg-white rounded-2xl shadow-2xl shadow-black/15 border border-slate-100">
        <div className="h-1.5 bg-gradient-to-r from-accent via-accent-secondary to-[#EFEA45]" />

        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-[#01375A] to-[#0c5a8f] rounded-xl shadow-lg">
                <Smartphone className="h-6 w-6 text-[#EFEA45]" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Instalar no iPhone</h3>
                <p className="text-xs text-slate-500 font-medium">Acesse como um app nativo</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={onToggleGuide}
            className="w-full flex items-center justify-between px-4 py-3
              bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100
              text-blue-700 text-sm font-semibold
              hover:from-blue-100 hover:to-indigo-100 transition-all"
          >
            <span>Como instalar no Safari</span>
            <ChevronUp className={`h-4 w-4 transition-transform ${showGuide ? '' : 'rotate-180'}`} />
          </button>

          {showGuide && (
            <div className="mt-3 space-y-3 animate-fade-in">
              {[
                {
                  step: 1,
                  icon: Share,
                  text: (
                    <>
                      Toque no botão <strong>Compartilhar</strong>{' '}
                      <Share className="inline h-3.5 w-3.5 text-blue-500" /> na barra do Safari
                    </>
                  ),
                },
                {
                  step: 2,
                  icon: Plus,
                  text: (
                    <>
                      Role e toque em{' '}
                      <strong>"Adicionar à Tela de Início"</strong>{' '}
                      <Plus className="inline h-3.5 w-3.5 text-blue-500" />
                    </>
                  ),
                },
                {
                  step: 3,
                  icon: CheckCircle,
                  text: (
                    <>
                      Confirme tocando em <strong>"Adicionar"</strong>
                    </>
                  ),
                },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="shrink-0 w-7 h-7 flex items-center justify-center
                    bg-gradient-to-br from-accent to-accent-secondary
                    text-white text-xs font-bold rounded-lg shadow-sm">
                    {item.step}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed pt-0.5">{item.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Animações CSS inline (injetadas uma vez)
// ═══════════════════════════════════════════════════════════════

const pwaStyles = `
  @keyframes pwa-slide-up {
    from { transform: translateY(120%); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }
  @keyframes pwa-slide-down {
    from { transform: translateY(-100%); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }
  @keyframes pwa-bounce-in {
    0%   { transform: translate(-50%, 20px) scale(0.9); opacity: 0; }
    60%  { transform: translate(-50%, -8px) scale(1.02); }
    100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
  }
  @keyframes pwa-fade-in {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .animate-slide-up   { animation: pwa-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .animate-slide-down  { animation: pwa-slide-down 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .animate-bounce-in   { animation: pwa-bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
  .animate-fade-in     { animation: pwa-fade-in 0.3s ease-out forwards; }
`;

if (typeof document !== 'undefined') {
  const existing = document.getElementById('pwa-styles');
  if (!existing) {
    const style = document.createElement('style');
    style.id = 'pwa-styles';
    style.textContent = pwaStyles;
    document.head.appendChild(style);
  }
}
