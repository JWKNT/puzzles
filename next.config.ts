import type { NextConfig } from "next";

const isGitHubPages = process.env.PAGES_BASE_PATH === "/puzzles";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BASE_PATH: isGitHubPages ? "/puzzles" : "",
  },
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
