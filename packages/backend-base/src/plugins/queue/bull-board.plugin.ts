import { fileURLToPath } from "node:url";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ElysiaAdapter } from "@bull-board/elysia";
import { Elysia } from "elysia";
import shared from "../../shared/shared.plugin";
import { EmailQueueService } from "./email-queue.service";

/**
 * Polyfill for require.resolve in ESM context
 *
 * @bull-board/api internally uses require.resolve() to locate UI assets.
 * In Bun's ESM environment, we need to provide a compatible implementation
 * using import.meta.resolve() which returns file:// URLs that need conversion.
 */
const polyfillRequireResolve = () => {
  const globalWithRequire = globalThis as {
    require?: {
      (id: string): unknown;
      resolve: {
        (id: string): string;
        paths: (request: string) => string[] | null;
      };
    };
  };

  if (!globalWithRequire.require) {
    // Main require function (not used by bull-board, but needed for completeness)
    const requireFn = (id: string) => {
      const resolved = import.meta.resolve(id);
      return fileURLToPath(resolved);
    };

    // Add the resolve method that @bull-board expects
    const resolveFunction = (id: string) => {
      const resolved = import.meta.resolve(id);
      return fileURLToPath(resolved);
    };

    // Add the paths method (required by require.resolve interface)
    resolveFunction.paths = () => null;

    requireFn.resolve = resolveFunction;
    globalWithRequire.require = requireFn;
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

    // Polyfill require.resolve for @bull-board/api compatibility
    polyfillRequireResolve();

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
