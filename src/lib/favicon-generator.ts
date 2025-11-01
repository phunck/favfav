// src/lib/favicon-generator.ts
import sharp from "sharp";
import { encodeIco } from "ico-endec";
import JSZip from "jszip";

const ALL_SIZES = [16, 32, 48, 64, 128, 256, 512] as const;

/**
 * Generiert ein ZIP mit Favicons (PNG + ICO)
 * @param mode - "simple" (ein Bild → alle Größen) oder "advanced" (pro Größe ein Bild)
 * @param simpleImage - Nur im Simple-Modus: Das Quellbild
 * @param advancedImages - Nur im Advanced-Modus: Objekt mit Größe → File
 * @returns Buffer des ZIP-Archivs
 */
export async function generateFaviconZip(
  mode: "simple" | "advanced",
  simpleImage?: File,
  advancedImages?: Record<number, File>
): Promise<Buffer> {
  const zip = new JSZip();

  if (mode === "advanced" && advancedImages) {
    // Advanced Mode: Nur hochgeladene Größen verarbeiten
    const icoBuffers: Buffer[] = [];

    for (const size of ALL_SIZES) {
      const file = advancedImages[size];
      if (!file) continue; // Überspringe fehlende Größen

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const resized = await sharp(buffer)
        .resize(size, size, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent
        })
        .png()
        .toBuffer();

      zip.file(`favicon-${size}x${size}.png`, resized);
      icoBuffers.push(resized);
    }

    // Nur ICO erzeugen, wenn mindestens ein Bild vorhanden
    if (icoBuffers.length > 0) {
      const ico = encodeIco(icoBuffers);
      zip.file("favicon.ico", ico);
    }
  } else if (mode === "simple" && simpleImage) {
    // Simple Mode: Ein Bild → alle Größen
    const arrayBuffer = await simpleImage.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // PNGs für alle Größen
    const pngPromises = ALL_SIZES.map(async (size) => {
      const png = await sharp(buffer)
        .resize(size, size, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();
      zip.file(`favicon-${size}x${size}.png`, png);
      return png;
    });

    const icoBuffers = await Promise.all(pngPromises);
    const ico = encodeIco(icoBuffers);
    zip.file("favicon.ico", ico);
  } else {
    throw new Error("Ungültiger Modus oder fehlende Bilder");
  }

  // ZIP als Buffer generieren
  return await zip.generateAsync({ type: "nodebuffer" });
}