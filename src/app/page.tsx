// src/app/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CustomFileInput } from "@/components/CustomFileInput";
import { InfoTip } from "@/components/InfoTip";
import { useGenerativeTheme } from "@/lib/useGenerativeTheme";
import { useToast } from "@/components/ui/use-toast";

const ICO_SIZES = [16, 32, 48, 64, 128, 256] as const;
const APPLE_SIZES = [120, 152, 167, 180] as const;
const ANDROID_SIZES = [192, 196, 512] as const;
const WINDOWS_SIZES = [70, 144, 150, 310] as const;

const MAX_FILE_SIZE_MB = 48;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function HomePage() {
  const [simpleFile, setSimpleFile] = useState<File | null>(null);
  const [advancedFiles, setAdvancedFiles] = useState<Record<number, File | null>>({});
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [includeApple, setIncludeApple] = useState(false);
  const [includeAndroid, setIncludeAndroid] = useState(false);
  const [includeWindows, setIncludeWindows] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [showStripeDialog, setShowStripeDialog] = useState(false);

  const [appName, setAppName] = useState("favfav");
  const [shortName, setShortName] = useState("favfav");
  const [themeColor, setThemeColor] = useState("#6366f1");

  const { backgroundGradient, isClient } = useGenerativeTheme();
  const { toast } = useToast();
  const params = useSearchParams();

  // === Toast feedback after checkout ===
  useEffect(() => {
    const status = params.get("checkout");
    if (status === "success") {
      toast({
        title: "Thank you for your support ❤️",
        description: "Your contribution helps me and my family!",
        duration: 5000,
      });
    } else if (status === "cancel") {
      toast({
        title: "Payment canceled",
        description: "You can try again anytime.",
        duration: 4000,
      });
    }
  }, [params, toast]);

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
        `Total upload size (${(totalSize / 1024 / 1024).toFixed(
          1
        )} MB) exceeds the ${MAX_FILE_SIZE_MB} MB limit.`
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
          throw new Error(`File too large (max ${MAX_FILE_SIZE_MB} MB).`);
        }
        throw new Error("Generation failed (server error).");
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

  const displaySizesSet = new Set<number>(ICO_SIZES);
  if (isAdvanced) {
    if (includeApple) APPLE_SIZES.forEach((s) => displaySizesSet.add(s));
    if (includeAndroid) ANDROID_SIZES.forEach((s) => displaySizesSet.add(s));
    if (includeWindows) WINDOWS_SIZES.forEach((s) => displaySizesSet.add(s));
  }
  const displaySizes = Array.from(displaySizesSet).sort((a, b) => a - b);

  return (
    <div
      style={
        isClient && backgroundGradient
          ? { backgroundImage: backgroundGradient }
          : {}
      }
      className={`min-h-screen flex items-center justify-center p-4 ${
        !isClient || !backgroundGradient
          ? "bg-gradient-to-br from-blue-50 to-indigo-100"
          : ""
      }`}
    >
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-3xl w-full space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            .favfav
          </h1>
          <p className="text-lg text-indigo-600 font-medium mt-1">
            your favorite .ico generator
          </p>
          <p className="text-gray-600 mt-3 text-sm leading-relaxed max-w-xl mx-auto">
            {isAdvanced ? (
              "Pro Mode: Upload pixel-perfect images per size — no scaling where you don’t want it. Full control."
            ) : (
              <>
                Simple: Upload a single image — we automatically generate all
                standard favicon sizes (16×16 to 512×512)
                as PNG and one multi-size <code>.ico</code> in a ZIP.
              </>
            )}
          </p>
        </div>

        {/* Pro Mode Switch */}
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

        {/* Platforms */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="apple"
              checked={includeApple}
              onCheckedChange={(checked) => setIncludeApple(checked === true)}
            />
            <Label
              htmlFor="apple"
              className="cursor-pointer text-sm font-normal text-gray-700"
            >
              Apple Touch Icons
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="android"
              checked={includeAndroid}
              onCheckedChange={(checked) => setIncludeAndroid(checked === true)}
            />
            <Label
              htmlFor="android"
              className="cursor-pointer text-sm font-normal text-gray-700"
            >
              Android / PWA
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="windows"
              checked={includeWindows}
              onCheckedChange={(checked) => setIncludeWindows(checked === true)}
            />
            <Label
              htmlFor="windows"
              className="cursor-pointer text-sm font-normal text-gray-700"
            >
              Windows Tiles
            </Label>
          </div>
        </div>

        {(includeAndroid || includeWindows) && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="app-name">App Name</Label>
                <Input
                  id="app-name"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="short-name">Short Name</Label>
                <Input
                  id="short-name"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="theme-color">Theme Color</Label>
              <div className="flex items-center gap-2 max-w-xs">
                <Input
                  id="theme-color"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
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

        {/* Simple Mode */}
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
                      Upload a <strong>256×256</strong> image — perfect for{" "}
                      <code>favicon.ico</code>. We'll downscale for smaller
                      sizes.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium">Recommendation for PWAs:</p>
                    <p>
                      Upload a <strong>512×512</strong> image for best quality.
                      The <code>.ico</code> uses up to{" "}
                      <strong>256×256</strong>, while <strong>512×512</strong>{" "}
                      is for PWA only.
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

        {/* Pro Mode */}
        {isAdvanced && (
          <Card>
            <CardHeader>
              <CardTitle>Upload per size</CardTitle>
              <p className="text-sm text-gray-600 pt-1">
                Accepts PNG, JPG, GIF, WebP. Max {MAX_FILE_SIZE_MB} MB total.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
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

        {loading && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-center text-gray-600">
              {isAdvanced
                ? "Processing multiple images..."
                : "Processing image..."}
            </p>
          </div>
        )}

        {downloadUrl && (
          <>
            <a
              href={downloadUrl}
              download="favfavicon.zip"
              onClick={() => setShowStripeDialog(true)}
              className="block text-center bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium"
            >
              Download ZIP
            </a>

            <Dialog open={showStripeDialog} onOpenChange={setShowStripeDialog}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Liked it? Support me and my family</DialogTitle>
                  <DialogDescription>
                    Thanks for using .favfav! If you'd like to support my family, continue below.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                  {/* Stripe button */}
                  <Button
                    className="w-full h-11 bg-[#635bff] hover:bg-[#5851db] text-white font-semibold rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/checkout", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ mode: "support", amount: 500 }),
                        });
                        if (!res.ok) throw new Error("Checkout creation failed");
                        const data = await res.json();
                        if (data.url) {
                          window.location.href = data.url;
                        } else {
                          throw new Error("No checkout URL returned");
                        }
                      } catch (e) {
                        alert(
                          e instanceof Error ? e.message : "Stripe checkout failed"
                        );
                      }
                    }}
                  >
                    Pay securely with Stripe
                  </Button>
                </div>

                <DialogFooter className="sm:justify-center">
                  <Button
                    variant="ghost"
                    onClick={() => setShowStripeDialog(false)}
                  >
                    Not now
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}

        <p className="text-xs text-center text-gray-500">
          MIT License © 2025 phunck
        </p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
      <HomePage />
    </Suspense>
  );
}
