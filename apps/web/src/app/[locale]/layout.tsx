import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { type PropsWithChildren, Suspense } from "react";
import { routing } from "@/lib/i18n/routing";

interface Props extends PropsWithChildren {
  params: Promise<{ locale: string }>;
}

async function LocaleLayoutInner({ children, params }: Readonly<Props>) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  return (
    <NextIntlClientProvider locale={locale}>{children}</NextIntlClientProvider>
  );
}

export default function LocaleLayout({ children, params }: Readonly<Props>) {
  return (
    <Suspense fallback={null}>
      <LocaleLayoutInner params={params}>{children}</LocaleLayoutInner>
    </Suspense>
  );
}
