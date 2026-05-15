import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock environment variables
process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

// Define sessionStorage globally for all tests
global.sessionStorage = mockSessionStorage as Storage;

// Also define it on window if available (jsdom environment)
if (typeof window !== "undefined") {
  Object.defineProperty(window, "sessionStorage", {
    value: mockSessionStorage,
    writable: true,
  });
}

// Export global test utilities
export { mockSessionStorage };
