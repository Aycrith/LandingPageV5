import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: "Immersive 3D Experience",
  description:
    "A cinematic, scroll-driven 3D interactive experience with GPU particles, custom shaders, and physics.",
  openGraph: {
    title: "Immersive 3D Experience",
    description:
      "A cinematic, scroll-driven 3D interactive experience with GPU particles, custom shaders, and physics.",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Immersive 3D Experience social preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Immersive 3D Experience",
    description:
      "A cinematic, scroll-driven 3D interactive experience with GPU particles, custom shaders, and physics.",
    images: ["/twitter-image"],
  },
};

export const viewport: Viewport = {
  themeColor: "#050507",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} dark`}
    >
      <body>{children}</body>
    </html>
  );
}
