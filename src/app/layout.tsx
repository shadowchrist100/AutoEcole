import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { ProgressProvider } from "@/lib/progress";
import { AppShell } from "@/components/AppShell";
import { PwaProvider } from "@/components/Pwa";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "AutoÉcole — Code de la route",
    template: "%s · AutoÉcole",
  },
  description:
    "Application d'apprentissage du code de la route : 919 questions corrigées, quiz chronométrés, examens blancs, révisions espacées et suivi par module.",
  applicationName: "AutoÉcole",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "AutoÉcole" },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={manrope.variable}>
      <body className="font-sans antialiased">
        <ProgressProvider>
          <PwaProvider>
            <AppShell>{children}</AppShell>
          </PwaProvider>
        </ProgressProvider>
      </body>
    </html>
  );
}
