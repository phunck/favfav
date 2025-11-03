// src/lib/favicon-generator.client.ts
"use client";

import JSZip from "jszip";
// import pngToIco from "png-to-ico"; // <-- ENTFERNEN!

// === (Konstanten bleiben gleich) ===
const ALL_SIZES = [16, 32, 48, 64, 128, 144, 192, 256, 512] as const;
const APPLE_SIZES = [120, 152, 167, 180] as const;
const ANDROID_SIZES = [192, 196, 512] as const;
const WINDOWS_SIZES = [70, 144, 150, 310] as const;
const appleDir = "apple/";
const androidDir = "android/";
const windowsDir = "windows/";

// === (resizeImageClient Canvas-Funktion bleibt exakt gleich) ===
async function resizeImageClient(
  file: File,
  targetSize: number
): Promise<ArrayBuffer> {
  // ... (deine komplette Canvas-Logik von vorhin)
  const image = new Image();
  const url = URL.createObjectURL(file);
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    image.src = url;
  });
  URL.revokeObjectURL(url);
  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");
  const scale = Math.min(targetSize / image.width, targetSize / image.height);
  const x = (targetSize - image.width * scale) / 2;
  const y = (targetSize - image.height * scale) / 2;
  ctx.clearRect(0, 0, targetSize, targetSize);
  ctx.drawImage(image, x, y, image.width * scale, image.height * scale);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );
  if (!blob) throw new Error("Canvas toBlob failed");
  return blob.arrayBuffer();
}

/**
 * NEUER RÜCKGABEWERT:
 * Gibt ein JSZip-Objekt (ohne ICO) und die Buffer für das ICO zurück.
 */
export async function generateFaviconZipClient(
  mode: "advanced",
  advancedImages: Record<number, File | null>,
  includeApple: boolean = false,
  includeAndroid: boolean = false,
  includeWindows: boolean = false,
  appName: string = "favfav",
  shortName: string = "favfav",
  themeColor: string = "#6366f1"
): Promise<{ zip: JSZip; icoBuffers: ArrayBuffer[] }> { // <-- Geändert
  
  const zip = new JSZip();
  const icoBuffers: ArrayBuffer[] = [];

  // ... (Die Logik zum Finden von 'uploaded' und 'largest' bleibt gleich) ...
  const uploaded = Object.entries(advancedImages)
    .map(([sizeStr, file]) => ({
      size: parseInt(sizeStr, 10),
      file,
    }))
    .filter((x): x is { size: number; file: File } => x.file !== null);

  if (uploaded.length === 0) {
    throw new Error("No images provided in Pro Mode.");
  }
  const largest = uploaded.reduce(
    (max, cur) => (cur.size > max.size ? cur : max),
    uploaded[0]
  );
  const targetSizesSet = new Set<number>(ALL_SIZES);
  if (includeApple) APPLE_SIZES.forEach((s) => targetSizesSet.add(s));
  if (includeAndroid) ANDROID_SIZES.forEach((s) => targetSizesSet.add(s));
  if (includeWindows) WINDOWS_SIZES.forEach((s) => targetSizesSet.add(s));
  const targetSizes = Array.from(targetSizesSet).sort((a, b) => a - b);

  for (const targetSize of targetSizes) {
    const uploadedForSize = uploaded.find((x) => x.size === targetSize);
    let sourceFile: File;
    if (uploadedForSize) {
      sourceFile = uploadedForSize.file;
    } else {
      sourceFile = largest.file;
    }

    const pngArrayBuffer = await resizeImageClient(sourceFile, targetSize);
    
    let filename = "";
    // ... (Dateinamen-Logik bleibt gleich) ...
    if (includeApple && APPLE_SIZES.includes(targetSize as any))
      filename = `${appleDir}apple-touch-icon-${targetSize}x${targetSize}.png`;
    else if (includeAndroid && ANDROID_SIZES.includes(targetSize as any))
      filename = `${androidDir}android-chrome-${targetSize}x${targetSize}.png`;
    else if (includeWindows && WINDOWS_SIZES.includes(targetSize as any))
      filename = `${windowsDir}mstile-${targetSize}x${targetSize}.png`;
    else if (ALL_SIZES.includes(targetSize as any))
      filename = `favicon-${targetSize}x${targetSize}.png`;
    else continue;

    zip.file(filename, pngArrayBuffer);

    if (ALL_SIZES.includes(targetSize as any) && targetSize <= 256) {
      // Nur sammeln, nicht konvertieren
      icoBuffers.push(pngArrayBuffer);
    }
  }

  // ==================== ICO-Generierung (ENTFERNT) ====================
  // (Der pngToIco-Aufruf wird von hier entfernt)

  // ==================== CONFIG FILES (bleibt gleich) ====================
  if (includeAndroid) {
    // ... (manifest-Logik bleibt gleich)
    const manifest = { name: appName, short_name: shortName, icons: ANDROID_SIZES.map((size) => ({ src: `${androidDir}android-chrome-${size}x${size}.png`, sizes: `${size}x${size}`, type: "image/png", })), theme_color: themeColor, background_color: "#ffffff", display: "standalone" };
    zip.file(`${androidDir}manifest.json`, JSON.stringify(manifest, null, 2));
  }
  if (includeWindows) {
    // ... (browserconfig-Logik bleibt gleich)
    const browserconfig = `<?xml version="1.0" encoding="utf-8"?><browserconfig><msapplication><tile><square70x70logo src="${windowsDir}mstile-70x70.png"/><square150x150logo src="${windowsDir}mstile-150x150.png"/><square310x310logo src="${windowsDir}mstile-310x310.png"/><TileColor>${themeColor}</TileColor></tile></msapplication></browserconfig>`;
    zip.file(`${windowsDir}browserconfig.xml`, browserconfig);
  }

  // ==================== RETURN (Geändert) ====================
  return { zip, icoBuffers };
}