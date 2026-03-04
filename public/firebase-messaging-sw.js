importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBiuTx1bOlv5zZpZp5O1n-JQkL0mb4l4Qw",
  authDomain: "pagluz-push-notifacions.firebaseapp.com",
  projectId: "pagluz-push-notifacions",
  storageBucket: "pagluz-push-notifacions.firebasestorage.app",
  messagingSenderId: "903545758594",
  appId: "1:903545758594:web:3c702c7c09d2fde32ae59b",
  measurementId: "G-NCCGPT4J2J"
};

try {
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
} catch (error) {
  console.error('[firebase-messaging-sw.js] Error initializing Firebase', error);
}
