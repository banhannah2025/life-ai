import { z } from "zod";

export const sendDirectMessageSchema = z.object({
    recipientId: z.string().min(1, "Select someone to message."),
    content: z
        .string()
        .trim()
        .min(1, "Add a message before sending.")
        .max(1000, "Messages can be up to 1000 characters."),
});

export type SendDirectMessageInput = z.infer<typeof sendDirectMessageSchema>;
