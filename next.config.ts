import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Demo images come from picsum.photos (seeded, deterministic).
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "i.pravatar.cc" },
    ],
  },
};

export default nextConfig;
