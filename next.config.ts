import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    /**
     * Image Optimization is switched off on purpose.
     *
     * The Vercel account this deploys to has used up its image optimization
     * quota. With the optimizer on, every /_next/image request answers 402 and
     * the production site renders without a single graphic. Serving the files
     * as they are costs nothing and every asset here is already an SVG.
     */
    unoptimized: true,
  },
  /* The OG image route reads the .ttf files off disk at request time. */
  outputFileTracingIncludes: {
    "/opengraph-image": ["./src/assets/**"],
  },
};

export default config;
