importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

// Pega as configurações passadas via URL query parameters quando o SW foi registrado
const urlParams = new URLSearchParams(self.location.search);

const firebaseConfig = {
  apiKey: urlParams.get('apiKey'),
  projectId: urlParams.get('projectId'),
  messagingSenderId: urlParams.get('messagingSenderId'),
  appId: urlParams.get('appId'),
};

try {
  // SÃ³ inicializa se todos os pÃ¢rametros existirem
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);
      const notificationTitle = payload.notification?.title || 'Novo Comunicado Pagluz';
      const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/icon-192x192.png',
        data: payload.data
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } else {
    console.warn('[firebase-messaging-sw.js] Missing Firebase config parameters in URL.');
  }
} catch (error) {
  console.error('[firebase-messaging-sw.js] Error initializing Firebase', error);
}
