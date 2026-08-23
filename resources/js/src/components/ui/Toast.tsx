import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextType {
  toast: (type: ToastType, title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((type: ToastType, title: string, description?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, title, description }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000); // 5 seconds auto-dismiss
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={cn(
                "pointer-events-auto flex items-start gap-3 w-80 p-4 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border backdrop-blur-md",
                t.type === 'success' && "bg-green-500/10 border-green-500/30 text-green-400",
                t.type === 'error' && "bg-red-500/10 border-red-500/30 text-red-400",
                t.type === 'info' && "bg-blue-500/10 border-blue-500/30 text-blue-400"
              )}
            >
              {t.type === 'success' && <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />}
              {t.type === 'error' && <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />}
              {t.type === 'info' && <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />}
              
              <div className="flex-1">
                <h4 className="text-sm font-bold text-sa-text">{t.title}</h4>
                {t.description && <p className="text-xs mt-1 opacity-80">{t.description}</p>}
              </div>

              <button 
                onClick={() => removeToast(t.id)}
                className="opacity-50 hover:opacity-100 transition-opacity"
              >
                <X />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
