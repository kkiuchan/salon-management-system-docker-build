import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker配布用の設定
  output: "standalone",

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      // 具体的なプロジェクトドメインも追加（より安全）
      {
        protocol: "https",
        hostname: "frlidnhedwafdhaxszqs.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // 静的ファイルの設定
  async headers() {
    return [
      {
        source: "/api/sales/export",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
