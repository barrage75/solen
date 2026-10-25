import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Le bouton de développement de Next.js gênerait la démo.
  devIndicators: false,
  // La page /impact relit les PDF de la démo sur le disque du serveur : ils doivent suivre la fonction en ligne.
  outputFileTracingIncludes: {
    "/impact": ["./public/attachments/**/*"],
  },
};

export default nextConfig;
