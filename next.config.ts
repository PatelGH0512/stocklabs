import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Ensure Next.js uses this project directory as the workspace root
  outputFileTracingRoot: path.resolve(process.cwd()),
  eslint: {
      ignoreDuringBuilds: true,
  }, typescript: {
      ignoreBuildErrors: true
    }
};

export default nextConfig;
