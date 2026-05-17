import { createAgent, tool } from "langchain";
import { NextResponse } from "next/server";
import * as z from "zod";
import { ChatOllama } from "@langchain/ollama"; // ✅ IMPORTANT
import { LanguageModelLike } from "@langchain/core/language_models/base";
import { requestWeatherAPI } from "@/app/helper";
import { llm } from "./model";
import { agent } from "./agent";
import { modelTools } from "./tools";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("rootPath", body.input.rootPath);
    console.log("fileTree", body.input.fileTree);

    const agent = createAgent({
      model: llm,
      systemPrompt: `YOU ARE EXPERT AI CODE ASSISTANT.
            NOTE: ROOT PROJECT PATH ( USE THIS PATH TO AS A PROJECT FILE ROOT PATH): ${JSON.stringify(body.input.rootPath)}
            NOTE: CURRENT OPEN PROJECT STRUCTURE (): ${JSON.stringify(body.input.fileTree)}
        `,
      tools: modelTools,
    });

    const stream = await agent.stream(body.input, {
      encoding: "text/event-stream",
      streamMode: ["updates", "messages", "tools", "values", "checkpoints"],
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
