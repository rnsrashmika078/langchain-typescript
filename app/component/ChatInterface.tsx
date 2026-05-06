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
import { ChatInput } from "./ChatInput";
import { string } from "zod";

interface ChatInterfaceProps {
  apiKey: string;
}

export default function ChatInterface() {
  // Create transport with API key - using closure to capture ref
  // Refs are only accessed in async callbacks (onRequest), not during render
  const transport = useMemo(() => {
    // const apiKeyValue = apiKey;
    return new FetchStreamTransport({
      apiUrl: "/api/chat",
    });
  }, []);

  const { messages, submit } = useStream({
    transport,
  });

  //   const handleInputSubmit = useCallback(
  //     (message: string) => {
  //       handleSend(message);
  //     },
  //     [handleSend],
  //   );

  //   const isLoading = stream.isLoading;
  //   const errorMessage =
  //     stream.error instanceof Error
  //       ? stream.error.message
  //       : typeof stream.error === "string"
  //         ? stream.error
  //         : undefined;

  const isLoading = false;

  const [input, setInput] = useState<string>("");
  console.log("messages", messages);
  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            {messages.map((msg, messageIndex) => {
              if (typeof msg != "object") return false;
              return (
                <div key={msg.id || messageIndex}>
                  {/* Message */}
                  {extractTextContent(msg.content) !== "" && (
                    <div
                      className={`flex ${
                        isHumanMessage(msg) ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          isHumanMessage(msg)
                            ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                            : "bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">
                          {extractTextContent(msg.content)}
                          {/* {messageIndex ===
                              messages.filter((m) => !isToolMessage(m)).length -
                                1 &&
                              isLoading && (
                                <span className="inline-block w-2 h-4 bg-gray-400 dark:bg-gray-600 ml-1 animate-pulse" />
                              )} */}
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Tool calls associated with this message */}
                  {/* {associatedToolCalls.map((toolCallState) => (
                      <ToolCallBubble
                        key={toolCallState.toolCall.id}
                        toolCallState={toolCallState}
                      />
                    ))} */}
                  {/* Error bubble associated with this message */}
                  {/* {errorMessage &&
                      isAIMessage(message) &&
                      messageIndex ===
                        stream.messages.filter((m) => !isToolMessage(m))
                          .length -
                          1 && <ErrorBubble error={errorMessage} />} */}
                </div>
              );
            })}
          </div>
          {isLoading && (
            <div className="flex justify-center items-center gap-1.5 py-2">
              <span
                className="inline-block w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-dot-wave"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="inline-block w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-dot-wave"
                style={{ animationDelay: "200ms" }}
              />
              <span
                className="inline-block w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full animate-dot-wave"
                style={{ animationDelay: "400ms" }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      {/* <ChatInput onSubmit={handleInputSubmit} isLoading={isLoading} /> */}
      <input
        className="bg-red-500 p-5"
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            submit({
              messages: [{ content: input, type: "human" }],
            });
          }
        }}
      ></input>
    </div>
  );
}
