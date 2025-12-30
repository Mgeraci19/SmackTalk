import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  // Only use static export for GitHub Pages deployment
  ...(isGitHubPages && { output: "export" }),
  basePath: isProd ? "/SmackTalk" : "",
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
