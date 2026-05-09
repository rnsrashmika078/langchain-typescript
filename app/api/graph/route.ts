import { NextResponse } from "next/server";
import { StoryGraph } from "./test-graph";

export async function POST() {
  const res = await StoryGraph();

  return NextResponse.json({
    message: "success",
    data: res,
  });
}
