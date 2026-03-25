import "better-auth";

declare module "better-auth" {
  interface User {
    id?: string;
    image?: string | null;
    name?: string;
    surname?: string;
    emailVerified?: boolean;
    email?: string;
    role?: string;
    status?: string;
    createdAt?: Date;
    updatedAt?: Date;
    stripeSubscriptionId?: string | null;
  }
}
