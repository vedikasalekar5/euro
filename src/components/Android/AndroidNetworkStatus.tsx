import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

export const AndroidNetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsOnline(navigator.onLine);
      setIsRetrying(false);
    }, 1000);
  };

  if (isOnline) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-[#EF4444] text-white px-4 py-2 text-xs font-semibold shadow-lg flex items-center justify-between gap-3 animate-in slide-in-from-top duration-200"
      style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top, 0px))' }}
      id="android-offline-banner"
    >
      <div className="flex items-center gap-2 min-w-0">
        <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
        <span className="truncate">
          No internet connection. Please check your mobile data or Wi-Fi.
        </span>
      </div>
      <button
        type="button"
        onClick={handleRetry}
        disabled={isRetrying}
        className="px-3 py-1 bg-white/20 hover:bg-white/30 active:scale-95 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
      >
        <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
        <span>Retry</span>
      </button>
    </div>
  );
};
