import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { Toaster } from "@/components/ui/Toaster";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "ShopPix - Loja Digital",
    template: "%s | ShopPix",
  },
  description:
    "Compre produtos digitais com segurança. Pagamento via PIX, cartão e Mercado Pago. Entrega imediata.",
  keywords: [
    "produtos digitais",
    "ecommerce",
    "pix",
    "download",
    "loja digital",
  ],
  alternates: {
    canonical: baseUrl,
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "ShopPix",
    title: "ShopPix - Loja Digital",
    description:
      "Compre produtos digitais com segurança. Pagamento via PIX, cartão e Mercado Pago. Entrega imediata.",
    url: baseUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "ShopPix - Loja Digital",
    description:
      "Compre produtos digitais com segurança. Pagamento via PIX, cartão e Mercado Pago. Entrega imediata.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
