// src/lib/favicon-generator.ts
import sharp from "sharp";
import { encodeIco } from "ico-endec";
import JSZip from "jszip";

const ALL_SIZES = [16, 32, 48, 64, 128, 256, 512] as const;
const APPLE_SIZES = [120, 152, 167, 180] as const;

export async function generateFaviconZip(
  mode: "simple" | "advanced",
  simpleImage?: File,
  advancedImages?: Record<number, File>,
  includeApple: boolean = false
): Promise<Buffer> {
  const zip = new JSZip();
  const icoBuffers: Buffer[] = [];

  // Helper: Resize nur wenn nötig
  const resizeIfNeeded = async (buffer: Buffer, targetSize: number, sourceSize?: number): Promise<Buffer> => {
    if (sourceSize === targetSize) {
      return buffer; // Pixel-perfect: 1:1
    }
    return await sharp(buffer)
      .resize(targetSize, targetSize, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
  };

  if (mode === "advanced" && advancedImages) {
    // 1. Sammle alle hochgeladenen Bilder mit Größe
    const uploaded = Object.entries(advancedImages)
      .map(([sizeStr, file]) => ({ size: parseInt(sizeStr, 10), file }))
      .filter((x): x is { size: number; file: File } => x.file !== null);

    // 2. Finde das größte Bild für Fallback
    const largest = uploaded.reduce((max, cur) => (cur.size > max.size ? cur : max), uploaded[0]);

    // 3. Zielgrößen bestimmen
    const targetSizes = [
      ...ALL_SIZES,
      ...(includeApple ? APPLE_SIZES : []),
    ];

    // 4. Für jede Zielgröße
    for (const targetSize of targetSizes) {
      const uploadedForSize = uploaded.find((x) => x.size === targetSize);

      let sourceBuffer: Buffer;
      let sourceSize: number;

      if (uploadedForSize) {
        // Pixel-perfect: 1:1
        sourceBuffer = Buffer.from(await uploadedForSize.file.arrayBuffer());
        sourceSize = uploadedForSize.size;
      } else if (largest && largest.size >= targetSize) {
        // Runterskalieren vom größten
        sourceBuffer = Buffer.from(await largest.file.arrayBuffer());
        sourceSize = largest.size;
      } else if (largest) {
        // Hochskalieren (nur wenn keine bessere Option)
        sourceBuffer = Buffer.from(await largest.file.arrayBuffer());
        sourceSize = largest.size;
      } else {
        continue; // Sollte nie passieren
      }

      const png = await resizeIfNeeded(sourceBuffer, targetSize, sourceSize);
      const filename = targetSize <= 512
        ? `favicon-${targetSize}x${targetSize}.png`
        : `apple-touch-icon-${targetSize}x${targetSize}.png`;

      zip.file(filename, png);
      icoBuffers.push(png);
    }

    // .ico nur aus Standardgrößen (max 256 für ICO)
    const icoStandard = icoBuffers.filter((_, i) => targetSizes[i] <= 256);
    if (icoStandard.length > 0) {
      zip.file("favicon.ico", encodeIco(icoStandard));
    }
  }

  // ==================== SIMPLE MODE ====================
  else if (mode === "simple" && simpleImage) {
    const buffer = Buffer.from(await simpleImage.arrayBuffer());

    // Alle Standardgrößen generieren (immer, auch bei Upscaling)
    for (const size of ALL_SIZES) {
      const png = await sharp(buffer)
        .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      zip.file(`favicon-${size}x${size}.png`, png);
      icoBuffers.push(png);
    }

    // Apple nur bei includeApple
    if (includeApple) {
      for (const size of APPLE_SIZES) {
        const applePng = await sharp(buffer)
          .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();
        zip.file(`apple-touch-icon-${size}x${size}.png`, applePng);
      }
    }

    // .ico aus Standardgrößen
    const icoStandard = icoBuffers.slice(0, ALL_SIZES.length);
    zip.file("favicon.ico", encodeIco(icoStandard));
  }

  // ==================== HTML EXAMPLE ====================
  const htmlLines: string[] = [
    '<!DOCTYPE html>',
    '<html><head>',
    '  <meta charset="utf-8">',
    '  <title>Favicon Test</title>',
    '  <link rel="icon" href="favicon.ico">',
    ...ALL_SIZES.map(s => `  <link rel="icon" type="image/png" sizes="${s}x${s}" href="favicon-${s}x${s}.png">`),
  ];

  if (includeApple) {
    htmlLines.push(
      ...APPLE_SIZES.map(s => `  <link rel="apple-touch-icon" sizes="${s}x${s}" href="apple-touch-icon-${s}x${s}.png">`)
    );
  }

  htmlLines.push('</head><body><h1>favfav – your favicons are ready!</h1></body></html>');
  zip.file("favicon-example.html", htmlLines.join("\n"));

  return await zip.generateAsync({ type: "nodebuffer" });
}