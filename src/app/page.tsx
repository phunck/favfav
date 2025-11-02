// /src/app/page.tsx
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

import { useGenerativeTheme } from "@/lib/useGenerativeTheme";

// ICO base sizes (ICO never includes 512; 512 is PWA-only)
const ICO_SIZES = [16, 32, 48, 64, 128, 256] as const;
const APPLE_SIZES = [120, 152, 167, 180] as const;
const ANDROID_SIZES = [192, 196, 512] as const; // 512 appears only if Android/PWA is enabled
const WINDOWS_SIZES = [70, 144, 150, 310] as const;

const MAX_FILE_SIZE_MB = 48;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

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

  const { backgroundGradient, isClient } = useGenerativeTheme();

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
    setDownloadUrl(null);

    let totalSize = 0;
    const formData = new FormData();

    if (isAdvanced) {
      Object.entries(advancedFiles).forEach(([sizeStr, file]) => {
        const size = parseInt(sizeStr, 10);
        if (file) {
          totalSize += file.size;
          formData.append(`size-${size}`, file);
        }
      });
      formData.append("mode", "advanced");
    } else {
      if (simpleFile) {
        totalSize = simpleFile.size;
        formData.append("image", simpleFile);
        formData.append("mode", "simple");
      } else {
        setLoading(false);
        return; 
      }
    }

    if (totalSize > MAX_FILE_SIZE_BYTES) {
      alert(
        `Total upload size (${(totalSize / 1024 / 1024).toFixed(1)} MB) exceeds the ${MAX_FILE_SIZE_MB} MB limit.\n\nPlease reduce the number or size of files in Pro Mode.`
      );
      setLoading(false);
      setProgress(0);
      return;
    }
    
    formData.append("includeApple", includeApple.toString());
    formData.append("includeAndroid", includeAndroid.toString());
    formData.append("includeWindows", includeWindows.toString());
    formData.append("appName", appName);
    formData.append("shortName", shortName);
    formData.append("themeColor", themeColor);
    
    try {
      let progressInterval: NodeJS.Timeout | null = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            if (progressInterval) clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const res = await fetch("/api/generate-favicon", {
        method: "POST",
        body: formData,
      });

      if (progressInterval) clearInterval(progressInterval);

      if (!res.ok) {
        if (res.status === 413) {
          throw new Error(`File is too large (Server Error). Max size is ${MAX_FILE_SIZE_MB} MB.`);
        }
        throw new Error("Generation failed (Server Error)"); 
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      
      setDownloadUrl(url);
      setProgress(100);

    } catch (err) {
      console.error("Fetch generation error:", err);
      alert(err instanceof Error ? err.message : "Something went wrong.");
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const hasFiles = isAdvanced
    ? Object.values(advancedFiles).some((f) => f)
    : simpleFile;

  // Display: ICO base sizes (no 512). 512 gets added only via Android/PWA.
  const displaySizesSet = new Set<number>(ICO_SIZES);
  if (isAdvanced) {
    if (includeApple) APPLE_SIZES.forEach(s => displaySizesSet.add(s));
    if (includeAndroid) ANDROID_SIZES.forEach(s => displaySizesSet.add(s)); // adds 512 if enabled
    if (includeWindows) WINDOWS_SIZES.forEach(s => displaySizesSet.add(s));
  }
  const displaySizes = Array.from(displaySizesSet).sort((a, b) => a - b);

  return (
    <div 
      style={isClient && backgroundGradient ? { backgroundImage: backgroundGradient } : {}}
      className={`min-h-screen flex items-center justify-center p-4 ${
        (!isClient || !backgroundGradient) ? 'bg-gradient-to-br from-blue-50 to-indigo-100' : ''
      }`}
    >
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-3xl w-full space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">.favfav</h1>
          <p className="text-lg text-indigo-600 font-medium mt-1">your favorite .ico generator</p>
          <p className="text-gray-600 mt-3 text-sm leading-relaxed max-w-xl mx-auto">
            {isAdvanced
              ? "Pro Mode: Upload pixel-perfect images per size — no scaling where you don’t want it. Full control."
              : (
                  <>
                    Simple: Upload a single image — we automatically generate all standard favicon sizes (16×16 to 512×512) as PNG and one multi-size <code>.ico</code> in a ZIP. <br />
                    <span className="text-indigo-600 font-medium">
                      Need per-size control? → Switch to <strong>Pro Mode</strong>
                    </span>
                  </>
                )}
          </p>
        </div>

        {/* Pro Mode Toggle */}
        <div className="flex items-center justify-center space-x-3">
          <Switch
            id="advanced-mode"
            checked={isAdvanced}
            onCheckedChange={setIsAdvanced}
          />
          <Label htmlFor="advanced-mode" className="cursor-pointer font-medium">Pro Mode</Label>
        </div>
        
        {/* Checkboxes */}
        <div className="space-y-3">
          {/* Apple */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="apple"
              checked={includeApple}
              onCheckedChange={(checked) => setIncludeApple(checked === true)}
            />
            <Label htmlFor="apple" className="cursor-pointer text-sm font-normal text-gray-700 flex items-center gap-1">
              Apple Touch Icons
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="w-4 h-4 rounded-full bg-gray-300 text-gray-600 text-xs font-bold flex items-center justify-center hover:bg-gray-400">
                      ?
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-medium">iPhone & iPad Home Screen</p>
                    <p className="text-sm mt-1">
                      Generates <code>120×120</code>, <code>152×152</code>, <code>167×167</code>, and <code>180×180</code> icons.
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
                      Generates <code>192×192</code>, <code>196×196</code>, and <code>512×512</code> PNGs + <code>manifest.json</code>.{" "}
                      <strong>512×512 is PWA-only and not embedded into the <code>.ico</code>.</strong>
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
                      Generates <code>70×70</code>, <code>144×144</code>, <code>150×150</code>, and <code>310×310</code> tiles (+ <code>browserconfig.xml</code>).
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
          </div>
        </div>
        
        {/* PWA options */}
        {(includeAndroid || includeWindows) && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
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
                        <p>Full name of your PWA (e.g., “My Awesome App”).</p>
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
                        <p>Short name shown on the home screen (e.g., “Awesome”).</p>
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
            {/* Theme Color */}
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

        {/* ==================== SIMPLE MODE ==================== */}
        {!isAdvanced && (
          <Card>
            <CardHeader>
              <CardTitle>Upload image</CardTitle>
              <p className="text-sm text-gray-600 pt-1">
                Accepts PNG, JPG, GIF, WebP. Max {MAX_FILE_SIZE_MB} MB.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <InfoTip>
                {!includeAndroid ? (
                  <>
                    <p className="font-medium">Recommendation:</p>
                    <p>
                      Upload a <strong>256×256</strong> image — that’s fully sufficient for <code>favicon.ico</code>.{" "}
                      We’ll downscale perfectly for smaller sizes.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium">Recommendation for PWAs:</p>
                    <p>
                      For best quality, upload a <strong>512×512</strong> image.{" "}
                      <code>favicon.ico</code> uses sizes up to <strong>256×256</strong>,{" "}
                      while <strong>512×512</strong> is <em>PWA only</em> (in <code>manifest.json</code>) and is not embedded into the <code>.ico</code>.
                    </p>
                  </>
                )}
              </InfoTip>
              <CustomFileInput
                id="simple-image"
                label=""
                file={simpleFile}
                onChange={handleSimpleChange}
                maxSizeInBytes={MAX_FILE_SIZE_BYTES}
              />
              <Button
                onClick={handleGenerate}
                disabled={!simpleFile || loading}
                size="lg"
                className="h-12 w-full"
              >
                {loading ? "Generating..." : "Generate Favicons"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ==================== PRO MODE ==================== */}
        {isAdvanced && (
          <Card>
            <CardHeader>
              <CardTitle>Upload per size</CardTitle>
              <p className="text-sm text-gray-600 pt-1">
                Accepts PNG, JPG, GIF, WebP. Max {MAX_FILE_SIZE_MB} MB total.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <InfoTip>
                <p className="font-medium">Pixel-perfect control:</p>
                <p>
                  Your uploaded images are used <strong>1:1</strong> where provided; missing sizes are derived from the{" "}
                  <strong>largest image</strong>.{" "}
                  {includeAndroid ? (
                    <>For PWAs, also provide <strong>512×512</strong> (PWA only, not embedded into <code>.ico</code>).</>
                  ) : (
                    <>For the <code>favicon.ico</code> alone, sizes up to <strong>256×256</strong> are sufficient.</>
                  )}
                </p>
              </InfoTip>

              <ScrollArea className="h-96 pr-4">
                <div className="space-y-4">
                  {displaySizes.map((size) => (
                    <CustomFileInput
                      key={size}
                      id={`advanced-${size}`}
                      label={`${size}×${size}${size === 512 ? " (PWA only)" : ""}`}
                      file={advancedFiles[size] || null}
                      onChange={(file) => handleAdvancedChange(size, file)}
                      maxSizeInBytes={MAX_FILE_SIZE_BYTES}
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
            </CardContent>
          </Card>
        )}
        
        {/* ==================== RESULTS ==================== */}
        {loading && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-center text-gray-600">
              {isAdvanced ? "Processing multiple images..." : "Processing image..."}
            </p>
          </div>
        )}
        {downloadUrl && (
          <a
            href={downloadUrl}
            download="favfavicon.zip" 
            className="block text-center bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium"
          >
            Download ZIP
          </a>
        )}

        {/* Footer */}
        <p className="text-xs text-center text-gray-500">
          MIT License © 2025 phunck
        </p>
      </div>
    </div>
  );
}
