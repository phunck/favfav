// src/app/api/generate-favicon/route.ts
import { NextRequest } from "next/server";
import { generateFaviconZip } from "@/lib/favicon-generator";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const mode = formData.get("mode") as "simple" | "advanced";

    let zipBuffer: Buffer;

    if (mode === "advanced") {
      const advancedImages: Record<number, File> = {};
      for (const key of formData.keys()) {
        if (key.startsWith("size-")) {
          const size = parseInt(key.replace("size-", ""), 10);
          const file = formData.get(key) as File;
          if (file) advancedImages[size] = file;
        }
      }
      zipBuffer = await generateFaviconZip("advanced", undefined, advancedImages);
    } else {
      const image = formData.get("image") as File;
      if (!image) return new Response("Kein Bild hochgeladen", { status: 400 });
      zipBuffer = await generateFaviconZip("simple", image);
    }

    return new Response(zipBuffer.buffer as BodyInit, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="favicons.zip"',
      },
    });
  } catch (error) {
    console.error("Favicon generation error:", error);
    return new Response("Interner Serverfehler", { status: 500 });
  }
}