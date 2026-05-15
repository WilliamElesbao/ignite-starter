/**
 * Mock for @repo/database environment variables used in tests
 * This avoids Zod validation issues in CI environments
 */

export const env = {
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test',
};
