"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { CustomFileInput } from "@/components/CustomFileInput";
import { InfoTip } from "@/components/InfoTip";

const ICO_SIZES = [16, 32, 48, 64, 128, 256, 512] as const;
const APPLE_SIZES = [120, 152, 167, 180] as const;

export default function Home() {
  const [simpleFile, setSimpleFile] = useState<File | null>(null);
  const [advancedFiles, setAdvancedFiles] = useState<Record<number, File | null>>({});
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [includeApple, setIncludeApple] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleSimpleChange = (file: File | null) => {
    setSimpleFile(file);
    setDownloadUrl(null);
  };

  const handleAdvancedChange = (size: number, file: File | null) => {
    setAdvancedFiles((prev) => ({ ...prev, [size]: file }));
    setDownloadUrl(null);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setProgress(0);

    const formData = new FormData();

    if (isAdvanced) {
      Object.entries(advancedFiles).forEach(([sizeStr, file]) => {
        const size = parseInt(sizeStr, 10);
        if (file) {
          formData.append(`size-${size}`, file);
        }
      });
      formData.append("mode", "advanced");
    } else {
      if (simpleFile) {
        formData.append("image", simpleFile);
        formData.append("mode", "simple");
      }
    }

    formData.append("includeApple", includeApple.toString());

    try {
      const res = await fetch("/api/generate-favicon", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Generation failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setProgress(100);
    } catch (err) {
      alert("Something went wrong while generating favicons.");
    } finally {
      setLoading(false);
    }
  };

  const hasFiles = isAdvanced
    ? Object.values(advancedFiles).some((f) => f)
    : simpleFile;

  const displaySizes = [
    ...ICO_SIZES,
    ...(isAdvanced && includeApple ? APPLE_SIZES : [])
  ].sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            favfav
          </h1>
          <p className="text-lg text-indigo-600 font-medium mt-1">
            your favorite .ico generator
          </p>
          <p className="text-gray-600 mt-3 text-sm leading-relaxed max-w-xl mx-auto">
            {isAdvanced
              ? "Pro Mode: Finally! Upload pixel-perfect images for each size — no scaling, no quality loss. Generate the perfect .ico with full control."
              : "Simple: Upload one image — we automatically generate all standard favicon sizes (16×16 to 512×512) as PNG + one .ico file in a ZIP."}
          </p>
        </div>

        {/* Toggle: Pro Mode */}
        <div className="flex items-center justify-center space-x-3">
          <Switch
            id="advanced-mode"
            checked={isAdvanced}
            onCheckedChange={setIsAdvanced}
          />
          <Label htmlFor="advanced-mode" className="cursor-pointer font-medium">
            Pro Mode
          </Label>
        </div>

        {/* Simple Mode */}
        {!isAdvanced && (
          <div className="space-y-5">
            <Label className="text-base font-medium">Upload image (will be scaled)</Label>

            {/* Pro Tip – MD3 InfoTip */}
            <InfoTip>
              <p className="font-medium">Pro tip:</p>
              <p>
                Upload a <strong>512×512</strong> image for best results. 
                We downscale perfectly — <em>never upscale</em>.
              </p>
            </InfoTip>

            {/* Apple Checkbox */}
            <div className="flex items-center space-x-2 -ml-1">
              <Checkbox
                id="include-apple"
                checked={includeApple}
                onCheckedChange={(checked) => setIncludeApple(checked as boolean)}
              />
              <Label htmlFor="include-apple" className="cursor-pointer text-sm font-normal text-gray-700">
                Include Apple Touch Icons{" "}
                <span className="text-indigo-600 font-medium text-xs">
                  (for the special child)
                </span>
              </Label>
            </div>

            <CustomFileInput
              id="simple-image"
              label=""
              file={simpleFile}
              onChange={handleSimpleChange}
            />
          </div>
        )}

        {/* Pro Mode */}
        {isAdvanced && (
          <Card>
            <CardHeader>
              <CardTitle>Upload per size</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Apple Checkbox */}
              <div className="flex items-center space-x-2 -ml-1">
                <Checkbox
                  id="include-apple"
                  checked={includeApple}
                  onCheckedChange={(checked) => setIncludeApple(checked as boolean)}
                />
                <Label htmlFor="include-apple" className="cursor-pointer text-sm font-normal text-gray-700">
                  Include Apple Touch Icons{" "}
                  <span className="text-indigo-600 font-medium text-xs">
                    (for the special child)
                  </span>
                </Label>
              </div>

              {/* Dynamische Größenliste */}
              <ScrollArea className="h-96 pr-4">
                <div className="space-y-4">
                  {displaySizes.map((size) => (
                    <CustomFileInput
                      key={size}
                      id={`advanced-${size}`}
                      label={`${size}×${size}`}
                      file={advancedFiles[size] || null}
                      onChange={(file) => handleAdvancedChange(size, file)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={!hasFiles || loading}
          className="w-full"
          size="lg"
        >
          {loading ? "Generating..." : "Generate Favicons"}
        </Button>

        {/* Progress */}
        {loading && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-center text-gray-600">
              Processing {isAdvanced ? "multiple images" : "one image"}...
            </p>
          </div>
        )}

        {/* Download */}
        {downloadUrl && (
          <a
            href={downloadUrl}
            download="favicons.zip"
            className="block text-center bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium"
          >
            Download ZIP
          </a>
        )}

        <p className="text-xs text-center text-gray-500">
          MIT License © 2025 phunck
        </p>
      </div>
    </div>
  );
}