/* eslint-disable @typescript-eslint/no-explicit-any */
import { AIMessage, RemoveMessage } from "@langchain/core/messages";
import {
  Annotation,
  messagesStateReducer,
  REMOVE_ALL_MESSAGES,
} from "@langchain/langgraph";
import { createMiddleware } from "langchain";

export const trimMessages = createMiddleware({
  name: "TrimMessages",
  beforeModel: (state) => {
    const messages = state.messages;

    let newMessages: any = [];
    if (messages.length <= 30) {
      return;
    }
    const trim = messages.slice(10, messages.length);
    newMessages = trim;

    // const firstMsg = messages[0];
    // const recentMessages =
    //   messages.length % 2 === 0 ? messages.slice(-3) : messages.slice(-4);
    // const newMessages = [firstMsg, ...recentMessages];

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
export const contentFilterMiddleware = (bannedKeywords: string[]) => {
  const keywords = bannedKeywords.map((kw) => kw.toLowerCase());

  return createMiddleware({
    name: "ContentFilterMiddleware",
    beforeAgent: {
      hook: (state) => {
        // Get the first user message
        if (!state.messages || state.messages.length === 0) {
          return;
        }

        const firstMessage = state.messages[0];
        if (firstMessage._getType() !== "human") {
          return;
        }

        const content = firstMessage.content.toString().toLowerCase();

        // Check for banned keywords
        for (const keyword of keywords) {
          if (content.includes(keyword)) {
            // Block execution before any processing
            return {
              messages: [
                new AIMessage(
                  "I cannot process requests containing inappropriate content. Please rephrase your request.",
                ),
              ],
              jumpTo: "end",
            };
          }
        }

        return;
      },
      canJumpTo: ["end"],
    },
  });
};

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
          .map((m) => new RemoveMessage({ id: m.id! })),
      };
    }
  },
});
