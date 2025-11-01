// src/components/CustomFileInput.tsx
import { Upload } from "lucide-react";
import { Label } from "@/components/ui/label";

interface CustomFileInputProps {
  id: string;
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  className?: string;
}

export function CustomFileInput({
  id,
  label,
  file,
  onChange,
  className = "",
}: CustomFileInputProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor={id}
          className="flex flex-col items-center justify-center w-full h-12 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition"
        >
          <div className="flex items-center justify-center pt-1">
            <Upload className="w-5 h-5 text-gray-500 mr-2" />
            <p className="text-sm text-gray-600 truncate max-w-[180px]">
              {file ? file.name : "Choose file"}
            </p>
          </div>
          <input
            id={id}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onChange(e.target.files?.[0] || null)}
          />
        </label>
      </div>
    </div>
  );
}