// src/app/api/generate-ico/route.ts
import { NextRequest, NextResponse } from "next/server";
import pngToIco from "png-to-ico"; // Server-Paket!

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const icoBuffers: Buffer[] = [];

    // Sammle alle 'ico-png-' Dateien
    for (const entry of formData.entries()) {
      const [key, value] = entry;
      if (key.startsWith("ico-png-")) {
        const file = value as File;
        const buffer = Buffer.from(await file.arrayBuffer());
        icoBuffers.push(buffer);
      }
    }

    if (icoBuffers.length === 0) {
      return new Response("No PNGs provided for ICO generation.", {
        status: 400,
      });
    }

    // Nutze das Server-Paket, um die Buffer zu konvertieren
    // icoBuffer ist ein Node.js-Buffer
    const icoBuffer = await pngToIco(icoBuffers);

    // === KORREKTUR ===
    // Erstelle eine saubere Uint8Array-Kopie aus dem Node.js-Buffer.
    // Dies löst den TypeScript-Konflikt und erstellt einen
    // Web-API-kompatiblen ArrayBufferView.
    const uint8Array = new Uint8Array(icoBuffer);

    // Übergib diesen sauberen Uint8Array an die Response.
    return new Response(uint8Array, {
      headers: {
        "Content-Type": "image/x-icon",
      },
    });
    // === ENDE KORREKTUR ===
    
  } catch (error: any) {
    console.error("ICO generation error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}