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

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/GradPilot.png', // Changed to your actual icon!
    badge: '/GradPilot.png',
    tag: 'gradpilot-update', // Prevents notification spam on the lock screen
    data: { url: payload.data?.url || '/' } // Allows us to deep-link!
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 🚀 NEW: Make the notification clickable!
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If they already have GradPilot open, just focus that tab
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window to the app
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});