import z from "zod";

const MIN_NAME_LENGTH = 5;
const MIN_PASSWORD_LENGTH = 8;

export const signUpFormSchema = z.object({
  name: z.string().min(MIN_NAME_LENGTH, {
    error: `Name must be at least ${MIN_NAME_LENGTH} characters long`,
  }),
  email: z.email({ error: "Please enter a valid email address" }),
  password: z.string().min(MIN_PASSWORD_LENGTH, {
    error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
  }),
});

export type SignUpFormValues = z.infer<typeof signUpFormSchema>;
