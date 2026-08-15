import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Sora, Cairo } from "next/font/google";
import "../styles/globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Managing Your Files",
    template: "%s | Managing Your Files",
  },
  description:
    "A file management platform — upload, organize and explore your files.",
  applicationName: "Managing Your Files",
  keywords: [
    "file management",
    "file storage",
    "upload files",
    "cloud storage",
    "document manager",
  ],
  authors: [{ name: "Managing Your Files" }],
  creator: "Managing Your Files",
  publisher: "Managing Your Files",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Managing Your Files",
    description:
      "A file management platform — upload, organize and explore your files.",
    url: APP_URL,
    siteName: "Managing Your Files",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: `${APP_URL}/favicon.ico`,
        width: 256,
        height: 256,
        alt: "Managing Your Files",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Managing Your Files",
    description:
      "A file management platform — upload, organize and explore your files.",
    images: [`${APP_URL}/favicon.ico`],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0e7c56" },
    { media: "(prefers-color-scheme: dark)", color: "#121416" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} ${cairo.variable}`}
    >
      <body className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
