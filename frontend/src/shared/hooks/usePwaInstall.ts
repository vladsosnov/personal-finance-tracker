"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const IOS_HINT_DISMISSED_KEY = "pwa_ios_hint_dismissed";

const isIosSafari = () => {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isInStandaloneMode = "standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true;
  return isIos && !isInStandaloneMode;
};

export const usePwaInstall = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [iosHintDismissed, setIosHintDismissed] = useState(false);

  useEffect(() => {
    setIsIos(isIosSafari());
    setIosHintDismissed(localStorage.getItem(IOS_HINT_DISMISSED_KEY) === "1");

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstallPrompt(null);
    }
  };

  const dismissIosHint = () => {
    localStorage.setItem(IOS_HINT_DISMISSED_KEY, "1");
    setIosHintDismissed(true);
  };

  return { canInstall: Boolean(installPrompt), install, isIos: isIos && !iosHintDismissed, dismissIosHint };
};
