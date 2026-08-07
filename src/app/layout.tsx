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
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `${storeName} - Loja Digital`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${storeName} - Loja Digital`,
      description: storeDescription,
      images: ["/og-image.png"],
    },
    robots: {
      index: true,
      follow: true,
    },
    manifest: "/site.webmanifest",
    icons: {
      icon: [
        { url: "/favicon-16x16.png", sizes: "16x16" },
        { url: "/favicon-32x32.png", sizes: "32x32" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
      shortcut: ["/favicon.ico"],
    },
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixRgb(base: [number, number, number], target: [number, number, number], weight: number): string {
  const r = Math.round(base[0] + (target[0] - base[0]) * weight);
  const g = Math.round(base[1] + (target[1] - base[1]) * weight);
  const b = Math.round(base[2] + (target[2] - base[2]) * weight);
  return `${r} ${g} ${b}`;
}

/** Gera uma paleta 50–900 em formato RGB (espaços) a partir de uma cor base hex. */
function generateBrandPalette(baseHex: string): Record<string, string> {
  const base = hexToRgb(baseHex);
  const white: [number, number, number] = [255, 255, 255];
  const black: [number, number, number] = [0, 0, 0];
  return {
    "50": mixRgb(base, white, 0.95),
    "100": mixRgb(base, white, 0.9),
    "200": mixRgb(base, white, 0.75),
    "300": mixRgb(base, white, 0.55),
    "400": mixRgb(base, white, 0.3),
    "500": `${base[0]} ${base[1]} ${base[2]}`,
    "600": mixRgb(base, black, 0.1),
    "700": mixRgb(base, black, 0.25),
    "800": mixRgb(base, black, 0.4),
    "900": mixRgb(base, black, 0.55),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let brandCss = "";
  try {
    const { getAppearanceSettings } = await import("@/lib/settings");
    const appearance = await getAppearanceSettings();
    if (appearance.brandColor && appearance.brandColor !== "#7c3aed") {
      const palette = generateBrandPalette(appearance.brandColor);
      brandCss = `:root{${Object.entries(palette).map(([k, v]) => `--color-brand-${k}:${v}`).join(";")}}`;
    }
  } catch {}

  return (
    <html lang="pt-BR">
      <head>
        {brandCss && (
          <style
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: brandCss }}
          />
        )}
      </head>
      <body className={`${inter.variable} font-sans pt-24`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
