import React, { useEffect, useState } from 'react';
import { CollegeLogo } from '../../assets/collegeLogo';

interface AndroidSplashScreenProps {
  onFinish: () => void;
  minDurationMs?: number;
}

export const AndroidSplashScreen: React.FC<AndroidSplashScreenProps> = ({
  onFinish,
  minDurationMs = 1200,
}) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, minDurationMs - 300);

    const finishTimer = setTimeout(() => {
      onFinish();
    }, minDurationMs);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish, minDurationMs]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between bg-[#071426] text-white p-6 transition-opacity duration-300 select-none ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        paddingTop: 'calc(2rem + env(safe-area-inset-top, 0px))',
        paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))',
      }}
      id="android-splash-screen"
    >
      {/* Top spacing */}
      <div className="w-full" />

      {/* Center Branding Block */}
      <div className="flex flex-col items-center text-center space-y-5 animate-in fade-in zoom-in-95 duration-500">
        {/* Animated Logo with Glow */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[#00D9FF] blur-xl opacity-30 animate-pulse" />
          <CollegeLogo className="w-24 h-24 relative z-10 shadow-2xl rounded-full ring-4 ring-[#00D9FF]/40" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-3xl font-black tracking-wider text-white flex items-center justify-center gap-2">
            <span>EURO</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#00D9FF] animate-ping" />
          </h1>
          <p className="text-sm font-semibold tracking-wide text-[#67E8F9]">
            Unit Test 1 &amp; 2 Management System
          </p>
          <p className="text-xs text-[#8EA3BE] max-w-xs pt-1">
            Rajaram Shinde Institute of Engineering &amp; Technology
          </p>
        </div>

        {/* Android Material Spinner */}
        <div className="pt-4 flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-[#00D9FF]/20 border-t-[#00D9FF] rounded-full animate-spin" />
          <span className="text-xs font-mono text-[#8EA3BE] tracking-widest uppercase">
            Loading System...
          </span>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="text-center space-y-1 text-xs text-[#64748B]">
        <p className="text-[11px] text-[#8EA3BE] font-medium">
          Continuous Evaluation &amp; Academic Analytics
        </p>
        <p className="text-[10px] text-[#64748B]">
          Under the Guidance of <span className="text-[#D7E3EA] font-semibold">Prof. Sandesh A. Gajmal</span>
        </p>
      </div>
    </div>
  );
};
