import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
    rules: {
      "*.glsl": { loaders: ["raw-loader"], as: "*.js" },
      "*.wgsl": { loaders: ["raw-loader"], as: "*.js" },
      "*.vert": { loaders: ["raw-loader"], as: "*.js" },
      "*.frag": { loaders: ["raw-loader"], as: "*.js" },
    },
  },
  webpack: (config: { module: { rules: Array<Record<string, unknown>> } }) => {
    config.module.rules.push({
      test: /\.(glsl|wgsl|vert|frag)$/,
      type: "asset/source",
    });
    return config;
  },
};

export default nextConfig;
