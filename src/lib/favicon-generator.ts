// src/lib/favicon-generator.ts
import sharp from "sharp";
import pngToIco from "png-to-ico";
import JSZip from "jszip";

const ALL_SIZES = [16, 32, 48, 64, 128, 144, 192, 256, 512] as const;
const APPLE_SIZES = [120, 152, 167, 180] as const;
const ANDROID_SIZES = [192, 196, 512] as const;
const WINDOWS_SIZES = [70, 144, 150, 310] as const;

const appleDir = "apple/";
const androidDir = "android/";
const windowsDir = "windows/";

const resizeIfNeeded = async (buffer: Buffer, targetSize: number, sourceSize?: number): Promise<Buffer> => {
  if (sourceSize === targetSize) return buffer;
  return await sharp(buffer, { animated: false })
    .resize(targetSize, targetSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
};

export async function generateFaviconZip(
  mode: "simple" | "advanced",
  simpleImage?: File,
  advancedImages?: Record<number, File>,
  includeApple: boolean = false,
  includeAndroid: boolean = false,
  includeWindows: boolean = false,
  appName: string = "favfav",
  shortName: string = "favfav",
  themeColor: string = "#6366f1"
): Promise<Buffer> {
  const zip = new JSZip();
  const icoBuffers: Buffer[] = [];

  // ==================== PRO MODE ====================
  if (mode === "advanced" && advancedImages) {
    const uploaded = Object.entries(advancedImages)
      .map(([sizeStr, file]) => ({ size: parseInt(sizeStr, 10), file }))
      .filter((x): x is { size: number; file: File } => x.file !== null);

    if (uploaded.length === 0) {
        throw new Error("No images provided in Pro Mode.");
    }
    
    const largest = uploaded.reduce((max, cur) => (cur.size > max.size ? cur : max), uploaded[0]);

    const targetSizesSet = new Set<number>(ALL_SIZES);
    if (includeApple) APPLE_SIZES.forEach(s => targetSizesSet.add(s));
    if (includeAndroid) ANDROID_SIZES.forEach(s => targetSizesSet.add(s));
    if (includeWindows) WINDOWS_SIZES.forEach(s => targetSizesSet.add(s));
    const targetSizes = Array.from(targetSizesSet);

    for (const targetSize of targetSizes) {
      const uploadedForSize = uploaded.find(x => x.size === targetSize);
      let sourceBuffer: Buffer;
      let sourceSize: number;

      if (uploadedForSize) {
        sourceBuffer = Buffer.from(await uploadedForSize.file.arrayBuffer());
        sourceSize = uploadedForSize.size;
      } else {
        sourceBuffer = Buffer.from(await largest.file.arrayBuffer());
        sourceSize = largest.size;
      } 

      const png = await resizeIfNeeded(sourceBuffer, targetSize, sourceSize);
      let filename = "";

      if (includeApple && APPLE_SIZES.includes(targetSize as any)) filename = `${appleDir}apple-touch-icon-${targetSize}x${targetSize}.png`;
      else if (includeAndroid && ANDROID_SIZES.includes(targetSize as any)) filename = `${androidDir}android-chrome-${targetSize}x${targetSize}.png`;
      else if (includeWindows && WINDOWS_SIZES.includes(targetSize as any)) filename = `${windowsDir}mstile-${targetSize}x${targetSize}.png`;
      else if (ALL_SIZES.includes(targetSize as any)) filename = `favicon-${targetSize}x${targetSize}.png`;
      else continue;

      zip.file(filename, png);
      
      if (ALL_SIZES.includes(targetSize as any) && targetSize <= 256) {
        icoBuffers.push(png);
      }
    }
  }

  // ==================== SIMPLE MODE ====================
  else if (mode === "simple" && simpleImage) {
    const buffer = Buffer.from(await simpleImage.arrayBuffer());
    const metadata = await sharp(buffer, { animated: false }).metadata();
    const originalSize = metadata.width; 

    for (const size of ALL_SIZES) {
      const png = await resizeIfNeeded(buffer, size, originalSize);
      const filename = `favicon-${size}x${size}.png`;
      zip.file(filename, png);
      if (size <= 256) icoBuffers.push(png);
    }

    if (includeApple) {
      for (const size of APPLE_SIZES) {
        const png = await resizeIfNeeded(buffer, size, originalSize);
        const filename = `${appleDir}apple-touch-icon-${size}x${size}.png`;
        zip.file(filename, png);
      }
    }

    if (includeAndroid) {
      for (const size of ANDROID_SIZES) {
        const filename = `${androidDir}android-chrome-${size}x${size}.png`;
        if (!ALL_SIZES.includes(size as any)) {
          const png = await resizeIfNeeded(buffer, size, originalSize);
          zip.file(filename, png);
        } else {
          const existingPng = zip.file(`favicon-${size}x${size}.png`);
          if (existingPng) {
            zip.file(filename, await existingPng.async("nodebuffer"));
          }
        }
      }
    }

    if (includeWindows) {
      for (const size of WINDOWS_SIZES) {
        const filename = `${windowsDir}mstile-${size}x${size}.png`;
        if (!ALL_SIZES.includes(size as any)) {
          const png = await resizeIfNeeded(buffer, size, originalSize);
          zip.file(filename, png);
        } else {
          const existingPng = zip.file(`favicon-${size}x${size}.png`);
          if (existingPng) {
            zip.file(filename, await existingPng.async("nodebuffer"));
          }
        }
      }
    }
  } else {
    throw new Error("Invalid mode or missing image.");
  }

  // ==================== ICO-Generierung ====================
  if (icoBuffers.length > 0) {
    try {
      const icoBuffer = await pngToIco(icoBuffers);
      zip.file("favicon.ico", icoBuffer);
    } catch (e) {
      console.error("PNG-TO-ICO ERROR:", e);
      throw new Error("Failed to generate .ico file.");
    }
  }

  // ==================== CONFIG FILES ====================
  if (includeAndroid) {
    const manifest = { name: appName, short_name: shortName, icons: ANDROID_SIZES.map(size => ({ src: `${androidDir}android-chrome-${size}x${size}.png`, sizes: `${size}x${size}`, type: "image/png" })), theme_color: themeColor, background_color: "#ffffff", display: "standalone" };
    zip.file(`${androidDir}manifest.json`, JSON.stringify(manifest, null, 2));
  }

  if (includeWindows) {
    const browserconfig = `<?xml version="1.0" encoding="utf-8"?><browserconfig><msapplication><tile><square70x70logo src="${windowsDir}mstile-70x70.png"/><square150x150logo src="${windowsDir}mstile-150x150.png"/><square310x310logo src="${windowsDir}mstile-310x310.png"/><TileColor>${themeColor}</TileColor></tile></msapplication></browserconfig>`;
    zip.file(`${windowsDir}browserconfig.xml`, browserconfig);
  }

  // ==================== RETURN ====================
  return await zip.generateAsync({ type: "nodebuffer" });
}