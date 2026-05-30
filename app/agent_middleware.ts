/* eslint-disable @typescript-eslint/no-explicit-any */
import { RemoveMessage } from "@langchain/core/messages";
import { Annotation, messagesStateReducer, REMOVE_ALL_MESSAGES } from "@langchain/langgraph";
import { createMiddleware } from "langchain";

export const trimMessages = createMiddleware({
  name: "TrimMessages",
  beforeModel: (state) => {
    const messages = state.messages;

    if (messages.length <= 3) {
      return;
    }

    const firstMsg = messages[0];
    const recentMessages =
      messages.length % 2 === 0 ? messages.slice(-3) : messages.slice(-4);
    const newMessages = [firstMsg, ...recentMessages];

    return {
      messages: [
        new RemoveMessage({ id: REMOVE_ALL_MESSAGES }),
        ...newMessages,
      ],
    };
  },
});

export const AgentState = Annotation.Root({
  messages: Annotation<any[]>({
    reducer: messagesStateReducer,
  }),
});

// 2. Create middleware that returns RemoveMessage
export const deleteOldMessages = createMiddleware({
  name: "DeleteOldMessages",
  afterModel: (state) => {
    const messages = state.messages;

    // Example: remove the oldest 2 messages if history > 10
    if (messages.length > 10) {
      return {
        messages: messages
          .slice(0, 2)
          .map((m) => new RemoveMessage({ id: m.id!})),
      };
    }
  },
});
