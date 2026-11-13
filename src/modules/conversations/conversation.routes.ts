
import type { FastifyInstance } from "fastify";
import { createConversationSchema,createMessageSchema } from "./conversation.schemas.js";
import { createConversation,createMessage,getConversationMessages} from "./conversation.service.js";

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



 app.post("/api/v1/conversations/:id/messages", async (request, reply) => {
   const params = request.params as { id: string };

   const parsed = createMessageSchema.safeParse(request.body);

   if (!parsed.success) {
     return reply.code(400).send({
       error: "Invalid request",
       details: parsed.error.flatten()
     });
   }

  try {
    const message = createMessage(params.id, parsed.data);

    return reply.code(201).send({
      message: "Message created successfully",
      data: message
    });
  }  catch (error) {
     if (
      error instanceof Error &&
      error.message === "CONVERSATION_NOT_FOUND"
     ) {
       return reply.code(404).send({
         error: "Conversation not found"
       });
     }

     throw error;
   }
 });

 app.get("/api/v1/conversations/:id/messages", async (request, reply) => {
  const params = request.params as { id: string };

  try {
    const messages = getConversationMessages(params.id);

    return reply.code(200).send({
      message: "Conversation messages retrieved successfully",
      data: messages
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "CONVERSATION_NOT_FOUND"
    ) {
      return reply.code(404).send({
        error: "Conversation not found"
      });
    }

    throw error;
  }
 });
}

