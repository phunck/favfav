// src/lib/favicon-generator.ts
import sharp from "sharp";
import { encodeIco } from "ico-endec";
import JSZip from "jszip";

const ALL_SIZES = [16, 32, 48, 64, 128, 144, 192, 256, 512] as const;
const APPLE_SIZES = [120, 152, 167, 180] as const;
const ANDROID_SIZES = [192, 196, 512] as const;
const WINDOWS_SIZES = [70, 144, 150, 310] as const;

export async function generateFaviconZip(
  mode: "simple" | "advanced",
  simpleImage?: File,
  advancedImages?: Record<number, File>,
  includeApple: boolean = false,
  includeAndroid: boolean = false,
  includeWindows: boolean = false
): Promise<Buffer> {
  const zip = new JSZip();
  const icoBuffers: Buffer[] = [];

  const resizeIfNeeded = async (buffer: Buffer, targetSize: number, sourceSize?: number): Promise<Buffer> => {
    if (sourceSize === targetSize) return buffer;
    return await sharp(buffer)
      .resize(targetSize, targetSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
  };

  // ==================== PRO MODE ====================
  if (mode === "advanced" && advancedImages) {
    const uploaded = Object.entries(advancedImages)
      .map(([sizeStr, file]) => ({ size: parseInt(sizeStr, 10), file }))
      .filter((x): x is { size: number; file: File } => x.file !== null);

    const largest = uploaded.reduce((max, cur) => (cur.size > max.size ? cur : max), uploaded[0]);

    const targetSizes = [
      ...ALL_SIZES,
      ...(includeApple ? APPLE_SIZES : []),
      ...(includeAndroid ? ANDROID_SIZES.filter(s => !ALL_SIZES.includes(s as any)) : []),
      ...(includeWindows ? WINDOWS_SIZES.filter(s => !ALL_SIZES.includes(s as any)) : [])
    ];

    for (const targetSize of targetSizes) {
      const uploadedForSize = uploaded.find(x => x.size === targetSize);
      let sourceBuffer: Buffer;
      let sourceSize: number;

      if (uploadedForSize) {
        sourceBuffer = Buffer.from(await uploadedForSize.file.arrayBuffer());
        sourceSize = uploadedForSize.size;
      } else if (largest && largest.size >= targetSize) {
        sourceBuffer = Buffer.from(await largest.file.arrayBuffer());
        sourceSize = largest.size;
      } else if (largest) {
        sourceBuffer = Buffer.from(await largest.file.arrayBuffer());
        sourceSize = largest.size;
      } else {
        continue;
      }

      const png = await resizeIfNeeded(sourceBuffer, targetSize, sourceSize);
      let filename = "";

      if (ALL_SIZES.includes(targetSize as any)) {
        filename = `favicon-${targetSize}x${targetSize}.png`;
      } else if (APPLE_SIZES.includes(targetSize as any)) {
        filename = `apple-touch-icon-${targetSize}x${targetSize}.png`;
      } else if (ANDROID_SIZES.includes(targetSize as any)) {
        filename = `android-chrome-${targetSize}x${targetSize}.png`;
      } else if (WINDOWS_SIZES.includes(targetSize as any)) {
        filename = `mstile-${targetSize}x${targetSize}.png`;
      }

      zip.file(filename, png);
      if (targetSize <= 256) icoBuffers.push(png);
    }

    if (icoBuffers.length > 0) {
      zip.file("favicon.ico", encodeIco(icoBuffers));
    }
  }

  // ==================== SIMPLE MODE ====================
  else if (mode === "simple" && simpleImage) {
    const buffer = Buffer.from(await simpleImage.arrayBuffer());

    for (const size of ALL_SIZES) {
      const png = await sharp(buffer)
        .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      zip.file(`favicon-${size}x${size}.png`, png);
      if (size <= 256) icoBuffers.push(png);
    }

    if (includeApple) {
      for (const size of APPLE_SIZES) {
        const png = await sharp(buffer)
          .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();
        zip.file(`apple-touch-icon-${size}x${size}.png`, png);
      }
    }

    if (includeAndroid) {
      for (const size of ANDROID_SIZES) {
        const png = await sharp(buffer)
          .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();
        zip.file(`android-chrome-${size}x${size}.png`, png);
      }
    }

    if (includeWindows) {
      for (const size of WINDOWS_SIZES) {
        const png = await sharp(buffer)
          .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();
        zip.file(`mstile-${size}x${size}.png`, png);
      }
    }

    zip.file("favicon.ico", encodeIco(icoBuffers));
  }

  // ==================== CONFIG FILES ====================
  if (includeAndroid) {
    const manifest = {
      name: "favfav",
      short_name: "favfav",
      icons: ANDROID_SIZES.map(size => ({
        src: `android-chrome-${size}x${size}.png`,
        sizes: `${size}x${size}`,
        type: "image/png"
      })),
      theme_color: "#6366f1",
      background_color: "#ffffff",
      display: "standalone"
    };
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));
  }

  if (includeWindows) {
    const browserconfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square70x70logo src="mstile-70x70.png"/>
      <square150x150logo src="mstile-150x150.png"/>
      <square310x310logo src="mstile-310x310.png"/>
      <TileColor>#6366f1</TileColor>
    </tile>
  </msapplication>
</browserconfig>`;
    zip.file("browserconfig.xml", browserconfig);
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
    htmlLines.push(...APPLE_SIZES.map(s => `  <link rel="apple-touch-icon" sizes="${s}x${s}" href="apple-touch-icon-${s}x${s}.png">`));
  }
  if (includeAndroid) {
    htmlLines.push('  <link rel="manifest" href="manifest.json">');
  }
  if (includeWindows) {
    htmlLines.push('  <meta name="msapplication-TileColor" content="#6366f1">');
    htmlLines.push('  <meta name="msapplication-TileImage" content="mstile-144x144.png">');
    htmlLines.push('  <meta name="msapplication-config" content="browserconfig.xml">');
  }

  htmlLines.push('</head><body><h1>favfav – your favicons are ready!</h1></body></html>');
  zip.file("favicon-example.html", htmlLines.join("\n"));

  return await zip.generateAsync({ type: "nodebuffer" });
}