/**
 * Mock for environment variables used in tests
 * This avoids Zod validation issues in CI environments
 */

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  WEB_URL: process.env.WEB_URL || 'http://localhost:3000',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'test-google-client-id',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'test-google-client-secret',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_mock',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_mock',
  RESEND_API_KEY: process.env.RESEND_API_KEY || 're_test_mock_api_key',
  EMAIL_FROM: process.env.EMAIL_FROM || 'test@example.com',
  EMAIL_TO: process.env.EMAIL_TO || 'recipient@example.com',
};
