import z from "zod";

export const signInFormSchema = z.object({
  email: z.email({ error: "Please enter a valid email address" }),
  password: z.string().min(1, { error: "Password is required" }),
});

export type SignInFormValues = z.infer<typeof signInFormSchema>;
