// src/app/api/generate-favicon/route.ts
import { NextRequest } from "next/server";
import { generateFaviconZip } from "@/lib/favicon-generator";

export const runtime = 'nodejs';

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
      if (!simpleImage) return new Response("No image uploaded", { status: 400 });
    }

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

    // Minimaler TS-Fix: Buffer -> Uint8Array (BodyInit)
    return new Response(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="favfavicon.zip"',
      },
    });
  } catch (error) {
    console.error("Favicon generation error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
