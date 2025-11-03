// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ToastsProvider } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: ".favfav – The Ultimate Favicon Generator",
  description:
    "Generate pixel-perfect favicons in seconds. PNG, ICO, Apple Touch, Android, Windows – all platforms. Free, fast, pixel-perfect.",
  keywords: [
    "favicon generator",
    "ico generator",
    "apple touch icon",
    "android pwa",
    "windows tiles",
    "manifest.json",
    "browserconfig.xml",
    "free favicon tool",
    "pixel perfect favicons",
  ],
  authors: [{ name: "phunck", url: "https://github.com/phunck" }],
  creator: "phunck",
  publisher: "phunck",
  formatDetection: { telephone: false },
  metadataBase: new URL("https://favfavicon.com"),
  alternates: { canonical: "/" },
  openGraph: {
    title: ".favfav – The Ultimate Favicon Generator",
    description:
      "Generate pixel-perfect favicons in seconds. PNG, ICO, Apple Touch, Android, Windows – all platforms. Free, fast, pixel-perfect.",
    url: "https://favfavicon.com",
    siteName: ".favfav",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: ".favfav – The Ultimate Favicon Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: ".favfav – The Ultimate Favicon Generator",
    description:
      "Generate pixel-perfect favicons in seconds. PNG, ICO, Apple Touch, Android, Windows – all platforms. Free, fast, pixel-perfect.",
    creator: "@phunck",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="msapplication-TileColor" content="#6366f1" />
      </head>
      <body className={inter.className}>
        <ToastsProvider>
          {children}
          <Toaster />
        </ToastsProvider>
      </body>
    </html>
  );
}
