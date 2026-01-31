import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'handlaprivatkund.ica.se',
        pathname: '/images-v3/**',
      },
    ],
  },
};

export default nextConfig;
