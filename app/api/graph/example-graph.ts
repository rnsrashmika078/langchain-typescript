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
  topic: z.string(),
  joke: z.string(),
  improvedJoke: z.string(),
  finalJoke: z.string(),
});

export async function langGraph() {
  // First LLM call to generate initial joke
  const generateJoke: GraphNode<typeof State> = async (state) => {
    console.log("generating joke...!");
    const msg = await llm.invoke(`Write a short joke about ${state.topic}`);
    return { joke: msg.content as string };
  };

  // Gate function to check if the joke has a punchline
  const checkPunchline: ConditionalEdgeRouter<typeof State> = (state) => {
    // Simple check - does the joke contain "?" or "!"
    console.log("checking punch line...!");

    if (state.joke?.includes("?") || state.joke?.includes("!")) {
      return "Pass";
    }
    return "Fail";
  };

  // Second LLM call to improve the joke
  const improveJoke: GraphNode<typeof State> = async (state) => {
    console.log("improving joke...!");

    const msg = await llm.invoke(
      `Make this joke funnier by adding wordplay: ${state.joke}`,
    );
    return { improvedJoke: msg.content as string };
  };

  // Third LLM call for final polish
  const polishJoke: GraphNode<typeof State> = async (state) => {
    console.log("Polish joke...!");

    const msg = await llm.invoke(
      `Add a surprising twist to this joke: ${state.improvedJoke}`,
    );
    return { finalJoke: msg.content as string };
  };

  const chain = new StateGraph(State)
    .addNode("generateJoke", generateJoke)
    .addNode("improveJoke", improveJoke)
    .addNode("polishJoke", polishJoke)
    .addEdge("__start__", "generateJoke")
    .addConditionalEdges("generateJoke", checkPunchline, {
      Pass: "improveJoke",
      Fail: "__end__",
    })
    .addEdge("improveJoke", "polishJoke")
    .addEdge("polishJoke", "__end__")
    .compile();

  const state = await chain.invoke({ topic: "cats" });
  console.log("Initial Joke: ");
  console.log(state.joke);
  console.log("\n--- --- ---\n");
  if (state.improvedJoke !== undefined) {
    console.log("improved joke:");
    console.log(state.improvedJoke);
    console.log("\n--- --- ---\n");

    console.log("Final Joke");
    console.log(state.finalJoke);

    return NextResponse.json({
      state,
      initialJoke: state.joke,
      improveJoke: state.improvedJoke,
      finalJoke: state.finalJoke,
    });
  } else {
    console.log("Joke failed quality gate - no punchline detected!");
  }
}
