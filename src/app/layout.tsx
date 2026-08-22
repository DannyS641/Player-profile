import type { Metadata, Viewport } from "next";
import { Manrope, Space_Grotesk, Baloo_2 } from "next/font/google";
import "./globals.css";
import { ConfirmDialogProvider } from "@/components/ConfirmDialog";
import { PromptDialogProvider } from "@/components/PromptDialog";
import AppBootstrap from "@/components/AppBootstrap";

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

// `ui-rounded` resolves to SF Pro Rounded on iOS/WebKit only. Android's
// Chrome WebView doesn't recognize that generic family and falls through
// the font stack, so this gives it an actual rounded face to land on
// instead of silently reverting to Manrope/Space Grotesk.
const roundedFallback = Baloo_2({
  variable: "--font-rounded-fallback",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "A5",
  description: "Player profile, attendance, and training access.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1712" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${displayFont.variable} ${bodyFont.variable} ${roundedFallback.variable} antialiased`}
      >
        <AppBootstrap />
        <ConfirmDialogProvider>
          <PromptDialogProvider>{children}</PromptDialogProvider>
        </ConfirmDialogProvider>
      </body>
    </html>
  );
}
