import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  reactCompiler: true,

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.API_URL}/:path*`,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin({
  requestConfig: "./src/lib/i18n/requests.ts",
  experimental: {
    createMessagesDeclaration: "./src/lib/i18n/locales/en.json",
  },
});

export default withNextIntl(nextConfig);
