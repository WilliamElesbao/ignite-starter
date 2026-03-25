import { WelcomeEmail } from "@/email/templates/welcomeEmail";
import { resend } from "@/lib/resend/resend";

const emailFrom = process.env.EMAIL_FROM ?? "";
const emailTo = process.env.EMAIL_TO ?? "";

export async function POST() {
  try {
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: emailTo,
      subject: "Welcome to Origin Starter!",
      react: WelcomeEmail({ name: "D3v" }),
    });

    if (error) {
      return Response.json({ error }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error }, { status: 500 });
  }
}
