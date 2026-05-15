import Elysia from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../../shared/errors/app-error";
import { createMockLogger } from "../../../test/setup";
import { AuthErrorCode } from "../../auth/auth.errors";
import { EMAIL_ERROR_MAP, EmailErrorCode } from "../email.errors";
import emailPlugin from "../email.plugin";

// Mock dependencies
const { mockGetSession } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
}));
vi.mock("../../../lib/better-auth/auth", () => ({
  auth: {
    handler: vi.fn(),
    api: {
      getSession: mockGetSession,
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
  let mockEventService: {
    createEvent: ReturnType<typeof vi.fn>;
  };
  let mockEmailQueueService: {
    addJob: ReturnType<typeof vi.fn>;
  };
  let mockUser: MockUser;

  beforeEach(() => {
    mockLogger = createMockLogger();
    mockEventService = {
      createEvent: vi.fn().mockResolvedValue(undefined),
    };

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
    vi.clearAllMocks();
  });

  describe("POST /email/send", () => {
    it("should enqueue job when called with valid auth", async () => {
      const mockJobId = "job-123";
      mockEmailQueueService.addJob.mockResolvedValue(mockJobId);
      mockGetSession.mockResolvedValue({
        user: {
          id: "user-123",
          email: "test@example.com",
        },
        session: {
          id: "session-123",
          expiresAt: new Date(Date.now() + 86400000),
        },
      });

      const app = new Elysia()
        .use(emailPlugin)
        .state("emailQueueService", mockEmailQueueService)
        .state("logger", mockLogger)
        .state("eventService", mockEventService);

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
      mockGetSession.mockResolvedValue({
        user: {
          id: "user-123",
          email: "test@example.com",
        },
        session: {
          id: "session-456",
          expiresAt: new Date(Date.now() + 86400000),
        },
      });

      const app = new Elysia()
        .use(emailPlugin)
        .state("emailQueueService", mockEmailQueueService)
        .state("logger", mockLogger)
        .state("eventService", mockEventService);

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
      mockGetSession.mockResolvedValue(null);

      const app = new Elysia()
        .use(emailPlugin)
        .state("emailQueueService", mockEmailQueueService)
        .state("logger", mockLogger)
        .state("eventService", mockEventService);

      const response = await app.handle(
        new Request("http://localhost/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({
        code: AuthErrorCode.AUTH_UNAUTHORIZED,
        message: "Unauthorized",
      });
      expect(mockEmailQueueService.addJob).not.toHaveBeenCalled();
    });

    it("should extract userId and email from authenticated user", async () => {
      const mockJobId = "job-789";
      mockEmailQueueService.addJob.mockResolvedValue(mockJobId);

      const authenticatedUser: MockUser = {
        id: "user-authenticated",
        email: "authenticated@example.com",
      };
      mockGetSession.mockResolvedValue({
        user: authenticatedUser,
        session: {
          id: "session-789",
          expiresAt: new Date(Date.now() + 86400000),
        },
      });

      const app = new Elysia()
        .use(emailPlugin)
        .state("emailQueueService", mockEmailQueueService)
        .state("logger", mockLogger)
        .state("eventService", mockEventService);

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
      mockGetSession.mockResolvedValue({
        user: mockUser,
        session: {
          id: "session-500",
          expiresAt: new Date(Date.now() + 86400000),
        },
      });

      const app = new Elysia()
        .use(emailPlugin)
        .state("emailQueueService", mockEmailQueueService)
        .state("logger", mockLogger)
        .state("eventService", mockEventService);

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
      const providerError = AppError.fromCatalog({
        code: EmailErrorCode.EMAIL_PROVIDER_ERROR,
        catalog: EMAIL_ERROR_MAP,
      });
      mockEmailQueueService.addJob.mockRejectedValue(providerError);
      mockGetSession.mockResolvedValue({
        user: mockUser,
        session: {
          id: "session-502",
          expiresAt: new Date(Date.now() + 86400000),
        },
      });

      const app = new Elysia()
        .use(emailPlugin)
        .state("emailQueueService", mockEmailQueueService)
        .state("logger", mockLogger)
        .state("eventService", mockEventService);

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
      mockGetSession.mockResolvedValue({
        user: testUser,
        session: {
          id: "session-params",
          expiresAt: new Date(Date.now() + 86400000),
        },
      });

      const app = new Elysia()
        .use(emailPlugin)
        .state("emailQueueService", mockEmailQueueService)
        .state("logger", mockLogger)
        .state("eventService", mockEventService);

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
      mockGetSession.mockResolvedValue({
        user: mockUser,
        session: {
          id: "session-concurrent",
          expiresAt: new Date(Date.now() + 86400000),
        },
      });

      const app = new Elysia()
        .use(emailPlugin)
        .state("emailQueueService", mockEmailQueueService)
        .state("logger", mockLogger)
        .state("eventService", mockEventService);

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
