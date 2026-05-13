import { NextRequest, NextResponse } from "next/server";
import { ToolAgent } from "../graph/toolAgent";
import { deepAgent } from "../graph/deep-agent";
import { ChatOllama } from "@langchain/ollama";
import { LanguageModelLike } from "@langchain/core/language_models/base";


export async function POST(req: NextRequest) {
  const result = await deepAgent();

  return NextResponse.json({
    result
  });
}
