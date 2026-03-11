import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mc.nerothe.com",
      },
    ],
  },
};

export default nextConfig;
