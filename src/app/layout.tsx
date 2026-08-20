import type { Metadata, Viewport } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Players Profile",
  description: "Player profile, attendance, and training access.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f6f1e8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable} antialiased`}>
        <AppBootstrap />
        <ConfirmDialogProvider>
          <PromptDialogProvider>{children}</PromptDialogProvider>
        </ConfirmDialogProvider>
      </body>
    </html>
  );
}
