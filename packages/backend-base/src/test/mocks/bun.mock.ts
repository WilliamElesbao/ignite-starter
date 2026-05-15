/**
 * Mock for Bun-specific functions used in tests
 * This allows Vitest to run tests that import Bun modules
 */

import { randomUUID } from "node:crypto";

/**
 * Mock implementation of Bun's randomUUIDv7
 * Uses Node's crypto.randomUUID() as a fallback
 */
export function randomUUIDv7(): string {
  return randomUUID();
}

/**
 * Mock Bun.password for tests
 */
export const password = {
  hash: async (pwd: string): Promise<string> => {
    return `hashed_${pwd}`;
  },
  verify: async (pwd: string, hash: string): Promise<boolean> => {
    return hash === `hashed_${pwd}`;
  },
};

// Export default Bun object
export default {
  randomUUIDv7,
  password,
  env: process.env,
};
