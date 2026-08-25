import React, { useState, useEffect } from 'react';
import { Download, Share2, Smartphone, ShieldCheck, CheckCircle2, Sparkles, X } from 'lucide-react';
import { CollegeLogo } from '../../assets/collegeLogo';

export const AndroidInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone display mode (installed PWA / APK / TWA)
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Also check after 2 seconds if user is on mobile
    const isMobileDevice = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    const timer = setTimeout(() => {
      if (isMobileDevice && !sessionStorage.getItem('euro_install_banner_closed')) {
        setShowBanner(true);
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowHelpModal(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('euro_install_banner_closed', 'true');
  };

  if (isInstalled || !showBanner) return null;

  return (
    <>
      {/* Subtle Mobile Install Prompt Banner */}
      <div
        className="fixed bottom-18 lg:bottom-4 left-3 right-3 lg:left-auto lg:right-4 z-40 max-w-md bg-[#0B1F3A] text-white p-3.5 rounded-2xl border border-[#00D9FF]/40 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300"
        id="android-install-banner"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
            <CollegeLogo className="w-10 h-10 rounded-xl shadow-md ring-2 ring-[#00D9FF]/30 shrink-0" />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#00D9FF] text-[#0B1F3A] flex items-center justify-center text-[9px] font-black">
              ✓
            </span>
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black text-white truncate flex items-center gap-1.5">
              <span>Install EURO App</span>
              <span className="px-1.5 py-0.2 text-[9.5px] bg-[#102A43] text-[#67E8F9] rounded-md font-mono">
                Android
              </span>
            </h4>
            <p className="text-[11px] text-[#8EA3BE] truncate">
              Install to Home Screen for fast native access
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-[#00D9FF] hover:bg-[#67E8F9] active:scale-95 text-[#0B1F3A] text-xs font-black rounded-xl shadow-md shadow-[#00D9FF]/20 transition-all flex items-center gap-1.5 cursor-pointer"
            id="install-euro-app-btn"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Install</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 text-[#8EA3BE] hover:text-white rounded-lg transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Help Modal if browser does not trigger native beforeinstallprompt */}
      {showHelpModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#071426]/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="bg-[#0B1F3A] text-white border border-[#102A43] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#102A43] pb-3">
              <div className="flex items-center gap-2.5">
                <CollegeLogo className="w-8 h-8 rounded-lg" />
                <h3 className="text-sm font-black text-white">Install EURO on Android</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="text-[#8EA3BE] hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#8EA3BE]">
              To add the <strong>EURO Test Management System</strong> directly to your Android home screen as an app:
            </p>

            <ol className="text-xs text-[#D7E3EA] space-y-2.5 list-decimal list-inside bg-[#071426]/60 p-3.5 rounded-2xl border border-[#102A43]">
              <li>
                Tap the <strong>Chrome menu (⋮)</strong> in the top right corner of your browser.
              </li>
              <li>
                Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
              </li>
              <li>
                Tap <strong>"Install"</strong> to add the EURO icon to your phone screen.
              </li>
            </ol>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-full py-2.5 bg-[#00D9FF] text-[#0B1F3A] font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
