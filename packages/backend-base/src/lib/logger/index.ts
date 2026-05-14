import pino from "pino";

// pino-pretty is a devDependency used only for local development.
// In production logs are emitted as structured JSON to stdout.
const isDev = Bun.env.NODE_ENV !== "production";

const options: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL ?? "info",
};

if (isDev) {
  options.transport = {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:HH:MM:ss.l",
      ignore: "pid,hostname",
    },
  };
}

export const logger = pino(options);
