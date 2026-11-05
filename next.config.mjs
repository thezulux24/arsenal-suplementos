/** @type {import('next').NextConfig} */
const cms = process.env.NEXT_PUBLIC_CMS_URL || 'https://webproai.tech';
const portals = (process.env.NEXT_PUBLIC_PORTAL_ORIGINS || 'http://localhost:3005').split(',').join(' ');

const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  devIndicators: false,
  images: {
    // Fotos del CMS en tamaños adecuados (srcset, AVIF/WebP). Otras URLs las pinta <SmartImage> con <img>.
    remotePatterns: [
      { protocol: 'https', hostname: 'webproai.tech' },
      { protocol: 'https', hostname: '*.webproai.tech' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000,
  },
  // El portal muestra la tienda en un iframe: nada de X-Frame-Options DENY, solo los orígenes del CMS.
  async headers() {
    return [{ source: '/:path*', headers: [{ key: 'Content-Security-Policy', value: `frame-ancestors 'self' ${cms} ${portals}` }] }];
  },
  async redirects() {
    return [{ source: '/catalogo', destination: '/tienda', permanent: true }];
  },
};
export default nextConfig;
