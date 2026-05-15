import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Queue } from "bullmq";
import { EmailQueueService } from "../email-queue.service";
import {
  EMAIL_QUEUE_NAME,
  EMAIL_JOB_OPTIONS,
  getRedisConnection,
} from "../email-queue.config";
import { createMockLogger } from "../../../test/setup";

// Mock BullMQ Queue
vi.mock("bullmq", () => ({
  Queue: vi.fn(),
}));

describe("EmailQueueService", () => {
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockQueue: {
    add: ReturnType<typeof vi.fn>;
  };
  let emailQueueService: EmailQueueService;

  beforeEach(() => {
    // Create mock logger
    mockLogger = createMockLogger();

    // Create mock queue instance
    mockQueue = {
      add: vi.fn(),
    };

    // Mock Queue constructor to return our mock queue
    (Queue as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => mockQueue,
    );

    // Create service instance
    emailQueueService = new EmailQueueService(mockLogger);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize queue with correct configuration", () => {
      expect(Queue).toHaveBeenCalledWith(EMAIL_QUEUE_NAME, {
        connection: getRedisConnection(),
        defaultJobOptions: EMAIL_JOB_OPTIONS,
      });
    });

    it("should log queue initialization", () => {
      expect(mockLogger.info).toHaveBeenCalledWith({
        msg: "Email queue initialized",
        queueName: EMAIL_QUEUE_NAME,
      });
    });

    it("should use correct Redis configuration", () => {
      const redisConfig = getRedisConnection();

      expect(Queue).toHaveBeenCalledWith(
        EMAIL_QUEUE_NAME,
        expect.objectContaining({
          connection: expect.objectContaining({
            host: redisConfig.host,
            port: redisConfig.port,
          }),
        }),
      );
    });
  });

  describe("addJob", () => {
    it("should successfully add job to queue", async () => {
      const jobType = "send-welcome-email";
      const jobData = { userId: "user-123", email: "test@example.com" };
      const mockJobId = "job-123";

      mockQueue.add.mockResolvedValue({ id: mockJobId });

      const result = await emailQueueService.addJob(jobType, jobData);

      expect(mockQueue.add).toHaveBeenCalledWith(jobType, jobData);
      expect(result).toBe(mockJobId);
    });

    it("should return job ID after adding job", async () => {
      const jobType = "send-welcome-email";
      const jobData = { userId: "user-456", email: "user@example.com" };
      const expectedJobId = "job-456";

      mockQueue.add.mockResolvedValue({ id: expectedJobId });

      const jobId = await emailQueueService.addJob(jobType, jobData);

      expect(jobId).toBe(expectedJobId);
    });

    it("should log success message after adding job", async () => {
      const jobType = "send-welcome-email";
      const jobData = { userId: "user-789", email: "another@example.com" };
      const mockJobId = "job-789";

      mockQueue.add.mockResolvedValue({ id: mockJobId });

      await emailQueueService.addJob(jobType, jobData);

      expect(mockLogger.info).toHaveBeenCalledWith({
        msg: "Email job added to queue",
        jobType,
        jobId: mockJobId,
      });
    });

    it("should handle job without ID by generating fallback ID", async () => {
      const jobType = "send-welcome-email";
      const jobData = { userId: "user-999", email: "fallback@example.com" };

      // Mock job without ID
      mockQueue.add.mockResolvedValue({ id: undefined });

      const jobId = await emailQueueService.addJob(jobType, jobData);

      expect(jobId).toMatch(/^fallback-\d+$/);
      expect(mockLogger.info).toHaveBeenCalledWith({
        msg: "Email job added to queue",
        jobType,
        jobId: expect.stringMatching(/^fallback-\d+$/),
      });
    });

    it("should throw and log error on failure", async () => {
      const jobType = "send-welcome-email";
      const jobData = { userId: "user-error", email: "error@example.com" };
      const mockError = new Error("Redis connection failed");

      mockQueue.add.mockRejectedValue(mockError);

      await expect(emailQueueService.addJob(jobType, jobData)).rejects.toThrow(
        "Redis connection failed",
      );

      expect(mockLogger.error).toHaveBeenCalledWith({
        msg: "Failed to add email job to queue",
        jobType,
        error: mockError,
      });
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

      mockQueue.add
        .mockResolvedValueOnce({ id: "job-1" })
        .mockResolvedValueOnce({ id: "job-2" })
        .mockResolvedValueOnce({ id: "job-3" });

      const jobIds: string[] = [];
      for (const job of jobs) {
        const jobId = await emailQueueService.addJob(job.type, job.data);
        jobIds.push(jobId);
      }

      expect(jobIds).toEqual(["job-1", "job-2", "job-3"]);
      expect(mockQueue.add).toHaveBeenCalledTimes(3);

      // Verify order of calls
      expect(mockQueue.add).toHaveBeenNthCalledWith(
        1,
        jobs[0].type,
        jobs[0].data,
      );
      expect(mockQueue.add).toHaveBeenNthCalledWith(
        2,
        jobs[1].type,
        jobs[1].data,
      );
      expect(mockQueue.add).toHaveBeenNthCalledWith(
        3,
        jobs[2].type,
        jobs[2].data,
      );
    });

    it("should handle different job types", async () => {
      const jobType1 = "send-welcome-email";
      const jobType2 = "send-notification-email";
      const jobData = { userId: "user-multi", email: "multi@example.com" };

      mockQueue.add
        .mockResolvedValueOnce({ id: "job-type-1" })
        .mockResolvedValueOnce({ id: "job-type-2" });

      await emailQueueService.addJob(jobType1, jobData);
      await emailQueueService.addJob(jobType2, jobData);

      expect(mockQueue.add).toHaveBeenCalledWith(jobType1, jobData);
      expect(mockQueue.add).toHaveBeenCalledWith(jobType2, jobData);
    });

    it("should handle empty job data", async () => {
      const jobType = "send-welcome-email";
      const emptyData = {};

      mockQueue.add.mockResolvedValue({ id: "job-empty" });

      const jobId = await emailQueueService.addJob(jobType, emptyData);

      expect(jobId).toBe("job-empty");
      expect(mockQueue.add).toHaveBeenCalledWith(jobType, emptyData);
    });
  });

  describe("getQueue", () => {
    it("should return queue instance", () => {
      const queue = emailQueueService.getQueue();

      expect(queue).toBe(mockQueue);
    });
  });
});
