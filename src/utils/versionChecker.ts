/**
 * Sistema de detecção de nova versão da aplicação
 * Verifica periodicamente se há uma nova versão e notifica o usuário
 */

const VERSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos
const APP_VERSION_KEY = 'app_version';
const LAST_CHECK_KEY = 'last_version_check';

// Gera um hash simples baseado no timestamp do build
const getCurrentBuildHash = (): string => {
  // Pega o hash dos arquivos JS carregados
  const scripts = Array.from(document.getElementsByTagName('script'));
  const mainScript = scripts.find(s => s.src.includes('index') || s.src.includes('main'));

  if (mainScript?.src) {
    // Extrai o hash do nome do arquivo (ex: index.abc123.js -> abc123)
    const match = mainScript.src.match(/\.([a-f0-9]+)\.js/);
    return match ? match[1] : Date.now().toString();
  }

  return Date.now().toString();
};

// Salva a versão atual
export const saveCurrentVersion = (): void => {
  const version = getCurrentBuildHash();
  localStorage.setItem(APP_VERSION_KEY, version);
  localStorage.setItem(LAST_CHECK_KEY, Date.now().toString());
};

// Verifica se há uma nova versão disponível
export const checkForNewVersion = async (): Promise<boolean> => {
  try {
    const savedVersion = localStorage.getItem(APP_VERSION_KEY);

    // Força o navegador a buscar o index.html sem cache
    const response = await fetch(window.location.href, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    const html = await response.text();

    // Procura pelo hash do arquivo JS no HTML
    const scriptMatch = html.match(/src="[^"]*\/assets\/index\.([a-f0-9]+)\.js"/);
    const newVersion = scriptMatch ? scriptMatch[1] : null;

    if (newVersion && savedVersion && newVersion !== savedVersion) {
      console.log('🔄 Nova versão detectada!', { old: savedVersion, new: newVersion });
      return true;
    }

    return false;
  } catch (error) {
    console.error('Erro ao verificar nova versão:', error);
    return false;
  }
};

// Recarrega a página limpando todo o cache
export const reloadWithoutCache = (): void => {
  // Limpa o cache do service worker se existir
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => registration.unregister());
    });
  }

  // Limpa o cache do navegador
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }

  // Recarrega a página sem cache
  window.location.reload();
};

// Inicia o monitoramento de versão
export const startVersionMonitoring = (onNewVersion?: () => void): void => {
  // Salva a versão atual na primeira carga
  if (!localStorage.getItem(APP_VERSION_KEY)) {
    saveCurrentVersion();
  }

  // Verifica periodicamente por novas versões
  const checkInterval = setInterval(async () => {
    const hasNewVersion = await checkForNewVersion();

    if (hasNewVersion) {
      clearInterval(checkInterval);

      if (onNewVersion) {
        onNewVersion();
      } else {
        // Comportamento padrão: notifica e recarrega
        const shouldReload = confirm(
          '🔄 Uma nova versão do sistema está disponível!\n\n' +
          'Clique em OK para atualizar agora ou Cancelar para continuar usando esta versão.\n\n' +
          'Recomendamos atualizar para ter acesso às últimas funcionalidades e correções.'
        );

        if (shouldReload) {
          reloadWithoutCache();
        }
      }
    }
  }, VERSION_CHECK_INTERVAL);

  // Verifica também quando a aba volta a ficar ativa
  document.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
      const lastCheck = parseInt(localStorage.getItem(LAST_CHECK_KEY) || '0');
      const now = Date.now();

      // Se passou mais de 2 minutos desde a última verificação
      if (now - lastCheck > 2 * 60 * 1000) {
        const hasNewVersion = await checkForNewVersion();

        if (hasNewVersion && onNewVersion) {
          onNewVersion();
        }
      }
    }
  });
};

// Limpa dados antigos de versão (útil para debug)
export const clearVersionData = (): void => {
  localStorage.removeItem(APP_VERSION_KEY);
  localStorage.removeItem(LAST_CHECK_KEY);
};
