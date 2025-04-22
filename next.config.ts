import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Enable strict mode for better development
  reactStrictMode: true,
  // Disable Pages Router
  pageExtensions: ["tsx", "ts"],
};

export default nextConfig;
