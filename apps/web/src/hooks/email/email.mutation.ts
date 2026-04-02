import { postEmailSendMutation } from "@repo/api/";
import { useMutation } from "@tanstack/react-query";

/**
 * Hook for sending emails via the backend API.
 * 
 * @returns React Query mutation hook for email sending operations
 */
export const useSendEmail = () => useMutation({ ...postEmailSendMutation() });
