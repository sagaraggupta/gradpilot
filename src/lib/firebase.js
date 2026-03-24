import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

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
export const messaging = getMessaging(app);

// Function to request permission and get the FCM Token
export const generateFCMToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      alert("Please allow notifications!");
      return null;
    }

    // This reaches out to Google's servers to get your unique device ID
    const token = await getToken(messaging, {
      vapidKey: "BBp0ktEWzZoGm5R5dcoNe26DJWzuUkf3CwfupFVRu2yaUNSHL785ucsTT5D42vqP0GSO_W-_MSasUa0XyVId6TM"
    });

    if (token) {
      console.log("🎉 FCM Token Generated:", token);
      return token;
    } else {
      console.log("⚠️ No registration token available.");
      return null;
    }
  } catch (error) {
    console.error("❌ Failed to generate FCM token:", error);
    return null;
  }
};