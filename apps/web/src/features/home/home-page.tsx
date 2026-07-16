import { Text } from "@repo/ui/components/text";
import { Button } from "@repo/ui/components/ui/button";
import { IconBrandNextjs } from "@tabler/icons-react";
import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";

export function HomePage() {
  return (
    <div className="h-dvh flex flex-col items-center justify-center">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 sm:items-start">
        <div className="flex items-center gap-4">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={100}
            height={20}
            priority
          />
          <Text variant="heading-xl" as="h1" className="text-primary">
            Starter
          </Text>
        </div>
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight">
            Everything you need to build your next SaaS.
          </h1>

          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Built with Next.js, React, Better Auth, Stripe, Prisma, Tailwind
            CSS, next-intl, Docker, and a production-ready architecture.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <Button
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full px-5 transition-colors"
            asChild
          >
            <Link href="/subscription">
              <IconBrandNextjs className="size-5 text-white" />
              <Text className="text-white">Get Started</Text>
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
