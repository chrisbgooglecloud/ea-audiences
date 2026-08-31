/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
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
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: process.env.BACKEND_API_URL 
          ? `${process.env.BACKEND_API_URL}/api/v1/:path*` 
          : 'http://127.0.0.1:8000/api/v1/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
