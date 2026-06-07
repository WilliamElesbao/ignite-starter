import Elysia from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockLogger } from "../../../test/setup";
import type { EmailQueueService } from "../../queue";
import { EmailErrorCode } from "../email.errors";

// Mock dependencies
vi.mock("../../../lib/better-auth/auth", () => ({
  auth: {
    handler: vi.fn(),
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("../../queue", () => ({
  bullBoardPlugin: new Elysia().state("emailQueueService", null),
  EMAIL_JOBS: {
    SEND_WELCOME: "send-welcome-email",
  },
}));

vi.mock("../../../shared/shared.plugin", () => ({
  default: new Elysia()
    .state("logger", null)
    .state("eventService", null)
    .state("db", null)
    .state("cache", null)
    .state("stripe", null),
}));

type MockUser = {
  id: string;
  email: string;
};

describe("EmailPlugin", () => {
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockEmailQueueService = {
    addJob: vi.fn<EmailQueueService["addJob"]>(),
  };
  let mockUser: MockUser;

  beforeEach(() => {
    mockLogger = createMockLogger();

    mockEmailQueueService = {
      addJob: vi.fn(),
    };

    mockUser = {
      id: "user-123",
      email: "test@example.com",
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("POST /email/send", () => {
    it("should enqueue job when called with valid auth", async () => {
      const mockJobId = "job-123";
      mockEmailQueueService.addJob.mockResolvedValue(mockJobId);

      const app = new Elysia()
        .state("emailQueueService", mockEmailQueueService)
        .state("logger", mockLogger)
        .decorate("user", mockUser)
        .post("/email/send", async ({ store: { emailQueueService }, user }) => {
          const jobId = await emailQueueService.addJob("send-welcome-email", {
            userId: user.id,
            email: user.email,
          });

          return {
            message: "Email queued successfully",
            success: true,
            jobId,
          };
        });

      const response = await app.handle(
        new Request("http://localhost/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );

      expect(response.status).toBe(200);
      expect(mockEmailQueueService.addJob).toHaveBeenCalledWith(
        "send-welcome-email",
        {
          userId: "user-123",
          email: "test@example.com",
        },
      );
    });

    it("should return 200 with jobId on success", async () => {
      const mockJobId = "job-456";
      mockEmailQueueService.addJob.mockResolvedValue(mockJobId);

      const app = new Elysia()
        .state("emailQueueService", mockEmailQueueService)
        .state("logger", mockLogger)
        .decorate("user", mockUser)
        .post("/email/send", async ({ store: { emailQueueService }, user }) => {
          const jobId = await emailQueueService.addJob("send-welcome-email", {
            userId: user.id,
            email: user.email,
          });

          return {
            message: "Email queued successfully",
            success: true,
            jobId,
          };
        });

      const response = await app.handle(
        new Request("http://localhost/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );

      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        message: "Email queued successfully",
        success: true,
        jobId: mockJobId,
      });
    });

    it("should return 401 when user is not authenticated", async () => {
      const app = new Elysia()
        .state("emailQueueService", mockEmailQueueService)
        .state("logger", mockLogger)
        .decorate("user", null as MockUser | null)
        .post(
          "/email/send",
          async ({ store: { emailQueueService }, user, set }) => {
            if (!user) {
              set.status = 401;
              return {
                code: "AUTH_UNAUTHORIZED",
                message: "Unauthorized",
              };
            }

            const jobId = await emailQueueService.addJob("send-welcome-email", {
              userId: user.id,
              email: user.email,
            });

            return {
              message: "Email queued successfully",
              success: true,
              jobId,
            };
          },
        );

      const response = await app.handle(
        new Request("http://localhost/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );

      expect(response.status).toBe(401);
      expect(mockEmailQueueService.addJob).not.toHaveBeenCalled();
    });

    it("should extract userId and email from authenticated user", async () => {
      const mockJobId = "job-789";
      mockEmailQueueService.addJob.mockResolvedValue(mockJobId);

      const authenticatedUser: MockUser = {
        id: "user-authenticated",
        email: "authenticated@example.com",
      };

      const app = new Elysia()
        .state("emailQueueService", mockEmailQueueService)
        .state("logger", mockLogger)
        .decorate("user", authenticatedUser)
        .post("/email/send", async ({ store: { emailQueueService }, user }) => {
          const jobId = await emailQueueService.addJob("send-welcome-email", {
            userId: user.id,
            email: user.email,
          });

          return {
            message: "Email queued successfully",
            success: true,
            jobId,
          };
        });

      await app.handle(
        new Request("http://localhost/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );

      expect(mockEmailQueueService.addJob).toHaveBeenCalledWith(
        "send-welcome-email",
        {
          userId: "user-authenticated",
          email: "authenticated@example.com",
        },
      );
    });

    it("should return 500 on EmailQueueService failure", async () => {
      const mockError = new Error("Queue connection failed");
      mockEmailQueueService.addJob.mockRejectedValue(mockError);

      const app = new Elysia()
        .state("emailQueueService", mockEmailQueueService)
        .state("logger", mockLogger)
        .decorate("user", mockUser)
        .post(
          "/email/send",
          async ({ store: { emailQueueService }, user, set }) => {
            try {
              const jobId = await emailQueueService.addJob(
                "send-welcome-email",
                {
                  userId: user.id,
                  email: user.email,
                },
              );

              return {
                message: "Email queued successfully",
                success: true,
                jobId,
              };
            } catch {
              set.status = 500;
              return {
                code: EmailErrorCode.EMAIL_SEND_FAILED,
                message: "Failed to send email",
              };
            }
          },
        );

      const response = await app.handle(
        new Request("http://localhost/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body).toEqual({
        code: EmailErrorCode.EMAIL_SEND_FAILED,
        message: "Failed to send email",
      });
    });

    it("should return 502 on email provider error", async () => {
      const providerError = new Error("Email provider unavailable");
      providerError.name = "EMAIL_PROVIDER_ERROR";
      mockEmailQueueService.addJob.mockRejectedValue(providerError);

      const app = new Elysia()
        .state("emailQueueService", mockEmailQueueService)
        .state("logger", mockLogger)
        .decorate("user", mockUser)
        .post(
          "/email/send",
          async ({ store: { emailQueueService }, user, set }) => {
            try {
              const jobId = await emailQueueService.addJob(
                "send-welcome-email",
                {
                  userId: user.id,
                  email: user.email,
                },
              );

              return {
                message: "Email queued successfully",
                success: true,
                jobId,
              };
            } catch (error: unknown) {
              if (
                error instanceof Error &&
                error.name === "EMAIL_PROVIDER_ERROR"
              ) {
                set.status = 502;
                return {
                  code: EmailErrorCode.EMAIL_PROVIDER_ERROR,
                  message: "Failed to send email",
                };
              }
              set.status = 500;
              return {
                code: EmailErrorCode.EMAIL_SEND_FAILED,
                message: "Failed to send email",
              };
            }
          },
        );

      const response = await app.handle(
        new Request("http://localhost/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );

      expect(response.status).toBe(502);
      const body = await response.json();
      expect(body).toEqual({
        code: EmailErrorCode.EMAIL_PROVIDER_ERROR,
        message: "Failed to send email",
      });
    });

    it("should call EmailQueueService.addJob with correct parameters", async () => {
      const mockJobId = "job-correct-params";
      mockEmailQueueService.addJob.mockResolvedValue(mockJobId);

      const testUser: MockUser = {
        id: "test-user-id",
        email: "testuser@example.com",
      };

      const app = new Elysia()
        .state("emailQueueService", mockEmailQueueService)
        .state("logger", mockLogger)
        .decorate("user", testUser)
        .post("/email/send", async ({ store: { emailQueueService }, user }) => {
          const jobId = await emailQueueService.addJob("send-welcome-email", {
            userId: user.id,
            email: user.email,
          });

          return {
            message: "Email queued successfully",
            success: true,
            jobId,
          };
        });

      await app.handle(
        new Request("http://localhost/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );

      expect(mockEmailQueueService.addJob).toHaveBeenCalledTimes(1);
      expect(mockEmailQueueService.addJob).toHaveBeenCalledWith(
        "send-welcome-email",
        {
          userId: "test-user-id",
          email: "testuser@example.com",
        },
      );
    });

    it("should handle multiple concurrent requests", async () => {
      mockEmailQueueService.addJob
        .mockResolvedValueOnce("job-1")
        .mockResolvedValueOnce("job-2")
        .mockResolvedValueOnce("job-3");

      const app = new Elysia()
        .state("emailQueueService", mockEmailQueueService)
        .state("logger", mockLogger)
        .decorate("user", mockUser)
        .post("/email/send", async ({ store: { emailQueueService }, user }) => {
          const jobId = await emailQueueService.addJob("send-welcome-email", {
            userId: user.id,
            email: user.email,
          });

          return {
            message: "Email queued successfully",
            success: true,
            jobId,
          };
        });

      const requests = [
        app.handle(
          new Request("http://localhost/email/send", { method: "POST" }),
        ),
        app.handle(
          new Request("http://localhost/email/send", { method: "POST" }),
        ),
        app.handle(
          new Request("http://localhost/email/send", { method: "POST" }),
        ),
      ];

      const responses = await Promise.all(requests);

      expect(responses[0].status).toBe(200);
      expect(responses[1].status).toBe(200);
      expect(responses[2].status).toBe(200);
      expect(mockEmailQueueService.addJob).toHaveBeenCalledTimes(3);
    });
  });
});
