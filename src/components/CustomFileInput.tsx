// src/components/CustomFileInput.tsx
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { useRef } from "react";

interface CustomFileInputProps {
  id: string;
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
}

export function CustomFileInput({ id, label, file, onChange }: CustomFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    onChange(selected);
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="w-16 text-sm font-medium text-right">{label}</div>

      <div className="flex-1">
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />

        {!file ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleClick}
            className="w-full justify-start text-left font-normal"
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose file
          </Button>
        ) : (
          <div className="flex items-center justify-between bg-gray-50 border rounded-md px-3 py-2">
            <span className="text-sm truncate max-w-[180px]">{file.name}</span>
            <button
              onClick={handleRemove}
              className="text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}