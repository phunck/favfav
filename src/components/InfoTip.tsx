// src/components/InfoTip.tsx
import { Lightbulb } from "lucide-react";

interface InfoTipProps {
  children: React.ReactNode;
}

export function InfoTip({ children }: InfoTipProps) {
  return (
    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
      <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}