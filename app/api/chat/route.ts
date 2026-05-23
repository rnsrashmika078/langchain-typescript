/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createAgent,
  HITLResponse,
  humanInTheLoopMiddleware,
  HumanMessage,
  tool,
} from "langchain";
import { NextResponse } from "next/server";
import * as z from "zod";
import { ChatOllama } from "@langchain/ollama"; // ✅ IMPORTANT
import { LanguageModelLike } from "@langchain/core/language_models/base";
import { requestWeatherAPI } from "@/app/helper";
import { llm } from "./model";
import { modelTools } from "./tools";
import { Command, MemorySaver } from "@langchain/langgraph";
import { checkpointer } from "@/app/redisSaver";

// const checkpointer = new MemorySaver();
const agent = createAgent({
  model: llm,
  systemPrompt: `YOU ARE EXPERT AI CODE ASSISTANT.
          
        `,
  // NOTE: ROOT PROJECT PATH ( USE THIS PATH TO AS A PROJECT FILE ROOT PATH): ${JSON.stringify(body.input.rootPath)}
  // NOTE: CURRENT OPEN PROJECT STRUCTURE (): ${JSON.stringify(body.input.fileTree)}
  tools: modelTools,
  middleware: [
    humanInTheLoopMiddleware({
      interruptOn: {
        create_file: {
          allowedDecisions: ["approve", "reject"],
          description: "🚨 Create file execution requires User approval",
        },
        get_weather: {
          allowedDecisions: ["approve", "reject"],
          description: "To get weather we need User approval ?",
        },
        // get_weather: true,
      },
    }),
  ],

  checkpointer: checkpointer,
});
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const interruptResponse = body.input.interruptResponse as HITLResponse;
    // console.log("rootPath", body.input.rootPath);
    // console.log("fileTree", body.input.fileTree);
    // console.log("threadId", body.input.threadId);
    // command { resume: { decisions: [ [Object] ] } }

    const config = { configurable: { thread_id: body.input.threadId } };
    const input = interruptResponse
      ? new Command({ resume: { decisions: interruptResponse.decisions } })
      : body.input;
    console.log("input ", input);
    console.log("body input ", body.input);

    console.log("interruptResponse. ", interruptResponse);

    const stream = await agent.stream(input, {
      ...config,
      encoding: "text/event-stream",
      streamMode: [
        "updates",
        "messages",
        "values",
        "checkpoints",
        "tools",
        "updates",
      ],
      // streamMode: ["messages"],
      recursionLimit: 10,
      // configurable: {
      //   thread_id: body.input.threadId || "default-thread",
      // },
    });
    console.log(
      "Resuming with command:",
      input instanceof Command ? "Yes" : "No",
      "Thread ID:",
      config.configurable.thread_id,
    );

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
