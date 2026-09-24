import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Unsplash does the resizing — see src/lib/image-loader.ts.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    qualities: [60, 75, 90],
  },
};

export default nextConfig;
