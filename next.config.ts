import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  allowedDevOrigins: [
    "preview-chat-249bca23-0171-4d66-a68e-66b08d8fdbd3.space-z.ai",
  ],
};

export default nextConfig;
