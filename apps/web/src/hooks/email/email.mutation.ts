import { postEmailSendMutation } from "@repo/api/";
import { useMutation } from "@tanstack/react-query";

export const useSendEmail = () =>
  useMutation({
    ...postEmailSendMutation(),
  });
