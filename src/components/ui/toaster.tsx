// components/ui/toaster.tsx
"use client";

import * as React from "react";
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from "@/components/ui/toast";
import { useToastsState } from "@/components/ui/use-toast";

export function Toaster() {
  const { toasts, dismiss } = useToastsState();

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map((t) => (
        <Toast key={t.id} onOpenChange={(open) => !open && dismiss(t.id)}>
          <div className="grid gap-1 pr-6">
            {t.title && <ToastTitle>{t.title}</ToastTitle>}
            {t.description && <ToastDescription>{t.description}</ToastDescription>}
          </div>
          <ToastClose className="absolute right-2 top-2 text-gray-500 hover:text-gray-700">
            ×
          </ToastClose>
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
