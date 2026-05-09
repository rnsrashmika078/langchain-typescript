import { createAgent, tool } from "langchain";
import { NextResponse } from "next/server";
import * as z from "zod";
import { ChatOllama } from "@langchain/ollama"; // ✅ IMPORTANT
import { LanguageModelLike } from "@langchain/core/language_models/base";
import { requestWeatherAPI } from "@/app/helper";

const getWeather = tool(
  async ({ city }: { city: string }) => {
    try {
      const result = await requestWeatherAPI(city);

      if (!result) {
        return "error while requesting weather api.. try again";
      }
      return {
        weather: result?.condition.text,
        temperature: result?.temp_c,
        city,
        icon: result?.condition.icon,
        wind: result?.wind_kph,
      };
    } catch (error) {
      return `error while requesting weather api.. error: ${error instanceof Error ? error.message : "no internet connection"}`;
    }
  },
  {
    name: "get_weather",
    description: "Get weather",
    schema: z.object({
      city: z.string(),
    }),
  },
);
const getCurrentTime = tool(
  () => {
    return `current time: ${new Date().toLocaleTimeString()}`;
  },
  {
    name: "return_current_time",
    description: "return current local time",
  },
);

const model = new ChatOllama({
  model: "gemma4:e2b",
  stop: ["Thinking:", "Reasoning:", "\n\nThinking", "1.  **Analyze"], // maxRetries: 10,
  // model: "llama3.1:8b",
  onFailedAttempt: () => console.log(""),
}) as LanguageModelLike;

const agent = createAgent({
  //@ts-expect-error:model ts mismatch issue
  model,
  systemPrompt:
    "you are help full agent.. dont reasoning or thinking.You must NOT show your reasoning process",
  tools: [getWeather, getCurrentTime],
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("body", body);

    const stream = await agent.stream(body.input, {
      encoding: "text/event-stream",
      streamMode: ["values", "updates", "messages"],
      // streamMode: ["messages"],

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

// export const runtime = "nodejs";
