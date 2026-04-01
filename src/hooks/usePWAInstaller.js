import { useState, useEffect } from 'react';

export default function usePWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // 1. Check if they are already running the app in Standalone (installed) mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return; 
    }

    // 2. Intercept the browser's default install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // Stop Chrome from showing its ugly default bar
      setDeferredPrompt(e); // Save the event so we can trigger it later
      setIsInstallable(true); // Tell our React UI to show the custom banner
    };

    // 3. Listen for when the installation actually finishes
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('GradPilot was successfully installed!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 4. The function our custom button will call to trigger the real install
  const installApp = async () => {
    if (!deferredPrompt) return;
    
    // Show the native prompt
    deferredPrompt.prompt();
    
    // Wait for the user to click "Install" or "Cancel"
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    
    // We can only use the prompt once, so clear it out
    setDeferredPrompt(null);
  };

  const dismiss = () => setIsInstallable(false);

  return { isInstallable, installApp, dismiss };
}