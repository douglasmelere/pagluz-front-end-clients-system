import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBiuTx1bOlv5zZpZp5O1n-JQkL0mb4l4Qw",
  authDomain: "pagluz-push-notifacions.firebaseapp.com",
  projectId: "pagluz-push-notifacions",
  storageBucket: "pagluz-push-notifacions.firebasestorage.app",
  messagingSenderId: "903545758594",
  appId: "1:903545758594:web:3c702c7c09d2fde32ae59b",
  measurementId: "G-NCCGPT4J2J"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

// Initialize Firebase Cloud Messaging and get a reference to the service
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

// Helper function to request permission and get token
export const requestFirebaseNotificationPermission = async () => {
  try {
    if (!messaging) return null;

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const currentToken = await getToken(messaging, {
        // VAPID key is usually needed here for web push
        // vapidKey: 'YOUR_PUBLIC_VAPID_KEY_HERE' 
      });
      if (currentToken) {
        console.log('FCM Token received:', currentToken);
        return currentToken;
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
    } else {
      console.log('Notification permission not granted.');
    }
  } catch (error) {
    console.error('An error occurred while retrieving token. ', error);
  }
  return null;
};

export const onMessageListener = () => {
  if (!messaging) return;
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
};
