/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [25, 50, 75], // Standard Next.js 16 prep recommendation
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
      },
    ],
  },
  experimental: {
    reactCompiler: false,
  },
};

export default nextConfig;
