import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";
import { cn } from "../lib/shadcn";

/**
 * Text
 * -----
 * The single typography primitive of the design system. Two independent axes:
 *
 *  - `variant` → visual scale, named after the use case (not the HTML tag).
 *  - `tone`    → color, always driven by theme CSS variables (never hardcoded).
 *
 * The HTML tag is resolved automatically from `variant` (see `defaultElements`),
 * but can be overridden via `as` (e.g. render "heading-lg" as an <h1>) or
 * `asChild` (e.g. compose with <Link> for nav/sidebar/breadcrumb items).
 *
 * Quick usage guide:
 *  - LP hero headline                     → variant="display-lg" | "display-md"
 *  - Hero description / lead paragraph    → variant="body-lg"
 *  - Page title                           → variant="heading-xl" (h1)
 *  - Section title                        → variant="heading-lg" (h2)
 *  - Card / dialog title                  → variant="heading-md" | "heading-sm"
 *  - Default paragraph                    → variant="body-md"
 *  - List text / card description         → variant="body-sm"
 *  - Nav link / sidebar item               → variant="label-lg" | "label-sm"
 *  - Badge / eyebrow / kicker              → variant="overline"
 *  - Breadcrumb                           → variant="breadcrumb"
 *  - Timestamp, caption, footnote          → variant="caption"
 *  - Inline code snippet                   → variant="code"
 */

const textVariants = cva("", {
  variants: {
    variant: {
      "display-lg": "text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl",
      "display-md": "text-4xl font-bold tracking-tight sm:text-5xl",
      "heading-xl": "text-3xl font-bold tracking-tight sm:text-4xl",
      "heading-lg": "text-2xl font-semibold tracking-tight",
      "heading-md": "text-xl font-semibold tracking-tight",
      "heading-sm": "text-lg font-semibold tracking-tight",
      "body-lg": "text-lg leading-relaxed",
      "body-md": "text-base leading-relaxed",
      "body-sm": "text-sm leading-relaxed",
      "label-lg": "text-sm font-medium leading-none",
      "label-sm": "text-xs font-medium leading-none",
      overline: "text-xs font-semibold uppercase tracking-wider",
      breadcrumb: "text-sm font-medium leading-none",
      caption: "text-xs leading-normal",
      code: "font-mono text-sm",
    },
    tone: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      accent: "text-accent-foreground",
      primary: "text-primary",
      destructive: "text-destructive",
      inverted: "text-background",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    },
    align: {
      left: "text-left",
      center: "text-center",
      right: "text-right",
    },
    truncate: {
      true: "truncate",
    },
  },
  defaultVariants: {
    variant: "body-md",
    tone: "default",
  },
});

type TextVariant = NonNullable<VariantProps<typeof textVariants>["variant"]>;

/**
 * Curated set of HTML tags this component is allowed to render as.
 * Intentionally NOT `keyof React.JSX.IntrinsicElements`: that type includes
 * every SVG tag too (e.g. "symbol"), which have incompatible event handler
 * signatures compared to standard HTML text elements and break TS prop
 * inference when used polymorphically.
 */
type TextElement =
  | "p"
  | "span"
  | "div"
  | "label"
  | "code"
  | "li"
  | "a"
  | "dt"
  | "dd"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6";

/** Default semantic HTML tag for each variant. Overridable via `as`. */
const defaultElements: Record<TextVariant, TextElement> = {
  "display-lg": "h1",
  "display-md": "h1",
  "heading-xl": "h1",
  "heading-lg": "h2",
  "heading-md": "h3",
  "heading-sm": "h4",
  "body-lg": "p",
  "body-md": "p",
  "body-sm": "p",
  "label-lg": "span",
  "label-sm": "span",
  overline: "span",
  breadcrumb: "span",
  caption: "span",
  code: "code",
};

type TextOwnProps = VariantProps<typeof textVariants> & {
  /** Overrides the variant's default HTML tag (e.g. render heading-lg as <h1>). */
  as?: TextElement;
  /** Merges props into the single child instead of rendering its own element (e.g. <Text asChild variant="label-lg"><Link>...) */
  asChild?: boolean;
  className?: string;
  ref?: React.Ref<HTMLElement>;
};

type TextProps = TextOwnProps &
  Omit<React.ComponentPropsWithoutRef<"p">, keyof TextOwnProps>;

export function Text({
  as,
  asChild = false,
  variant = "body-md",
  tone,
  weight,
  align,
  truncate,
  className,
  ref,
  ...props
}: TextProps) {
  // Typed as `React.ElementType` on purpose: this tells TS not to compute a
  // strict intersection of props/refs across every possible tag in
  // `TextElement` (which is what caused the ref type explosion). `ElementType`
  // is the escape hatch every polymorphic component (Radix, Chakra, etc.)
  // relies on for this exact case.
  const Component: React.ElementType = asChild
    ? Slot.Root
    : (as ?? defaultElements[variant ?? "body-md"]);

  return (
    <Component
      ref={ref}
      className={cn(
        textVariants({ variant, tone, weight, align, truncate }),
        className,
      )}
      {...props}
    />
  );
}
