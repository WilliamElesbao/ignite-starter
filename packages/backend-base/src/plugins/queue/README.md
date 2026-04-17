# Email Queue with BullMQ

Simple and objective implementation of email queue using BullMQ.

## Architecture

```
┌─────────────┐
│  API Server │
│             │
│ POST /email │──┐
│    /send    │  │
└─────────────┘  │
                 │ Enqueue
                 ▼
            ┌────────┐
            │ Redis  │
            │ Queue  │
            └────────┘
                 │
                 │ Process
                 ▼
         ┌──────────────┐
         │ Email Worker │
         │              │
         │ Send Emails  │
         └──────────────┘
```

## Components

### 1. Configuration (`email-queue.config.ts`)
- Queue name: `"email"`
- Job types: `SEND_WELCOME`
- Redis connection settings
- Default job options (retries, backoff, cleanup)

### 2. Service (`email-queue.service.ts`)
- `EmailQueueService` - Adds jobs to the queue
- Used by API endpoints to enqueue emails

### 3. Worker (`email-queue.worker.ts`)
- `EmailQueueWorker` - Processes jobs from the queue
- Uses `EmailService` to send actual emails
- Handles job execution and error handling
- Can run in API process or standalone

### 4. Bull Board (`bull-board.plugin.ts`)
- Web UI to monitor the queue
- Access: `http://localhost:3333/admin/queues`
- View jobs, retry failed jobs, inspect payloads

## Usage

### Start API with Worker (Development)

```bash
cd apps/backend
bun dev
```

The worker starts automatically with the API.

### Start Standalone Worker (Production)

```bash
# Terminal 1: API only (comment out worker.start() in index.ts)
cd apps/backend
bun dev

# Terminal 2: Worker process
cd apps/backend
bun run worker:email
```

### Enqueue an Email

```bash
curl -X POST http://localhost:3333/email/send
```

Response:
```json
{
  "message": "Email queued successfully",
  "success": true,
  "jobId": "1"
}
```

### Monitor Queue

Open in browser:
```
http://localhost:3333/admin/queues
```

## Configuration

### Redis Connection

Set in `.env`:
```
REDIS_URL=redis://:abcd1234@localhost:6379
```

### Job Options

Edit `email-queue.config.ts`:
```typescript
export const EMAIL_JOB_OPTIONS = {
  attempts: 5,              // Retry up to 5 times
  backoff: {
    type: "exponential",    // Exponential backoff
    delay: 1000,            // Start with 1 second
  },
  removeOnComplete: {
    age: 86400,             // Keep completed jobs for 24 hours
    count: 1000,            // Keep last 1000 completed jobs
  },
  removeOnFail: {
    age: 604800,            // Keep failed jobs for 7 days
  },
};
```

### Worker Concurrency

Edit `email-queue.worker.ts`:
```typescript
{
  concurrency: 5,  // Process 5 jobs simultaneously
}
```

## Adding New Job Types

1. Add job type to `email-queue.config.ts`:
```typescript
export const EMAIL_JOBS = {
  SEND_WELCOME: "send-welcome-email",
  SEND_RESET_PASSWORD: "send-reset-password", // New
} as const;
```

2. Add handler in `email-queue.worker.ts`:
```typescript
private async processJob(job: Job): Promise<void> {
  switch (job.name) {
    case EMAIL_JOBS.SEND_WELCOME:
      await this.sendWelcomeEmail(job.data);
      break;
    case EMAIL_JOBS.SEND_RESET_PASSWORD:
      await this.sendResetPasswordEmail(job.data); // New
      break;
  }
}

private async sendResetPasswordEmail(data: any): Promise<void> {
  // Implementation
}
```

3. Use in your code:
```typescript
await emailQueueService.addJob(EMAIL_JOBS.SEND_RESET_PASSWORD, {
  email: "user@example.com",
  resetToken: "abc123",
});
```

## Production Deployment

### Disable Worker in API Process

Comment out in `apps/backend/src/index.ts`:
```typescript
// const emailWorker = new EmailQueueWorker(logger);
// await emailWorker.start();
```

### Run Worker as Separate Process

```bash
bun run worker:email
```

### Docker Compose Example

```yaml
services:
  api:
    command: bun run apps/backend/src/index.ts
    replicas: 3

  email-worker:
    command: bun run packages/backend-base/src/workers/email.worker.ts
    replicas: 2
```

## Monitoring

### Bull Board UI
- URL: `http://localhost:3333/admin/queues`
- View waiting, active, completed, failed jobs
- Retry failed jobs manually
- Inspect job payloads and errors

### Logs
- Worker logs all job processing
- Check logs for errors and performance

## Troubleshooting

### Jobs Not Processing

1. Check Redis connection:
```bash
redis-cli ping
```

2. Check worker is running:
```bash
# Should see "Email worker started" in logs
```

3. Check Bull Board UI for job status

### High Queue Depth

1. Scale workers:
```bash
# Run multiple worker processes
bun run worker:email &
bun run worker:email &
```

2. Increase concurrency in worker configuration

### Failed Jobs

1. Check Bull Board UI for error details
2. Check worker logs
3. Retry manually from Bull Board UI
