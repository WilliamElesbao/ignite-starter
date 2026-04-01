import type messages from "./locales/en.json";

declare module "next-intl" {
  interface AppConfig {
    // ...
    Messages: typeof messages;
  }
}
