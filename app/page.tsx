"use client";
import { useMemo } from "react";
import {
  FetchStreamTransport,
  useStream,
} from "@langchain/langgraph-sdk/react";
import Render from "./render";
export default function Home() {
  const transport = useMemo(() => {
    return new FetchStreamTransport({
      // apiUrl: "http://localhost:3000/api/chat",
      apiUrl: "http://localhost:3000/api/chat",
      // apiUrl: "http://localhost:2024",
      // assistantId: "agent",
    });
  }, []);

  const stream = useStream({
    transport,
  });

  const handleSubmit = async (content: string) => {
    await stream.submit(
      {
        messages: [{ content, role: "human" }],
        threadId: "chat123",
      },
      {
        config: {
          configurable: { thread_id: "chat123" },
        },
      },
    );
  };
  console.log("messages", stream.messages);
  return (
    <div className="text-xs items-center justify-center flex h-screen">
      <Render />
      {stream.messages.map((msg) => (
        <div key={msg.id}>{JSON.stringify(msg)}</div>
      ))}
      {/* <input
        className="border p-5"
        type="text"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const content = e.currentTarget.value;
            handleSubmit(content);
          }
        }}
      ></input> */}
    </div>
  );
}
