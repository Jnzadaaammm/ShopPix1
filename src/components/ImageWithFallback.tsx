"use client";

import { useState, useMemo } from "react";
import Image, { ImageProps } from "next/image";
import { Package } from "lucide-react";

interface ImageWithFallbackProps extends Omit<ImageProps, "onError"> {
  fallbackClassName?: string;
}

// Hostnames configurados no next.config.ts
const CONFIGURED_HOSTS = [
  "images.unsplash.com",
  "placehold.co",
  "cdn.discordapp.com",
  "lh3.googleusercontent.com",
  "images4.alphacoders.com",
];

/**
 * Componente Image com fallback automático.
 * - Se a imagem falhar ao carregar, mostra um placeholder com ícone.
 * - Se o hostname não estiver configurado no next/image, usa <img> comum.
 */
export default function ImageWithFallback({
  alt,
  className,
  fallbackClassName,
  src,
  ...props
}: ImageWithFallbackProps) {
  const [error, setError] = useState(false);

  // Verifica se o hostname da URL está configurado no next/image
  const useNextImage = useMemo(() => {
    if (!src || typeof src !== "string") return true; // imagens locais passam
    try {
      const url = new URL(src);
      return CONFIGURED_HOSTS.some((h) =>
        url.hostname === h || url.hostname.endsWith(`.${h}`)
      );
    } catch {
      return true; // URL relativa ou inválida — deixa o next/image tentar
    }
  }, [src]);

  if (error || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${fallbackClassName || className || ""}`}
        role="img"
        aria-label={alt}
      >
        <img
          src="/logo.svg"
          alt="ShopPix"
          className="h-full w-full object-contain p-4"
        />
      </div>
    );
  }

  // Hostname não configurado — usa <img> comum para evitar erro do next/image
  if (!useNextImage && typeof src === "string") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={className}
        onError={() => setError(true)}
        {...(props as any)}
      />
    );
  }

  return (
    <Image
      alt={alt}
      className={className}
      src={src}
      onError={() => setError(true)}
      {...props}
    />
  );
}
