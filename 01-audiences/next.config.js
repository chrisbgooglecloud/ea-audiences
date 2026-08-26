/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  transpilePackages: ["three", "react-force-graph-2d", "react-force-graph-3d", "three-spritetext"],
  experimental: {
    serverComponentsExternalPackages: [
      "@google-cloud/spanner",
      "@google-cloud/bigquery",
      "@google-cloud/storage",
      "@google-cloud/vertexai",
    ],
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: "canvas" }];
    return config;
  },
};

module.exports = nextConfig;
