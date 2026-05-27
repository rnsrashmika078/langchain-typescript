/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAgent, HITLResponse, humanInTheLoopMiddleware } from "langchain";
import { NextResponse } from "next/server";
import * as z from "zod";
import { llm } from "./model";
import { modelTools } from "./tools";
import { Command } from "@langchain/langgraph";
import { checkpointer } from "@/app/redisSaver";

const agent = createAgent({
  model: llm,
  systemPrompt: `
You are an expert React Vite developer AI agent inside an Electron app.

You MUST follow this loop:

1. THINK: decide what to do
2. TOOL: call a tool if needed
3. OBSERVE: read the result
4. REPEAT until task is complete
5. FINAL: give final answer. must be very very short. like few lines

Rules:
- You can call MULTIPLE tools step by step
- After each tool call, you MUST continue reasoning
- DO NOT stop after one tool if task is incomplete
- ALWAYS prefer tools for project-related actions
- Each user request is independent (stateless)

Available tools:
- run_langgraph → for file related operations: example : Create/generate files
`,
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
        run_langgraph: {
          allowedDecisions: ["approve", "reject"],
          description: "Do you want to run ?",
        },
      },
    }),
  ],
  checkpointer: checkpointer,
});
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const interruptResponse = body.input.interruptResponse as HITLResponse;

    const config = {
      configurable: {
        thread_id: body.input.threadId,
        rootPath: body.input.rootPath,
        fileTree: body.input.fileTree,
      },
    };
    const input = interruptResponse
      ? new Command({ resume: { decisions: interruptResponse.decisions } })
      : body.input;

    const stream = await agent.stream(input, {
      ...config,
      encoding: "text/event-stream",
      streamMode: [
        "updates",
        "messages",
        "values",
        "checkpoints",
        "tools",
        "custom",
      ],
      // recursionLimit: 10,
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
