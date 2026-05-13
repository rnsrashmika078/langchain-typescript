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

export default function GraphStreaming() {
  // Create transport with API key - using closure to capture ref
  // Refs are only accessed in async callbacks (onRequest), not during render
  const transport = useMemo(() => {
    // const apiKeyValue = apiKey;
    return new FetchStreamTransport({
      apiUrl: "/api/graph",
    });
  }, []);

  const { messages, submit, isLoading, stop } = useStream({
    transport,
  });

  const [input, setInput] = useState<string>("");
  console.log("messages", messages);

  return (
    <div className="flex flex-col mx-auto sm:w-1/2  h-screen w-full items-center justify-between">
      <div className="w-full">
        {messages.map((msg) => (
          <div key={msg.id}>
            {isAIMessage(msg) && extractTextContent(msg.content)}
          </div>
        ))}
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
