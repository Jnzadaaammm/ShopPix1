import { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/checkout", "/carrinho", "/perfil", "/pedidos", "/downloads"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
