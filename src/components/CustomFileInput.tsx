// src/components/CustomFileInput.tsx
import { Upload } from "lucide-react";
import { Label } from "@/components/ui/label";

interface CustomFileInputProps {
  id: string;
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  className?: string;
  maxSizeInBytes?: number; // NEU: Prop für die Größenprüfung
}

// NEU: Definiert, welche Typen der Dialog anzeigt
const ACCEPTED_FILE_TYPES = "image/png, image/jpeg, image/gif, image/webp";

export function CustomFileInput({
  id,
  label,
  file,
  onChange,
  className = "",
  maxSizeInBytes, // NEU
}: CustomFileInputProps) {
  // NEU: Handler, der die Größe prüft, BEVOR er 'onChange' aufruft
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;

    if (selectedFile && maxSizeInBytes) {
      if (selectedFile.size > maxSizeInBytes) {
        const maxSizeMB = (maxSizeInBytes / 1024 / 1024).toFixed(1);
        alert(
          `File is too large (${(selectedFile.size / 1024 / 1024).toFixed(
            1
          )} MB). \nMax file size is ${maxSizeMB} MB.`
        );
        e.target.value = ""; // Wichtig: Setzt das Input-Feld zurück
        onChange(null); // Meldet "keine Datei" an das Parent-Element
        return;
      }
    }
    onChange(selectedFile); // Datei ist gültig
  };

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
            accept={ACCEPTED_FILE_TYPES} // MODIFIZIERT: Spezifische Typen
            className="hidden"
            onChange={handleFileChange} // MODIFIZIERT: Nutzt den neuen Handler
          />
        </label>
      </div>
    </div>
  );
}