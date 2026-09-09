import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The workspace package resolves to TypeScript source, so Next compiles it
  // rather than expecting a prebuilt dist. Publishing swaps to dist via
  // publishConfig; nothing here changes.
  transpilePackages: ['remark-scanned-page'],
  /* config options here */
};

export default nextConfig;
