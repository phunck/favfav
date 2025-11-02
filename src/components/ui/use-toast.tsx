// components/ui/use-toast.tsx
"use client";

import * as React from "react";

export type ToastOptions = {
  title?: string;
  description?: string;
  duration?: number; // ms
};

type ToastItem = ToastOptions & { id: number };

type ToastsContextValue = {
  toasts: ToastItem[];
  toast: (opts: ToastOptions) => void;
  dismiss: (id: number) => void;
};

const ToastsContext = React.createContext<ToastsContextValue | null>(null);

export function ToastsProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const idRef = React.useRef(0);

  const dismiss = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback((opts: ToastOptions) => {
    const id = ++idRef.current;
    const item: ToastItem = { id, ...opts };
    setToasts((prev) => [...prev, item]);
    const duration = opts.duration ?? 4000;
    if (duration > 0) {
      window.setTimeout(() => dismiss(id), duration);
    }
  }, [dismiss]);

  const value = React.useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss]);

  return <ToastsContext.Provider value={value}>{children}</ToastsContext.Provider>;
}

export function useToast() {
  const ctx = React.useContext(ToastsContext);
  if (!ctx) throw new Error("useToast must be used within <ToastsProvider>");
  return { toast: ctx.toast, dismiss: ctx.dismiss };
}

// interner Hook für das Toaster-UI
export function useToastsState() {
  const ctx = React.useContext(ToastsContext);
  if (!ctx) throw new Error("useToastsState must be used within <ToastsProvider>");
  return ctx;
}
