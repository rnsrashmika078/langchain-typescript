import { createAgent, tool } from "langchain";
import { NextResponse } from "next/server";
import * as z from "zod";
import { ChatOllama } from "@langchain/ollama"; // ✅ IMPORTANT
import { LanguageModelLike } from "@langchain/core/language_models/base";

const getWeather = tool(
  ({ city }: { city: string }) => `It's always sunny in ${city}!`,
  {
    name: "get_weather",
    description: "Get weather",
    schema: z.object({
      city: z.string(),
    }),
  },
);

// ✅ Create model instance explicitly
const model = new ChatOllama({
  model: "gemma4:e2b",
}) as LanguageModelLike;

const agent = createAgent({
  model,
  tools: [getWeather],
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("body", body);

    const stream = await agent.stream(body.input, {
      encoding: "text/event-stream",
      streamMode: ["values", "updates", "messages"],
      recursionLimit: 10,
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "An error occurred while processing the request.",
      },
      { status: 500 },
    );
  }
}

export const runtime = "nodejs";
