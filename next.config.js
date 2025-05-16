/** @type {import('next').NextConfig} */

const nextConfig = {
  /* config options here */
  // Enable strict mode for better development
  reactStrictMode: true,
  // Disable Pages Router
  pageExtensions: ["tsx", "ts"],
  // Ensure CSS processing is working correctly
  webpack: (config) => {
    return config;
  },
  // Enable standalone output for containerized deployment
  output: "standalone",
};

module.exports = nextConfig;
