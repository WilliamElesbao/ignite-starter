# Email Templates

React Email transactional email templates for the Ignite Starter project. This package contains reusable email components that can be previewed during development without sending real emails.

## Overview

This package provides:
- React Email components for transactional emails
- Live preview server for development
- Integration with Resend for email delivery
- Used by the backend email service and queue

## Getting Started

### Install Dependencies

```bash
bun install
```

### Development Server

Run the preview server to see email templates in your browser:

```bash
bun dev
```

Open [http://localhost:3001](http://localhost:3001) to view the email templates.

## Email Templates

The package includes templates for:

- Welcome emails
- Password reset emails
- Notification emails
- Subscription-related emails

## Usage

Email templates are used by the backend email service:

```typescript
import { WelcomeEmail } from "@repo/emails";

const emailHtml = await WelcomeEmail({ userName: "John" });
```

The backend email service (`packages/backend-base/src/plugins/email/`) uses these templates and sends them via Resend or queues them for asynchronous processing via BullMQ.

## Integration

This package is consumed by:
- `packages/backend-base` - Email service uses templates to generate email HTML
- BullMQ worker - Processes email jobs using these templates

## Configuration

Email delivery is configured via Resend API key in the backend environment:
- `RESEND_API_KEY` - Resend API key for sending emails
- `EMAIL_FROM` - Sender email address
- `EMAIL_TO` - Default recipient (for testing)

## License

MIT License
