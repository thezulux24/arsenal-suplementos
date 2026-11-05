'use client';

import React from 'react';
import Image from 'next/image';

/** Hosts que el optimizador de Next sirve en tamaños adecuados (ver next.config.mjs). */
const OPTIMIZE = /^https:\/\/((?:[a-z0-9-]+\.)?webproai\.tech|images\.unsplash\.com)\//i;

type Props = React.ImgHTMLAttributes<HTMLImageElement> & { sizes?: string; fill?: boolean; fetchPriority?: string };

/**
 * Imagen para los primitivos del SDK (`<CmsImage as={SmartImage}>`, `<CmsItemImage as={SmartImage}>`):
 * usa next/image (srcset, AVIF/WebP, sin salto de diseño) para medios del CMS y un <img> normal
 * para cualquier otra URL que el cliente pegue en el portal, para no romper la página.
 * Por defecto ocupa su contenedor (`fill`), que debe tener posición y proporción.
 */
export function SmartImage({ src, alt = '', sizes = '100vw', fill = true, width, height, loading, decoding, fetchPriority, style, ...rest }: Props) {
  const url = typeof src === 'string' ? src : '';
  const priority = fetchPriority === 'high' || loading === 'eager';
  if (url && OPTIMIZE.test(url)) {
    const dims = fill || !width || !height ? { fill: true as const } : { width: Number(width), height: Number(height) };
    return <Image src={url} alt={alt} sizes={sizes} priority={priority} {...dims} style={style} {...(rest as any)} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={decoding || 'async'}
      width={width}
      height={height}
      style={fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%', ...style } : style}
      {...rest}
    />
  );
}

/** Variante con `sizes` fijado, para pasar como `as` a los primitivos. */
export function sized(sizes: string) {
  const C = (p: Props) => <SmartImage {...p} sizes={sizes} />;
  C.displayName = `SmartImage(${sizes})`;
  return C;
}
