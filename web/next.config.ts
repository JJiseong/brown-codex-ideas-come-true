import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/api/sharpen": ["./prompts/sharpen.md"],
    "/api/productify": ["./prompts/productify.md"],
  },
};

export default nextConfig;
