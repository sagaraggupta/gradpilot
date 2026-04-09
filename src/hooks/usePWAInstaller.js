import { useState, useEffect } from 'react';

export default function usePWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // 1. Check if they are already running the app in Standalone (installed) mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    // 2. 🧠 SMART DETECTION: Check if they previously dismissed the banner
    const hasDismissed = localStorage.getItem('hide_install_banner') === 'true';

    // If it's installed OR they dismissed it before, abort and stay hidden!
    if (isStandalone || hasDismissed) {
      return; 
    }

    // 3. Intercept the browser's default install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); 
      setDeferredPrompt(e); 
      setIsInstallable(true); 
    };

    // 4. Listen for when the installation actually finishes
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

  const installApp = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    
    setDeferredPrompt(null);
  };

  // 🧠 THE FIX: Save their choice to the browser's memory!
  const dismiss = () => {
    setIsInstallable(false);
    localStorage.setItem('hide_install_banner', 'true');
  };

  return { isInstallable, installApp, dismiss };
}