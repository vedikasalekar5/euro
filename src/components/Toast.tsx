import React, { useEffect } from 'react';
import { useAcademic } from '../context/AcademicContext';
import { AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Toast: React.FC = () => {
  const { toast, clearToast } = useAcademic();

  useEffect(() => {
    if (toast && toast.type === 'error') {
      const timer = setTimeout(() => {
        clearToast();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast, clearToast]);

  if (!toast || toast.type !== 'error') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 max-w-md shadow-2xl rounded-2xl border border-[#EF4444]/40 overflow-hidden backdrop-blur-md"
        id="error-toast-notification"
      >
        <div className="flex items-center gap-3 p-4 text-xs font-bold bg-[#0B1F3A] text-white border-b-2 border-[#EF4444]">
          <AlertCircle className="w-5 h-5 text-[#EF4444] shrink-0" />
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
