import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setVisible(true);
    };

    const handleInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall as any);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall as any);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      setVisible(false);
      setDeferredPrompt(null);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-6 z-50 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl">
      <div className="space-y-3">
        <p className="text-sm font-semibold">Installer UnivMarket</p>
        <p className="text-sm text-muted-foreground">Ajoutez l’application UnivMarket à votre appareil pour un accès plus rapide.</p>
        <Button onClick={handleInstall}>Installer l'application</Button>
      </div>
    </div>
  );
}
