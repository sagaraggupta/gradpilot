"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

// 1. Define our shapes (TypeScript rules)
type ToastType = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  addToast: (message: string, type: ToastType) => void;
};

// 2. Create the Intercom System (Context)
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// 3. Create the Provider (The speaker that wraps around our app)
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Function to add a toast and automatically remove it after 3 seconds
  const addToast = (message: string, type: ToastType) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      
      {/* 4. The Global Toast Container (Fixed to the bottom right of the screen) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`flex items-center gap-3 p-4 rounded-xl shadow-lg border pointer-events-auto min-w-[300px] ${
                toast.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                toast.type === "error" ? "bg-red-500/10 border-red-500/20 text-red-500" :
                "bg-blue-500/10 border-blue-500/20 text-blue-500"
              }`}
            >
              {toast.type === "success" && <CheckCircle size={20} />}
              {toast.type === "error" && <AlertCircle size={20} />}
              {toast.type === "info" && <Info size={20} />}
              
              <span className="font-medium flex-1 text-white">{toast.message}</span>
              
              <button 
                onClick={() => removeToast(toast.id)} 
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// 5. Create a custom Hook to easily use the Intercom
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}