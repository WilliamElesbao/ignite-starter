import Elysia from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EVENT_TYPE, type EventService } from "../../../services/event.service";
import { createMockLogger } from "../../../test/setup";
import { AuthErrorCode } from "../auth.errors";

// Mock BetterAuth
const mockGetSession = vi.fn();
vi.mock("../../../lib/better-auth/auth", () => ({
  auth: {
    handler: vi.fn(),
    api: {
      getSession: mockGetSession,
    },
  },
}));

// Mock shared plugin
vi.mock("../../../shared/shared.plugin", () => ({
  default: new Elysia()
    .state("logger", null)
    .state("eventService", null)
    .state("db", null)
    .state("cache", null)
    .state("stripe", null),
}));

describe("AuthPlugin", () => {
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockEventService = {
    createEvent: vi.fn<EventService["createEvent"]>(),
  };

  beforeEach(() => {
    mockLogger = createMockLogger();
    mockEventService = {
      createEvent: vi.fn().mockResolvedValue(undefined),
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("auth macro - valid session", () => {
    it("should resolve successfully with valid session", async () => {
      const mockSession = {
        user: {
          id: "user-123",
          email: "test@example.com",
        },
        session: {
          id: "session-123",
          expiresAt: new Date(Date.now() + 86400000),
        },
      };

      mockGetSession.mockResolvedValue(mockSession);

      const app = new Elysia()
        .state("logger", mockLogger)
        .state("eventService", mockEventService)
        .get("/protected", async ({ request }) => {
          const session = await mockGetSession({ headers: request.headers });

          if (!session) {
            return { error: "Unauthorized" };
          }

          return { message: "Protected resource", user: session.user };
        });

      const response = await app.handle(
        new Request("http://localhost/protected", {
          method: "GET",
          headers: {
            Authorization: "Bearer valid-token",
          },
        }),
      );

      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        message: "Protected resource",
        user: {
          id: "user-123",
          email: "test@example.com",
        },
      });
      expect(mockGetSession).toHaveBeenCalledWith({
        headers: expect.any(Headers),
      });
    });

    it("should not log warning on successful authentication", async () => {
      const mockSession = {
        user: {
          id: "user-456",
          email: "valid@example.com",
        },
        session: {
          id: "session-456",
          expiresAt: new Date(Date.now() + 86400000),
        },
      };

      mockGetSession.mockResolvedValue(mockSession);

      const app = new Elysia()
        .state("logger", mockLogger)
        .state("eventService", mockEventService)
        .get("/protected", async ({ request }) => {
          const session = await mockGetSession({ headers: request.headers });

          if (!session) {
            return { error: "Unauthorized" };
          }

          return { message: "Success" };
        });

      await app.handle(
        new Request("http://localhost/protected", {
          method: "GET",
          headers: {
            Authorization: "Bearer valid-token",
          },
        }),
      );

      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });
  });

  describe("auth macro - missing session", () => {
    it("should return 401 Unauthorized when session is missing", async () => {
      mockGetSession.mockResolvedValue(null);

      const app = new Elysia()
        .state("logger", mockLogger)
        .state("eventService", mockEventService)
        .get("/protected", async ({ request, set }) => {
          const session = await mockGetSession({ headers: request.headers });

          if (!session) {
            mockLogger.warn({
              msg: "Unauthorized request in auth macro",
              path: request.url,
              method: request.method,
            });

            set.status = 401;
            return {
              code: AuthErrorCode.AUTH_UNAUTHORIZED,
              message: "Unauthorized",
            };
          }

          return { message: "Protected resource" };
        });

      const response = await app.handle(
        new Request("http://localhost/protected", {
          method: "GET",
        }),
      );

      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body).toEqual({
        code: AuthErrorCode.AUTH_UNAUTHORIZED,
        message: "Unauthorized",
      });
    });

    it("should log warning on unauthorized request", async () => {
      mockGetSession.mockResolvedValue(null);

      const app = new Elysia()
        .state("logger", mockLogger)
        .state("eventService", mockEventService)
        .get("/protected", async ({ request, set }) => {
          const session = await mockGetSession({ headers: request.headers });

          if (!session) {
            mockLogger.warn({
              msg: "Unauthorized request in auth macro",
              path: request.url,
              method: request.method,
            });

            set.status = 401;
            return {
              code: AuthErrorCode.AUTH_UNAUTHORIZED,
              message: "Unauthorized",
            };
          }

          return { message: "Protected resource" };
        });

      await app.handle(
        new Request("http://localhost/protected", {
          method: "GET",
        }),
      );

      expect(mockLogger.warn).toHaveBeenCalledWith({
        msg: "Unauthorized request in auth macro",
        path: "http://localhost/protected",
        method: "GET",
      });
    });

    it("should not create LOGIN_SUSPICIOUS event on missing session", async () => {
      mockGetSession.mockResolvedValue(null);

      const app = new Elysia()
        .state("logger", mockLogger)
        .state("eventService", mockEventService)
        .get("/protected", async ({ request, set }) => {
          const session = await mockGetSession({ headers: request.headers });

          if (!session) {
            mockLogger.warn({
              msg: "Unauthorized request in auth macro",
              path: request.url,
              method: request.method,
            });

            set.status = 401;
            return {
              code: AuthErrorCode.AUTH_UNAUTHORIZED,
              message: "Unauthorized",
            };
          }

          return { message: "Protected resource" };
        });

      await app.handle(
        new Request("http://localhost/protected", {
          method: "GET",
        }),
      );

      // LOGIN_SUSPICIOUS should only be created on session resolution failure, not missing session
      expect(mockEventService.createEvent).not.toHaveBeenCalled();
    });
  });

  describe("auth macro - session resolution failure", () => {
    it("should return 503 on session resolution failure", async () => {
      const mockError = new Error("Database connection failed");
      mockGetSession.mockRejectedValue(mockError);

      const app = new Elysia()
        .state("logger", mockLogger)
        .state("eventService", mockEventService)
        .get("/protected", async ({ request, set }) => {
          try {
            const session = await mockGetSession({ headers: request.headers });

            if (!session) {
              set.status = 401;
              return {
                code: AuthErrorCode.AUTH_UNAUTHORIZED,
                message: "Unauthorized",
              };
            }

            return { message: "Protected resource" };
          } catch (error) {
            mockLogger.error({
              msg: "Failed to resolve auth session",
              path: request.url,
              method: request.method,
              error,
            });

            await mockEventService.createEvent({
              type: EVENT_TYPE.LOGIN_SUSPICIOUS,
              payload: {
                path: request.url,
                method: request.method,
                reason: "AUTH_SESSION_RESOLVE_FAILED",
              },
            });

            set.status = 503;
            return {
              code: AuthErrorCode.AUTH_SESSION_RESOLVE_FAILED,
              message: "Failed to validate session",
            };
          }
        });

      const response = await app.handle(
        new Request("http://localhost/protected", {
          method: "GET",
        }),
      );

      const body = await response.json();

      expect(response.status).toBe(503);
      expect(body).toEqual({
        code: AuthErrorCode.AUTH_SESSION_RESOLVE_FAILED,
        message: "Failed to validate session",
      });
    });

    it("should log error on session resolution failure", async () => {
      const mockError = new Error("Redis connection timeout");
      mockGetSession.mockRejectedValue(mockError);

      const app = new Elysia()
        .state("logger", mockLogger)
        .state("eventService", mockEventService)
        .get("/protected", async ({ request, set }) => {
          try {
            const session = await mockGetSession({ headers: request.headers });

            if (!session) {
              set.status = 401;
              return {
                code: AuthErrorCode.AUTH_UNAUTHORIZED,
                message: "Unauthorized",
              };
            }

            return { message: "Protected resource" };
          } catch (error) {
            mockLogger.error({
              msg: "Failed to resolve auth session",
              path: request.url,
              method: request.method,
              error,
            });

            await mockEventService.createEvent({
              type: EVENT_TYPE.LOGIN_SUSPICIOUS,
              payload: {
                path: request.url,
                method: request.method,
                reason: "AUTH_SESSION_RESOLVE_FAILED",
              },
            });

            set.status = 503;
            return {
              code: AuthErrorCode.AUTH_SESSION_RESOLVE_FAILED,
              message: "Failed to validate session",
            };
          }
        });

      await app.handle(
        new Request("http://localhost/protected", {
          method: "GET",
        }),
      );

      expect(mockLogger.error).toHaveBeenCalledWith({
        msg: "Failed to resolve auth session",
        path: "http://localhost/protected",
        method: "GET",
        error: mockError,
      });
    });

    it("should create LOGIN_SUSPICIOUS event on failure", async () => {
      const mockError = new Error("Session validation failed");
      mockGetSession.mockRejectedValue(mockError);

      const app = new Elysia()
        .state("logger", mockLogger)
        .state("eventService", mockEventService)
        .get("/protected", async ({ request, set }) => {
          try {
            const session = await mockGetSession({ headers: request.headers });

            if (!session) {
              set.status = 401;
              return {
                code: AuthErrorCode.AUTH_UNAUTHORIZED,
                message: "Unauthorized",
              };
            }

            return { message: "Protected resource" };
          } catch (error) {
            mockLogger.error({
              msg: "Failed to resolve auth session",
              path: request.url,
              method: request.method,
              error,
            });

            await mockEventService.createEvent({
              type: EVENT_TYPE.LOGIN_SUSPICIOUS,
              payload: {
                path: request.url,
                method: request.method,
                reason: "AUTH_SESSION_RESOLVE_FAILED",
              },
            });

            set.status = 503;
            return {
              code: AuthErrorCode.AUTH_SESSION_RESOLVE_FAILED,
              message: "Failed to validate session",
            };
          }
        });

      await app.handle(
        new Request("http://localhost/protected", {
          method: "GET",
        }),
      );

      expect(mockEventService.createEvent).toHaveBeenCalledWith({
        type: EVENT_TYPE.LOGIN_SUSPICIOUS,
        payload: {
          path: "http://localhost/protected",
          method: "GET",
          reason: "AUTH_SESSION_RESOLVE_FAILED",
        },
      });
    });

    it("should handle different types of session resolution errors", async () => {
      const errors = [
        new Error("Network timeout"),
        new Error("Invalid token format"),
        new Error("Token expired"),
      ];

      for (const error of errors) {
        vi.clearAllMocks();
        mockGetSession.mockRejectedValue(error);

        const app = new Elysia()
          .state("logger", mockLogger)
          .state("eventService", mockEventService)
          .get("/protected", async ({ request, set }) => {
            try {
              const session = await mockGetSession({
                headers: request.headers,
              });

              if (!session) {
                set.status = 401;
                return {
                  code: AuthErrorCode.AUTH_UNAUTHORIZED,
                  message: "Unauthorized",
                };
              }

              return { message: "Protected resource" };
            } catch (error) {
              mockLogger.error({
                msg: "Failed to resolve auth session",
                path: request.url,
                method: request.method,
                error,
              });

              await mockEventService.createEvent({
                type: EVENT_TYPE.LOGIN_SUSPICIOUS,
                payload: {
                  path: request.url,
                  method: request.method,
                  reason: "AUTH_SESSION_RESOLVE_FAILED",
                },
              });

              set.status = 503;
              return {
                code: AuthErrorCode.AUTH_SESSION_RESOLVE_FAILED,
                message: "Failed to validate session",
              };
            }
          });

        const response = await app.handle(
          new Request("http://localhost/protected", {
            method: "GET",
          }),
        );

        expect(response.status).toBe(503);
        expect(mockLogger.error).toHaveBeenCalledWith(
          expect.objectContaining({
            msg: "Failed to resolve auth session",
            error,
          }),
        );
        expect(mockEventService.createEvent).toHaveBeenCalledWith({
          type: EVENT_TYPE.LOGIN_SUSPICIOUS,
          payload: expect.objectContaining({
            reason: "AUTH_SESSION_RESOLVE_FAILED",
          }),
        });
      }
    });
  });

  describe("auth macro - edge cases", () => {
    it("should handle requests with different HTTP methods", async () => {
      const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];

      for (const method of methods) {
        vi.clearAllMocks();
        mockGetSession.mockResolvedValue(null);

        const app = new Elysia()
          .state("logger", mockLogger)
          .state("eventService", mockEventService)
          .all("/protected", async ({ request, set }) => {
            const session = await mockGetSession({ headers: request.headers });

            if (!session) {
              mockLogger.warn({
                msg: "Unauthorized request in auth macro",
                path: request.url,
                method: request.method,
              });

              set.status = 401;
              return {
                code: AuthErrorCode.AUTH_UNAUTHORIZED,
                message: "Unauthorized",
              };
            }

            return { message: "Protected resource" };
          });

        await app.handle(
          new Request("http://localhost/protected", {
            method,
          }),
        );

        expect(mockLogger.warn).toHaveBeenCalledWith(
          expect.objectContaining({
            method,
          }),
        );
      }
    });

    it("should handle requests with different paths", async () => {
      const paths = ["/api/users", "/api/posts", "/api/comments"];

      for (const path of paths) {
        vi.clearAllMocks();
        mockGetSession.mockResolvedValue(null);

        const app = new Elysia()
          .state("logger", mockLogger)
          .state("eventService", mockEventService)
          .get(path, async ({ request, set }) => {
            const session = await mockGetSession({ headers: request.headers });

            if (!session) {
              mockLogger.warn({
                msg: "Unauthorized request in auth macro",
                path: request.url,
                method: request.method,
              });

              set.status = 401;
              return {
                code: AuthErrorCode.AUTH_UNAUTHORIZED,
                message: "Unauthorized",
              };
            }

            return { message: "Protected resource" };
          });

        await app.handle(
          new Request(`http://localhost${path}`, {
            method: "GET",
          }),
        );

        expect(mockLogger.warn).toHaveBeenCalledWith(
          expect.objectContaining({
            path: `http://localhost${path}`,
          }),
        );
      }
    });

    it("should handle session with missing user data", async () => {
      const incompleteSession = {
        session: {
          id: "session-incomplete",
          expiresAt: new Date(Date.now() + 86400000),
        },
        // Missing user object
      };

      mockGetSession.mockResolvedValue(incompleteSession);

      const app = new Elysia()
        .state("logger", mockLogger)
        .state("eventService", mockEventService)
        .get("/protected", async ({ request }) => {
          const session = await mockGetSession({ headers: request.headers });

          if (!session?.user) {
            return { error: "Invalid session" };
          }

          return { message: "Protected resource", user: session.user };
        });

      const response = await app.handle(
        new Request("http://localhost/protected", {
          method: "GET",
        }),
      );

      const body = await response.json();

      expect(body).toEqual({ error: "Invalid session" });
    });
  });
});
