import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { Toaster } from "@/components/ui/Toaster";
import { getStoreSettings } from "@/lib/settings";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  let storeName = "ShopPix";
  let storeDescription = "Compre produtos digitais com segurança. Pagamento via PIX, cartão e Mercado Pago. Entrega imediata.";
  try {
    const store = await getStoreSettings();
    if (store.storeName) storeName = store.storeName;
    if (store.storeDescription) storeDescription = store.storeDescription;
  } catch {}

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: `${storeName} - Loja Digital`,
      template: `%s | ${storeName}`,
    },
    description: storeDescription,
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
      siteName: storeName,
      title: `${storeName} - Loja Digital`,
      description: storeDescription,
      url: baseUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: `${storeName} - Loja Digital`,
      description: storeDescription,
    },
    robots: {
      index: true,
      follow: true,
    },
    icons: {
      icon: "/favicon.ico",
    },
  };
}

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
