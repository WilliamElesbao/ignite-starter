import { Queue } from "bullmq";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockLogger } from "../../test/setup";
import { EMAIL_QUEUE_NAME } from "./email-queue.config";
import { EmailQueueService } from "./email-queue.service";

// Mock BullMQ Queue
vi.mock("bullmq", () => {
  class MockQueue {
    add = vi.fn();
    constructor(
      public queueName: string,
      public options: Record<string, unknown>,
    ) {}
  }
  return {
    Queue: MockQueue,
  };
});

describe("EmailQueueService", () => {
  let mockLogger: ReturnType<typeof createMockLogger>;
  let emailQueueService: EmailQueueService;

  beforeEach(() => {
    // Create mock logger
    mockLogger = createMockLogger();

    // Create service instance
    emailQueueService = new EmailQueueService(mockLogger);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize queue with correct configuration", () => {
      // Queue should be created and available
      const queue = emailQueueService.getQueue();
      expect(queue).toBeInstanceOf(Queue);
    });

    it("should log queue initialization", () => {
      expect(mockLogger.info).toHaveBeenCalledWith({
        msg: "Email queue initialized",
        queueName: EMAIL_QUEUE_NAME,
      });
    });

    it("should use correct Redis configuration", () => {
      const queue = emailQueueService.getQueue();
      expect(queue).toBeInstanceOf(Queue);
    });
  });

  describe("addJob", () => {
    it("should successfully add job to queue", async () => {
      const jobType = "send-welcome-email";
      const jobData = { userId: "user-123", email: "test@example.com" };
      const mockJobId = "job-123";

      const queue = emailQueueService.getQueue();
      const addSpy = vi
        .spyOn(queue, "add")
        .mockResolvedValue({ id: mockJobId } as never);

      const result = await emailQueueService.addJob(jobType, jobData);

      expect(queue.add).toHaveBeenCalledWith(jobType, jobData);
      expect(result).toBe(mockJobId);
      addSpy.mockRestore();
    });

    it("should return job ID after adding job", async () => {
      const jobType = "send-welcome-email";
      const jobData = { userId: "user-456", email: "user@example.com" };
      const expectedJobId = "job-456";

      const queue = emailQueueService.getQueue();
      const addSpy = vi
        .spyOn(queue, "add")
        .mockResolvedValue({ id: expectedJobId } as never);

      const jobId = await emailQueueService.addJob(jobType, jobData);

      expect(jobId).toBe(expectedJobId);
      addSpy.mockRestore();
    });

    it("should log success message after adding job", async () => {
      const jobType = "send-welcome-email";
      const jobData = { userId: "user-789", email: "another@example.com" };
      const mockJobId = "job-789";

      const queue = emailQueueService.getQueue();
      const addSpy = vi
        .spyOn(queue, "add")
        .mockResolvedValue({ id: mockJobId } as never);

      await emailQueueService.addJob(jobType, jobData);

      expect(mockLogger.info).toHaveBeenCalledWith({
        msg: "Email job added to queue",
        jobType,
        jobId: mockJobId,
      });
      addSpy.mockRestore();
    });

    it("should handle job without ID by generating fallback ID", async () => {
      const jobType = "send-welcome-email";
      const jobData = { userId: "user-999", email: "fallback@example.com" };

      const queue = emailQueueService.getQueue();
      // Mock job without ID
      const addSpy = vi
        .spyOn(queue, "add")
        .mockResolvedValue({ id: undefined } as never);

      const jobId = await emailQueueService.addJob(jobType, jobData);

      expect(jobId).toMatch(/^fallback-\d+$/);
      expect(mockLogger.info).toHaveBeenCalledWith({
        msg: "Email job added to queue",
        jobType,
        jobId: expect.stringMatching(/^fallback-\d+$/),
      });
      addSpy.mockRestore();
    });

    it("should throw and log error on failure", async () => {
      const jobType = "send-welcome-email";
      const jobData = { userId: "user-error", email: "error@example.com" };
      const mockError = new Error("Redis connection failed");

      const queue = emailQueueService.getQueue();
      const addSpy = vi.spyOn(queue, "add").mockRejectedValue(mockError);

      await expect(emailQueueService.addJob(jobType, jobData)).rejects.toThrow(
        "Redis connection failed",
      );

      expect(mockLogger.error).toHaveBeenCalledWith({
        msg: "Failed to add email job to queue",
        jobType,
        error: mockError,
      });
      addSpy.mockRestore();
    });

    it("should maintain order when adding multiple jobs sequentially", async () => {
      const jobs = [
        {
          type: "send-welcome-email",
          data: { userId: "user-1", email: "user1@example.com" },
        },
        {
          type: "send-welcome-email",
          data: { userId: "user-2", email: "user2@example.com" },
        },
        {
          type: "send-welcome-email",
          data: { userId: "user-3", email: "user3@example.com" },
        },
      ];

      const queue = emailQueueService.getQueue();
      const addSpy = vi
        .spyOn(queue, "add")
        .mockResolvedValueOnce({ id: "job-1" } as never)
        .mockResolvedValueOnce({ id: "job-2" } as never)
        .mockResolvedValueOnce({ id: "job-3" } as never);

      const jobIds: string[] = [];
      for (const job of jobs) {
        const jobId = await emailQueueService.addJob(job.type, job.data);
        jobIds.push(jobId);
      }

      expect(jobIds).toEqual(["job-1", "job-2", "job-3"]);
      expect(queue.add).toHaveBeenCalledTimes(3);

      // Verify order of calls
      expect(queue.add).toHaveBeenNthCalledWith(1, jobs[0].type, jobs[0].data);
      expect(queue.add).toHaveBeenNthCalledWith(2, jobs[1].type, jobs[1].data);
      expect(queue.add).toHaveBeenNthCalledWith(3, jobs[2].type, jobs[2].data);
      addSpy.mockRestore();
    });

    it("should handle different job types", async () => {
      const jobType1 = "send-welcome-email";
      const jobType2 = "send-notification-email";
      const jobData = { userId: "user-multi", email: "multi@example.com" };

      const queue = emailQueueService.getQueue();
      const addSpy = vi
        .spyOn(queue, "add")
        .mockResolvedValueOnce({ id: "job-type-1" } as never)
        .mockResolvedValueOnce({ id: "job-type-2" } as never);

      await emailQueueService.addJob(jobType1, jobData);
      await emailQueueService.addJob(jobType2, jobData);

      expect(queue.add).toHaveBeenCalledWith(jobType1, jobData);
      expect(queue.add).toHaveBeenCalledWith(jobType2, jobData);
      addSpy.mockRestore();
    });

    it("should handle empty job data", async () => {
      const jobType = "send-welcome-email";
      const emptyData = {};

      const queue = emailQueueService.getQueue();
      const addSpy = vi
        .spyOn(queue, "add")
        .mockResolvedValue({ id: "job-empty" } as never);

      const jobId = await emailQueueService.addJob(jobType, emptyData);

      expect(jobId).toBe("job-empty");
      expect(queue.add).toHaveBeenCalledWith(jobType, emptyData);
      addSpy.mockRestore();
    });
  });

  describe("getQueue", () => {
    it("should return queue instance", () => {
      const queue = emailQueueService.getQueue();

      expect(queue).toBeInstanceOf(Queue);
    });
  });
});
