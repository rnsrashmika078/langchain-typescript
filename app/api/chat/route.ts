import { HITLResponse } from "langchain";
import { NextResponse } from "next/server";
import { Command } from "@langchain/langgraph";
import { mainAgent } from "@/app/agents/agent";
import connectDB from "@/app/libs/mongodb/connectDB";
import Thread from "@/app/libs/mongodb/Threads";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    console.log("BODY", body);
    const threadId = body.input.threadId;
    const interruptResponse = body.input.interruptResponse as HITLResponse;
    const config = {
      configurable: {
        thread_id: threadId,
        rootPath: body.input.rootPath,
      },
    };
    if (threadId) {
      const exists = await Thread.findOne({ threadId });

      if (!exists) {
        await Thread.insertOne({ threadId });
      }
    }
    const input = interruptResponse
      ? new Command({ resume: { decisions: interruptResponse.decisions } })
      : body.input;


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
