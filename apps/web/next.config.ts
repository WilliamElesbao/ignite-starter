import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
};

const withNextIntl = createNextIntlPlugin({
  requestConfig: "./src/lib/i18n/requests.ts",
  experimental: {
    createMessagesDeclaration: "./src/lib/i18n/locales/en.json",
  },
});

export default withNextIntl(nextConfig);
