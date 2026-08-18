import type { Metadata, Viewport } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Portal do Responsável",
  description: "Acompanhe notas, faltas, agenda e fale com a escola.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#122A4D",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body
        className={`${sora.variable} ${inter.variable} font-body text-ink antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
