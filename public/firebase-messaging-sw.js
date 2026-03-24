importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAA8FKfDKMU7tPsUDDq5376DkNIVVdYsWc",
  authDomain: "gradpilot-39.firebaseapp.com",
  projectId: "gradpilot-39",
  storageBucket: "gradpilot-39.firebasestorage.app",
  messagingSenderId: "649944970049",
  appId: "1:649944970049:web:9772159ebab03368e327c0"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || "GradPilot";
  const notificationOptions = {
    body: payload.notification?.body || "New Notification",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});