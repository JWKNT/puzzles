import type { NextConfig } from "next";

const isGitHubPages = process.env.PAGES_BASE_PATH === "/puzzles";

const nextConfig: NextConfig = {
  ...(isGitHubPages
    ? {
        output: "export",
        basePath: "/puzzles",
        trailingSlash: true,
        typescript: {
          tsconfigPath: "tsconfig.pages.json",
        },
      }
    : {}),
};

export default nextConfig;
