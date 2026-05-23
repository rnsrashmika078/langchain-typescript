"use client";

import { useCallback, useMemo, useState } from "react";
import { type Message } from "@langchain/langgraph-sdk";
import {
  useStream,
  FetchStreamTransport,
  ToolCallState,
} from "@langchain/langgraph-sdk/react";
import { AIMessage, ToolCall, ToolMessage } from "@langchain/core/messages";
//
// import { WelcomeScreen } from "./Welcome";
// import { ToolCallBubble, type ToolCallState } from "./ToolCall";
// import { ErrorBubble } from "./ErrorBubble";
import {
  isAIMessage,
  isToolMessage,
  isHumanMessage,
  extractTextContent,
} from "../utils";
import ChatMessages from "./chat_messages";
import { ExtendedMessage } from "../types";

export default function ChatInterface() {
  // Create transport with API key - using closure to capture ref
  // Refs are only accessed in async callbacks (onRequest), not during render
  const transport = useMemo(() => {
    // const apiKeyValue = apiKey;
    return new FetchStreamTransport({
      apiUrl: "/api/chat",
    });
  }, []);

  const { messages, submit, isLoading, stop, interrupts } = useStream({
    transport,
  });

  const [input, setInput] = useState<string>("");
  console.log("interrupts", interrupts);

  const formattedMessage = useMemo(() => {
    return messages.map(
      (msg) =>
        ({
          ...msg,
          additional_kwargs: msg.additional_kwargs,
          // invalid_tool_calls: msg.type === "ai" ? msg.invalid_tool_calls : null,
          // tool_calls: msg.type === "ai" ? msg.tool_calls : null,
        }) as ExtendedMessage,
    );
  }, [messages]);

  console.log("Formated Messages", formattedMessage);
  return (
    <div className="flex flex-col mx-auto sm:w-1/2  h-screen w-full items-center justify-between">
      <div className="w-full">
        {/* {JSON.stringify(toolCalls[0])} */}
        {formattedMessage && formattedMessage.length > 0 && (
          <ChatMessages
            isLoading={isLoading}
            // addToolApprovalResponse={addToolApprovalResponse}
            messages={formattedMessage}
            // regenerate={regenerate}
            // status={status}
          />
        )}
      </div>

      <div className="w-full gap-6 rounded-md sticky bottom-0 right-0 -translate-x-0 -translate-y-0">
        <button onClick={() => stop()}>stop</button>
        <input
          className="w-full p-2 border rounded-xl"
          placeholder="Whats up today..!"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              submit({
                messages: [...messages, { content: input, type: "human" }],
              });
            }
          }}
        ></input>
      </div>
    </div>
  );
}
