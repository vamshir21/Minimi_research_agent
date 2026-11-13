
import type { FastifyInstance } from "fastify";
import { createConversationSchema } from "./conversation.schemas.js";
import { createConversation } from "./conversation.service.js";

export async function conversationRoutes(app: FastifyInstance) {
  app.post("/api/v1/conversations", async (request, reply) => {
    const parsed = createConversationSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: "Invalid request",
        details: parsed.error.flatten()
      });
    }

    const conversation = createConversation(parsed.data);

    return reply.code(201).send({
      message: "Conversation created successfully",
      data: conversation
    });
  });
}
