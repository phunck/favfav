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

  if (mode === "advanced" && advancedImages) {
    const icoBuffers: Buffer[] = [];

    for (const size of Object.keys(advancedImages).map(Number)) {
      const file = advancedImages[size];
      if (!file) continue;

      const buffer = Buffer.from(await file.arrayBuffer());
      const resized = await sharp(buffer)
        .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();

      zip.file(`favicon-${size}x${size}.png`, resized);
      icoBuffers.push(resized);
    }

    if (icoBuffers.length > 0) {
      zip.file("favicon.ico", encodeIco(icoBuffers));
    }

    if (includeApple) {
      for (const size of APPLE_SIZES) {
        if (advancedImages[size]) {
          const buffer = Buffer.from(await advancedImages[size]!.arrayBuffer());
          const applePng = await sharp(buffer)
            .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer();
          zip.file(`apple-touch-icon-${size}x${size}.png`, applePng);
        }
      }
    }
  } else if (mode === "simple" && simpleImage) {
    const buffer = Buffer.from(await simpleImage.arrayBuffer());

    for (const size of ALL_SIZES) {
      const png = await sharp(buffer)
        .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      zip.file(`favicon-${size}x${size}.png`, png);
    }

    if (includeApple) {
      for (const size of APPLE_SIZES) {
        const applePng = await sharp(buffer)
          .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();
        zip.file(`apple-touch-icon-${size}x${size}.png`, applePng);
      }
    }

    const icoBuffers = await Promise.all(
      ALL_SIZES.map(size => sharp(buffer).resize(size, size).png().toBuffer())
    );
    zip.file("favicon.ico", encodeIco(icoBuffers));
  }

  // Optional: HTML Example
  const htmlLines: string[] = [
    '<!DOCTYPE html>',
    '<html><head>',
    '  <meta charset="utf-8">',
    '  <title>Favicon Test</title>',
    '  <link rel="icon" href="favicon.ico">',
    ...ALL_SIZES.map(s => `  <link rel="icon" type="image/png" sizes="${s}x${s}" href="favicon-${s}x${s}.png">`),
    ...(includeApple ? APPLE_SIZES.map(s => `  <link rel="apple-touch-icon" sizes="${s}x${s}" href="apple-touch-icon-${s}x${s}.png">`) : [])
  ];
  htmlLines.push('</head><body><h1>favfav – your favicons are ready!</h1></body></html>');
  zip.file("favicon-example.html", htmlLines.join("\n"));

  return await zip.generateAsync({ type: "nodebuffer" });
}