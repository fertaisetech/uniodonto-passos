import { useState, useEffect } from "react";

export function usePWAInstall() {
  const [installable, setInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent browser from showing automatic install bar
      e.preventDefault();
      // Store event to be triggered on button click
      setDeferredPrompt(e);
      setInstallable(true);
    };

    const handleAppInstalled = () => {
      // Clean up after successful installation
      setInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Initial check if we are already running standalone
    const isStandalone = 
      window.matchMedia("(display-mode: standalone)").matches || 
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setInstallable(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      return;
    }

    try {
      // Show native install dialog
      deferredPrompt.prompt();
      
      // Wait for user click response
      await deferredPrompt.userChoice;
      
      // Reset prompt state
      setDeferredPrompt(null);
      setInstallable(false);
    } catch (error) {
      setDeferredPrompt(null);
      setInstallable(false);
    }
  };

  return { installable, installApp };
}
