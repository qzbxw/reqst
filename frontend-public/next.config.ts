import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // In Next.js 16.2.4 (Turbopack), eslint/typescript ignore flags are 
  // moved to other places (env vars or turbopack-specific config).
};

export default nextConfig;
