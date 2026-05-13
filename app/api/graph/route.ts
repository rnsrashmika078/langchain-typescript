import { NextRequest } from "next/server";
import { ToolAgent } from "./toolAgent";

export async function POST(req: NextRequest) {
  const stream = await ToolAgent();

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}