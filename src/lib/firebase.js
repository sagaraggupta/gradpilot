import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

// Your Firebase configuration (Matches your service worker)
const firebaseConfig = {
  apiKey: "AIzaSyAA8FKfDKMU7tPsUDDq5376DkNIVVdYsWc",
  authDomain: "gradpilot-39.firebaseapp.com",
  projectId: "gradpilot-39",
  storageBucket: "gradpilot-39.firebasestorage.app",
  messagingSenderId: "649944970049",
  appId: "1:649944970049:web:9772159ebab03368e327c0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
export const messaging = getMessaging(app);

export const generateFCMToken = async () => {
  try {
    // 🛡️ NEW: BROWSER SUPPORT CHECK
    // If the browser or current environment doesn't support Push, fail gracefully!
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn("Push notifications are not supported in this browser/context.");
      return null; 
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.error("Notification permission denied by user.");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: "BBp0ktEWzZoGm5R5dcoNe26DJWzuUkf3CwfupFVRu2yaUNSHL785ucsTT5D42vqP0GSO_W-_MSasUa0XyVId6TM" // Make sure your key is still here!
    });

    if (token) {
      return token;
    } else {
      return null;
    }
  } catch (error) {
    console.warn("FCM token generation skipped/failed:", error.message);
    return null; // Return null so the app continues without crashing!
  }
};