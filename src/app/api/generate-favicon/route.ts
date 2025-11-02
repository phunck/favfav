// src/app/api/generate-favicon/route.ts
import { NextRequest } from "next/server";
import { generateFaviconZip } from "@/lib/favicon-generator";

export const runtime = "nodejs";

// ✅ Setzt das Request-Limit auf 4 MB
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb",
    },
  },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const mode = formData.get("mode") as "simple" | "advanced";
    const includeApple = formData.get("includeApple") === "true";
    const includeAndroid = formData.get("includeAndroid") === "true";
    const includeWindows = formData.get("includeWindows") === "true";

    const appName = (formData.get("appName") as string) || "favfav";
    const shortName = (formData.get("shortName") as string) || "favfav";
    const themeColor = (formData.get("themeColor") as string) || "#6366f1";

    let simpleImage: File | undefined;
    let advancedImages: Record<number, File> | undefined;

    // --- Modus prüfen und Dateien sammeln ---
    if (mode === "advanced") {
      advancedImages = {};
      for (const key of formData.keys()) {
        if (key.startsWith("size-")) {
          const size = parseInt(key.replace("size-", ""), 10);
          const file = formData.get(key) as File;
          if (file) advancedImages[size] = file;
        }
      }
      if (Object.keys(advancedImages).length === 0) {
        return new Response("No files uploaded in Pro Mode.", { status: 400 });
      }
    } else {
      simpleImage = formData.get("image") as File;
      if (!simpleImage) {
        return new Response("No image uploaded", { status: 400 });
      }
    }

    // --- ZIP-Erstellung ---
    const zipBuffer = await generateFaviconZip(
      mode,
      simpleImage,
      advancedImages,
      includeApple,
      includeAndroid,
      includeWindows,
      appName,
      shortName,
      themeColor
    );

    // --- Erfolgreiche Antwort ---
    return new Response(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="favfavicon.zip"',
      },
    });
  } catch (error: any) {
    console.error("Favicon generation error:", error);

    // --- Spezifische Fehlerbehandlung ---
    if (error?.message?.includes("entity too large") || error?.status === 413) {
      return new Response("The uploaded file exceeds the 4 MB limit.", {
        status: 413,
      });
    }

    return new Response("Internal Server Error", { status: 500 });
  }
}
