import { createRequire } from "node:module";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ElysiaAdapter } from "@bull-board/elysia";
import { Elysia } from "elysia";
import shared from "../../shared/shared.plugin";
import { EmailQueueService } from "./email-queue.service";

const ensureRequire = () => {
  const globalWithRequire = globalThis as { require?: NodeRequire };
  if (!globalWithRequire.require) {
    globalWithRequire.require = createRequire(import.meta.url);
  }
};

/**
 * Bull Board Plugin
 *
 * UI to monitor and manage the email queue.
 * Accessible at: /admin/queues
 */
const bullBoardPlugin = new Elysia({ tags: ["Admin"] })
  .use(shared)
  .state((state) => {
    // Create email queue service
    const emailQueueService = new EmailQueueService(state.logger);

    // Configure Bull Board with email queue
    const serverAdapter = new ElysiaAdapter("/admin/queues");

    ensureRequire();

    createBullBoard({
      queues: [new BullMQAdapter(emailQueueService.getQueue())],
      serverAdapter,
    });

    return {
      ...state,
      emailQueueService,
      bullBoardAdapter: serverAdapter,
    };
  })
  .use(({ store }) => store.bullBoardAdapter.registerPlugin());

export type BullBoardPlugin = typeof bullBoardPlugin;
export default bullBoardPlugin;
