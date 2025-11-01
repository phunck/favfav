// src/app/page.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input"; 
import { CustomFileInput } from "@/components/CustomFileInput";
import { InfoTip } from "@/components/InfoTip";

const ICO_SIZES = [16, 32, 48, 64, 128, 144, 192, 256, 512] as const;
const APPLE_SIZES = [120, 152, 167, 180] as const;
const ANDROID_SIZES = [192, 196, 512] as const;
const WINDOWS_SIZES = [70, 144, 150, 310] as const;

export default function Home() {
  const [simpleFile, setSimpleFile] = useState<File | null>(null);
  const [advancedFiles, setAdvancedFiles] = useState<Record<number, File | null>>({});
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [includeApple, setIncludeApple] = useState(false);
  const [includeAndroid, setIncludeAndroid] = useState(false);
  const [includeWindows, setIncludeWindows] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const [appName, setAppName] = useState("favfav");
  const [shortName, setShortName] = useState("favfav");
  const [themeColor, setThemeColor] = useState("#6366f1");

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
    formData.append("includeAndroid", includeAndroid.toString());
    formData.append("includeWindows", includeWindows.toString());

    formData.append("appName", appName);
    formData.append("shortName", shortName);
    formData.append("themeColor", themeColor);

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

  const displaySizesSet = new Set<number>(ICO_SIZES);
  if (isAdvanced) {
    if (includeApple) APPLE_SIZES.forEach(s => displaySizesSet.add(s));
    if (includeAndroid) ANDROID_SIZES.forEach(s => displaySizesSet.add(s));
    if (includeWindows) WINDOWS_SIZES.forEach(s => displaySizesSet.add(s));
  }
  const displaySizes = Array.from(displaySizesSet).sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* MODIFIZIERT: Container breiter gemacht (max-w-3xl) */}
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-3xl w-full space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            .favfav
          </h1>
          <p className="text-lg text-indigo-600 font-medium mt-1">
            your favorite .ico generator
          </p>
          <p className="text-gray-600 mt-3 text-sm leading-relaxed max-w-xl mx-auto">
            {isAdvanced
              ? "Pro Mode: Finally! Upload pixel-perfect images for each size — no scaling, no quality loss. Generate the perfect .ico with full control."
              : (
                  <>
                    Simple: Upload one image — we automatically generate all standard favicon sizes (16×16 to 512×512) as PNG + one .ico file in a ZIP. <br />
                    <span className="text-indigo-600 font-medium">
                      Want pixel-perfect control? → Switch to <strong>Pro Mode</strong>
                    </span>
                  </>
                )}
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

        {/* ==================== PLATFORM CHECKBOXES (MODIFIZIERT) ==================== */}
        {/* MODIFIZIERT: Grid-Layout entfernt. Checkboxen und Inputs sind jetzt untereinander. */}
        
        {/* Block 1: Checkboxen */}
        <div className="space-y-3">
          {/* Apple */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="apple"
              checked={includeApple}
              onCheckedChange={(checked) => setIncludeApple(checked === true)}
            />
            <Label htmlFor="apple" className="cursor-pointer text-sm font-normal text-gray-700 flex items-center gap-1">
              Apple Touch Icons{" "}
              <span className="text-indigo-600 font-medium text-xs">(for the special child)</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="w-4 h-4 rounded-full bg-gray-300 text-gray-600 text-xs font-bold flex items-center justify-center hover:bg-gray-400">
                      ?
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-medium">iPhone & iPad Homescreen</p>
                    <p className="text-sm mt-1">
                      Generates <code>120×120</code>, <code>152×152</code>, <code>167×167</code>, and <code>180×180</code> icons.
                      Used when users add your site to their home screen on iOS.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
          </div>

          {/* Android / PWA */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="android"
              checked={includeAndroid}
              onCheckedChange={(checked) => setIncludeAndroid(checked === true)}
            />
            <Label htmlFor="android" className="cursor-pointer text-sm font-normal text-gray-700 flex items-center gap-1">
              Android / PWA
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="w-4 h-4 rounded-full bg-gray-300 text-gray-600 text-xs font-bold flex items-center justify-center hover:bg-gray-400">
                      ?
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-medium">Android & Progressive Web Apps</p>
                    <p className="text-sm mt-1">
                      Generates <code>192×192</code> (standard), <code>196×196</code> (legacy support), and <code>512×512</code> (high-res).
                      Required for Chrome, Android homescreen, and <code>manifest.json</code> in PWAs.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
          </div>

          {/* Windows Tiles */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="windows"
              checked={includeWindows}
              onCheckedChange={(checked) => setIncludeWindows(checked === true)}
            />
            <Label htmlFor="windows" className="cursor-pointer text-sm font-normal text-gray-700 flex items-center gap-1">
              Windows Tiles
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="w-4 h-4 rounded-full bg-gray-300 text-gray-600 text-xs font-bold flex items-center justify-center hover:bg-gray-400">
                      ?
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-medium">Windows Start Menu & Taskbar</p>
                    <p className="text-sm mt-1">
                      Generates <code>70×70</code>, <code>144×144</code>, <code>150×150</code>, and <code>310×310</code> tiles.
                      Used in Windows 8/10/11 for pinned sites. Includes <code>browserconfig.xml</code>.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
          </div>
        </div>

        {/* MODIFIZIERT: PWA / Manifest Optionen (Konditional) - als eigener Block darunter */}
        {(includeAndroid || includeWindows) && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            {/* NEU: Grid für Inputs, damit sie nebeneinander liegen (auf md und größer) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* App Name */}
              <div className="space-y-1.5">
                <Label htmlFor="app-name" className="flex items-center gap-1">
                  App Name
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="w-4 h-4 rounded-full bg-gray-300 text-gray-600 text-xs font-bold flex items-center justify-center hover:bg-gray-400">
                          ?
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Full name of your PWA (e.g., "My Awesome App").</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="app-name"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="My Awesome App"
                />
              </div>

              {/* Short Name */}
              <div className="space-y-1.5">
                <Label htmlFor="short-name" className="flex items-center gap-1">
                  Short Name
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="w-4 h-4 rounded-full bg-gray-300 text-gray-600 text-xs font-bold flex items-center justify-center hover:bg-gray-400">
                          ?
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Short name for the homescreen (e.g., "Awesome").</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="short-name"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  placeholder="Awesome"
                />
              </div>
            </div>

            {/* Theme Color (bleibt volle Breite) */}
            <div className="space-y-1.5">
              <Label htmlFor="theme-color" className="flex items-center gap-1">
                Theme Color
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button type="button" className="w-4 h-4 rounded-full bg-gray-300 text-gray-600 text-xs font-bold flex items-center justify-center hover:bg-gray-400">
                        ?
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Browser UI color (e.g., <code>#ff0000</code>).</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="flex items-center gap-2 max-w-xs">
                <Input
                  id="theme-color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                  placeholder="#6366f1"
                  className="flex-1"
                />
                <Input
                  type="color"
                  className="w-10 p-0 border-none"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
        {/* ENDE MODIFIKATION */}


        {/* ==================== SIMPLE MODE ==================== */}
        {!isAdvanced && (
          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="text-base font-medium">Upload image (will be scaled)</Label>
              <InfoTip>
                <p className="font-medium">Pro tip:</p>
                <p>
                  For the best quality, upload a <strong>512×512</strong> image. 
                  We downscale perfectly. <em>But don’t worry — any image works!</em>
                </p>
              </InfoTip>
            </div>

            <div className="flex gap-3 items-center">
              <CustomFileInput
                id="simple-image"
                label=""
                file={simpleFile}
                onChange={handleSimpleChange}
                className="flex-1"
              />
              <Button
                onClick={handleGenerate}
                disabled={!simpleFile || loading}
                size="lg"
                className="h-12 w-48"
              >
                {loading ? "Generating..." : "Generate Favicons"}
              </Button>
            </div>

            {loading && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-center text-gray-600">Processing image...</p>
              </div>
            )}

            {downloadUrl && (
              <a
                href={downloadUrl}
                download="favicons.zip"
                className="block text-center bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium"
              >
                Download ZIP
              </a>
            )}
          </div>
        )}

        {/* ==================== PRO MODE ==================== */}
        {isAdvanced && (
          <Card>
            <CardHeader>
              <CardTitle>Upload per size</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <InfoTip>
                <p className="font-medium">Pixel-perfect control:</p>
                <p>
                  Your uploaded images are used <strong>1:1</strong> — no resizing. 
                  Missing sizes are derived from the <strong>largest image</strong>.
                </p>
              </InfoTip>

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

              <Button
                onClick={handleGenerate}
                disabled={!hasFiles || loading}
                className="h-12 w-full"
                size="lg"
              >
                {loading ? "Generating..." : "Generate Favicons"}
              </Button>

              {loading && (
                <div className="space-y-2">
                  <Progress value={progress} />
                  <p className="text-sm text-center text-gray-600">Processing multiple images...</p>
                </div>
              )}

              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download="favicons.zip"
                  className="block text-center bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Download ZIP
                </a>
              )}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-center text-gray-500">
          MIT License © 2025 phunck
        </p>
      </div>
    </div>
  );
}