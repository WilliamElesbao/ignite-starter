/**
 * Welcome Email Template
 *
 * A React Email template for welcoming new users.
 * Uses Tailwind CSS with pixel-based preset for email client compatibility.
 *
 * @see https://react.email/docs/introduction
 */

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Tailwind,
  Text,
} from "react-email";

/**
 * Props for the Welcome Email
 */
interface WelcomeEmailProps {
  /** Recipient's name for personalization */
  name: string;
  /** URL for the primary call-to-action button */
  actionUrl?: string;
}

/**
 * Welcome Email Component
 *
 * Features:
 * - Responsive design with Container component
 * - Tailwind CSS for styling (pixel-based for email compatibility)
 * - Preview text for inbox snippets
 * - Clear call-to-action button
 */
export function WelcomeEmail({ name, actionUrl }: Readonly<WelcomeEmailProps>) {
  return (
    <Html lang="en">
      <Head />
      {/* Preview text appears in email inbox list */}
      <Preview>Nice! You just set up Ignite Starter.</Preview>

      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto py-12 px-4 max-w-xl">
            {/* Logo/Brand area */}
            <Text className="text-2xl font-bold text-black">
              Ignite Starter
            </Text>

            {/* Main heading */}
            <Heading className="text-2xl font-bold text-gray-900 mt-8">
              Nice setup, {name}! Welcome to Ignite Starter 🚀
            </Heading>

            {/* Body content */}
            <Text className="text-base text-gray-700 leading-6">
              You just finished configuring your starter project, and
              you&apos;re ready to build fast.
            </Text>

            <Text className="text-base text-gray-700 leading-6">
              Ignite Starter gives you a solid monorepo foundation so you can
              focus on shipping features instead of wiring everything from
              scratch.
            </Text>

            <Text className="text-base text-gray-700 leading-6">
              Open your dashboard to start your next project.
            </Text>

            {/* Call-to-action button */}
            <Button
              href={actionUrl}
              className="bg-black text-white px-6 py-3 rounded-md font-medium mt-4 inline-block box-border"
            >
              Launch Dashboard
            </Button>

            <Hr className="border-gray-200 my-8" />

            {/* Footer */}
            <Text className="text-sm text-gray-500">
              If you didn&apos;t set up Ignite Starter, you can safely ignore
              this email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

/**
 * Preview props for React Email dev server
 * Run `pnpm email:dev` to preview this template
 */
WelcomeEmail.PreviewProps = {
  name: "John Doe",
  actionUrl: "https://example.com",
} satisfies WelcomeEmailProps;

export default WelcomeEmail;
