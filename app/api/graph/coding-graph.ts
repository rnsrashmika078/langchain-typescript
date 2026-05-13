import {
  StateGraph,
  StateSchema,
  GraphNode,
  ConditionalEdgeRouter,
} from "@langchain/langgraph";
import { z } from "zod/v4";
import { llm } from "../chat/model";
import { NextResponse } from "next/server";

// Graph state
const State = new StateSchema({
  prompt: z.string(),
  code: z.string(),
  review_phase_I: z.string(),
  review_phase_II: z.string(),
});

export async function CodingAgent(topic: string) {
  // First LLM call to generate initial joke
  const generateCode: GraphNode<typeof State> = async (state) => {
    console.log("generating code..!");
    const msg = await llm.invoke(
      `generate react typescript code for  ${state.prompt}`,
    );
    // console.log("msg", msg);
    const generateCode = typeof msg === "object" ? (msg.content as string) : "";
    return { code: generateCode };
  };

  // Gate function to check if the joke has a punchline
  const checkPunchline: ConditionalEdgeRouter<typeof State> = (state) => {
    // Simple check - does the joke contain "?" or "!"
    console.log("checking review phase...!");

    const story =
      state.code !== undefined
        ? state.review_phase_I
        : state.review_phase_I !== undefined
          ? state.review_phase_II
          : state.code;
    console.log("length", story);

    if (state.review_phase_II !== undefined) {
      console.log("Hm...Story is lengthier that 60 words..mission abort..");
      return "Finish";
    }
    console.log("Mission continue..");
    return "Continue";
  };

  // Second LLM call to improve the joke
  const review_phase_i: GraphNode<typeof State> = async (state) => {
    console.log("entering to the second phase .!");

    const msg = await llm.invoke(
      `review this code and fix issues : ${state.code}`,
    );
    const reviewed_code =
      typeof msg === "object" ? (msg.content as string) : "";

    return {
      review_phase_I: reviewed_code,
    };
  };

  // Third LLM call for final polish
  const review_phase_ii: GraphNode<typeof State> = async (state) => {
    console.log("entering to the third phase .!");

    const msg = await llm.invoke(
      `review this code and fix issues : ${state.code}`,
    );
    const reviewed_code =
      typeof msg === "object" ? (msg.content as string) : "";

    return {
      review_phase_II: reviewed_code,
    };
  };

  const chain = new StateGraph(State)
    .addNode("generateCode", generateCode)
    .addNode("review_phase_i", review_phase_i)
    .addNode("review_phase_ii", review_phase_ii)
    .addEdge("__start__", "generateCode")
    .addConditionalEdges("generateCode", checkPunchline, {
      Finish: "__end__",
      Continue: "review_phase_i",
    })
    // .addEdge("addComicScene", "addHorrorScene")

    .addConditionalEdges("review_phase_i", checkPunchline, {
      Finish: "__end__",
      Continue: "review_phase_ii",
    })
    .addEdge("review_phase_ii", "__end__")
    .compile();

  const state = await chain.invoke({ prompt: topic });
  console.log("Initial generate code: ");
  console.log(state.code);
  console.log("\n--- --- ---\n");
  if (state.review_phase_I !== undefined) {
    console.log("reviwed phase i:");
    console.log(state.review_phase_I);
    console.log("\n--- --- ---\n");

    console.log("reviwed phase ii");
    console.log(state.review_phase_II);

    return NextResponse.json({
      state,
      code: state.review_phase_II,
    });
  } else {
    console.log("Story failed quality gate - no punchline detected!");
    return NextResponse.json({
      state,
      code: null,
    });
  }
}
