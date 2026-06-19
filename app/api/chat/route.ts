import { HITLResponse, HumanMessage } from "langchain";
import { NextResponse } from "next/server";
import { Command } from "@langchain/langgraph";
import { mainAgent } from "@/app/agents/agent";
import { prismaUpsert } from "@/app/helper";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("BODY", body);
    const thread_id = body.input.threadId;
    const interruptResponse = body.input.interruptResponse as HITLResponse;
    const config = {
      configurable: {
        thread_id,
        rootPath: body.input.rootPath,
      },
    };
    await prismaUpsert(thread_id);
    const input = interruptResponse
      ? new Command({ resume: { decisions: interruptResponse.decisions } })
      : { messages: [new HumanMessage(body.input.messages[0].content)] };

    // const mainAgent = await getMainAgent();
    const stream = await mainAgent.stream(input, {
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
      recursionLimit: 25,
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
