import React, { useEffect } from 'react';
import { useAcademic } from '../context/AcademicContext';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Toast: React.FC = () => {
  const { toast, clearToast } = useAcademic();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        clearToast();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, clearToast]);

  if (!toast) return null;

  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className={`fixed bottom-6 right-6 z-50 max-w-md shadow-2xl rounded-2xl border overflow-hidden backdrop-blur-md ${
          isError
            ? 'border-rose-500/40'
            : isSuccess
            ? 'border-emerald-500/40'
            : 'border-blue-500/40'
        }`}
        id="app-toast-notification"
      >
        <div
          className={`flex items-center gap-3 p-4 text-xs font-semibold bg-[#0B1F3A] text-white border-b-2 ${
            isError
              ? 'border-rose-500'
              : isSuccess
              ? 'border-emerald-500'
              : 'border-blue-500'
          }`}
        >
          {isError && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          {!isError && !isSuccess && <Info className="w-5 h-5 text-blue-400 shrink-0" />}
          <span className="flex-1 text-slate-100">{toast.message}</span>
          <button
            onClick={clearToast}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

