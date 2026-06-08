/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import * as z from "zod";
import { createDeepAgent } from "deepagents";
import { tool } from "langchain";
export async function POST(req: Request) {
  try {
    const body = await req.json();
    // const { prompt } = body;

    // if (!prompt) {
    //   return NextResponse.json({ error: "task is required" }, { status: 400 });
    // }
    const getWeather = tool(({ city }) => `It's always sunny in ${city}!`, {
      name: "get_weather",
      description: "Get the weather for a given city",
      schema: z.object({
        city: z.string(),
      }),
    });

    const agent = createDeepAgent({
      tools: [getWeather],
      systemPrompt: "You are a helpful assistant",
    });

    console.log(
      await agent.invoke({
        messages: [{ role: "user", content: "What's the weather in Tokyo?" }],
      }),
    );
    return NextResponse.json({
      success: true,
      message: "done!",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal Server Error",
      },
      { status: 500 },
    );
  }
}

export const runtime = "nodejs";
