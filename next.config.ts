import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "off",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  // Otimizacoes de memoria
  productionBrowserSourceMaps: false,
  experimental: {
    // Limitar workers paralelos para economizar RAM
    workerThreads: false,
    cpus: 1,
    // Desativar recursos pesados
    optimizePackageImports: [
      "lucide-react",
      "@paypal/react-paypal-js",
      "@stripe/react-stripe-js",
    ],
  },
  images: {
    formats: ["image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.discordapp.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "images4.alphacoders.com" },
      { protocol: "https", hostname: "**.alphacoders.com" },
    ],
  },
  // Fix for Square Cloud development
  allowedDevOrigins: ["shopix.squareweb.app", "127.0.0.1:62729", "127.0.0.1"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
