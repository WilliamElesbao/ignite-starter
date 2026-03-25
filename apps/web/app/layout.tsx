import type { ReactNode } from "react";

export const metadata = {
  title: "Origin Starter Web",
  description: "Next.js app using bun and Biome",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
