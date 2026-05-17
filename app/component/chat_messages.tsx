/* eslint-disable @typescript-eslint/no-explicit-any */
import { memo } from "react";
import {
  isHumanMessage,
  extractTextContent,
  isAIMessage,
  isToolMessage,
} from "../utils";
import { ExtendedMessage } from "../types";

const ChatMessages = memo(
  ({
    messages,
    toolCalls,
    isLoading,
  }: {
    toolCalls?: any[];
    messages: ExtendedMessage[];
    isLoading: boolean;
  }) => {
    console.log("all messages", messages);
    return (
      <>
        {messages.map((msg, messageIndex) => {
          if (typeof msg != "object") return false;

          const isToolMsg = isToolMessage(msg);
          const isAiMsg = isAIMessage(msg);
          const textContent = extractTextContent(msg.content);
          const reasoningContent = msg.additional_kwargs?.reasoning_content;
          console.log(JSON.stringify(msg.tool_calls));
          console.log("isLoading", isLoading);

          return (
            <div
            
            key={msg.id || messageIndex}>
              {/* Message */}
              <div
                className={`flex p-2 ${
                  isHumanMessage(msg) ? "justify-end " : "justify-start "
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    isHumanMessage(msg)
                      ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                      : "bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {/* Loading spinner */}
                  {isLoading && (
                    <div className="w-5 h-5 p-1 animate-pulse bg-white-500 rounded-full">ASD</div>
                  )}

                  {/* Reasoning content */}
                  {isAiMsg && reasoningContent && (
                    <p className="whitespace-pre-wrap border p-2 border-l-4 border-red-500 mb-5">
                      {extractTextContent(reasoningContent)}
                    </p>
                  )}

                  {/* Main message content */}
                  {!isToolMsg ? (
                    <p className="whitespace-pre-wrap">{textContent}</p>
                  ) : (
                    <p className="whitespace-pre-wrap">
                      {" "}
                      {JSON.stringify(msg.tool_calls)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </>
    );
  },
);

ChatMessages.displayName = "ChatMessages";

export default ChatMessages;
