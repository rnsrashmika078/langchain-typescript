// pages/api/resume.ts
import { compiledGraph } from "@/app/graphs/graph1/graph";
import { Command } from "@langchain/langgraph";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { thread_id, resumeValue } = await req.json();
  const config = { configurable: { thread_id } };

  await compiledGraph.invoke(new Command({ resume: resumeValue }), config);

  return NextResponse.json({ status: "resumed" });
}
