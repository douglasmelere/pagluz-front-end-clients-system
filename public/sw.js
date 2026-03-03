// ═══════════════════════════════════════════════════════════════
// PagLuz Service Worker  —  v2.0.0
// Cache inteligente · Offline fallback · Auto-update · Push
// ═══════════════════════════════════════════════════════════════

const SW_VERSION = '2.0.0';
const CACHE_PREFIX = 'pagluz';
const STATIC_CACHE = `${CACHE_PREFIX}-static-v${SW_VERSION}`;
const DYNAMIC_CACHE = `${CACHE_PREFIX}-dynamic-v${SW_VERSION}`;
const API_CACHE = `${CACHE_PREFIX}-api-v${SW_VERSION}`;
const IMAGE_CACHE = `${CACHE_PREFIX}-images-v${SW_VERSION}`;
const FONT_CACHE = `${CACHE_PREFIX}-fonts-v${SW_VERSION}`;

// ── Recursos para cache estático (App Shell) ────────────────────
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ── Limites de tamanho de cache ─────────────────────────────────
const CACHE_LIMITS = {
  [DYNAMIC_CACHE]: 80,
  [API_CACHE]: 50,
  [IMAGE_CACHE]: 60,
  [FONT_CACHE]: 20,
};

// ── Tempo máximo de cache para API (em ms) ──────────────────────
const API_CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutos

// ═══════════════════════════════════════════════════════════════
// INSTALL — Pré-cache do App Shell
// ═══════════════════════════════════════════════════════════════
self.addEventListener('install', (event) => {
  console.log(`[SW ${SW_VERSION}] Instalando...`);
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log(`[SW ${SW_VERSION}] Cacheando App Shell`);
        return cache.addAll(APP_SHELL);
      })
      .then(() => self.skipWaiting())
  );
});

// ═══════════════════════════════════════════════════════════════
// ACTIVATE — Limpa caches antigos
// ═══════════════════════════════════════════════════════════════
self.addEventListener('activate', (event) => {
  console.log(`[SW ${SW_VERSION}] Ativando...`);
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Remove caches que começam com nosso prefixo mas não são da versão atual
              return (
                name.startsWith(CACHE_PREFIX) &&
                name !== STATIC_CACHE &&
                name !== DYNAMIC_CACHE &&
                name !== API_CACHE &&
                name !== IMAGE_CACHE &&
                name !== FONT_CACHE
              );
            })
            .map((name) => {
              console.log(`[SW ${SW_VERSION}] Removendo cache antigo: ${name}`);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        // Notificar todos os clientes que há uma nova versão
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'SW_UPDATED',
              version: SW_VERSION,
            });
          });
        });
        return self.clients.claim();
      })
  );
});

// ═══════════════════════════════════════════════════════════════
// FETCH — Estratégias de cache por tipo de recurso
// ═══════════════════════════════════════════════════════════════
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests não-GET
  if (request.method !== 'GET') return;

  // Ignorar extensões do Chrome, protocolos especiais, etc.
  if (!url.protocol.startsWith('http')) return;

  // ── 1. Fonts (Google Fonts) → Cache First (longo prazo) ────
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  // ── 2. Imagens → Cache First ──────────────────────────────
  if (
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)
  ) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // ── 3. API calls → Network First com fallback ─────────────
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('pagluz')
  ) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // ── 4. Assets estáticos (JS, CSS) → Stale While Revalidate
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    url.pathname.match(/\.(js|css)$/)
  ) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
    return;
  }

  // ── 5. Navegação (HTML) → Network First com Offline Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, STATIC_CACHE).catch(() => {
        return caches.match('/index.html') || createOfflinePage();
      })
    );
    return;
  }

  // ── 6. Demais → Stale While Revalidate ────────────────────
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// ═══════════════════════════════════════════════════════════════
// Estratégias de Cache
// ═══════════════════════════════════════════════════════════════

/**
 * Cache First — Prioriza o cache, busca na rede apenas se não encontrar.
 * Ideal para: Fonts, imagens, assets que mudam raramente.
 */
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      await trimCache(cacheName);
    }
    return networkResponse;
  } catch (error) {
    // Retorna uma resposta vazia se offline e não há cache
    return new Response('', { status: 503, statusText: 'Service Unavailable' });
  }
}

/**
 * Network First — Tenta a rede primeiro, usa cache se offline.
 * Ideal para: APIs, dados dinâmicos.
 */
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      await trimCache(cacheName);
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    // Retorna 503 genérico para APIs sem cache
    return new Response(
      JSON.stringify({ error: 'Você está offline. Verifique sua conexão.' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Stale While Revalidate — Serve do cache imediatamente,
 * atualiza em background. O melhor dos dois mundos.
 * Ideal para: JS/CSS, frequentemente acessados.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
        trimCache(cacheName);
      }
      return networkResponse;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// ═══════════════════════════════════════════════════════════════
// Utilitários
// ═══════════════════════════════════════════════════════════════

/**
 * Limita o tamanho de um cache para evitar consumo excessivo de storage.
 */
async function trimCache(cacheName) {
  const limit = CACHE_LIMITS[cacheName];
  if (!limit) return;

  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > limit) {
    // Remove os mais antigos primeiro (FIFO)
    const toDelete = keys.slice(0, keys.length - limit);
    await Promise.all(toDelete.map((key) => cache.delete(key)));
  }
}

/**
 * Cria página de fallback offline (usada quando não há nada no cache)
 */
function createOfflinePage() {
  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PagLuz — Offline</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Inter', system-ui, sans-serif;
          background: linear-gradient(135deg, #01375A 0%, #0c3a59 50%, #01375A 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
        }
        .container {
          text-align: center;
          padding: 2rem;
          max-width: 420px;
        }
        .icon {
          width: 80px; height: 80px;
          margin: 0 auto 1.5rem;
          background: rgba(255,255,255,0.1);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.15);
        }
        h1 { font-size: 1.5rem; margin-bottom: 0.75rem; font-weight: 700; }
        p { color: rgba(255,255,255,0.7); line-height: 1.6; margin-bottom: 1.5rem; font-size: 0.95rem; }
        .retry-btn {
          padding: 12px 32px;
          background: linear-gradient(135deg, #EFEA45, #d4cf20);
          color: #01375A;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .retry-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(239,234,69,0.3);
        }
        .retry-btn:active { transform: scale(0.97); }
        .pulse {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">⚡</div>
        <h1>Você está offline</h1>
        <p>Sem conexão com a internet. Verifique sua rede Wi-Fi ou dados móveis e tente novamente.</p>
        <button class="retry-btn" onclick="window.location.reload()">
          Tentar Novamente
        </button>
        <p class="pulse" style="margin-top: 1.5rem; font-size: 0.8rem; color: rgba(255,255,255,0.4);">
          PagLuz — Sistema de Gestão Energética
        </p>
      </div>
    </body>
    </html>
  `;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

// ═══════════════════════════════════════════════════════════════
// Background Sync — Sincronizar dados quando voltar online
// ═══════════════════════════════════════════════════════════════
self.addEventListener('sync', (event) => {
  console.log(`[SW ${SW_VERSION}] Background sync: ${event.tag}`);
  if (event.tag === 'sync-pending-data') {
    event.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  try {
    // Buscar dados pendentes do IndexedDB (se implementado)
    console.log(`[SW ${SW_VERSION}] Sincronizando dados pendentes...`);
    // Notificar clientes
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: 'SYNC_COMPLETE' });
    });
  } catch (error) {
    console.error(`[SW ${SW_VERSION}] Erro na sincronização:`, error);
  }
}

// ═══════════════════════════════════════════════════════════════
// Push Notifications
// ═══════════════════════════════════════════════════════════════
self.addEventListener('push', (event) => {
  let data = {
    title: 'PagLuz',
    body: 'Nova notificação',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'pagluz-notification',
    data: { url: '/' },
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-96x96.png',
    tag: data.tag || 'pagluz-notification',
    vibrate: [100, 50, 100, 50, 200],
    data: data.data || { url: '/' },
    renotify: true,
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: '📂 Abrir',
      },
      {
        action: 'dismiss',
        title: '✕ Fechar',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Clique na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  if (event.action === 'dismiss') return;

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Se já há uma aba aberta, foca nela
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(urlToOpen);
            return;
          }
        }
        // Senão, abre uma nova aba
        return self.clients.openWindow(urlToOpen);
      })
  );
});

// ═══════════════════════════════════════════════════════════════
// Mensagens do cliente
// ═══════════════════════════════════════════════════════════════
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: SW_VERSION });
  }

  if (event.data?.type === 'CLEAR_CACHES') {
    caches.keys().then((names) => {
      Promise.all(names.map((name) => caches.delete(name))).then(() => {
        event.ports[0]?.postMessage({ cleared: true });
      });
    });
  }
});
