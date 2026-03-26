importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAA8FKfDKMU7tPsUDDq5376DkNIVVdYsWc",
  authDomain: "gradpilot-39.firebaseapp.com",
  projectId: "gradpilot-39",
  storageBucket: "gradpilot-39.firebasestorage.app",
  messagingSenderId: "649944970049",
  appId: "1:649944970049:web:9772159ebab03368e327c0"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// This handles notifications when the user is NOT looking at your app (tab closed/minimized)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});