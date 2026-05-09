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
  story: z.string(),
  comicScene: z.string(),
  horrorScene: z.string(),
});

export async function StoryGraph() {
  // First LLM call to generate initial joke
  const generateStory: GraphNode<typeof State> = async (state) => {
    console.log("generating story...!");
    const msg = await llm.invoke(`Write a short story about ${state.topic}`);
    return { story: msg.content as string };
  };

  // Gate function to check if the joke has a punchline
  const checkPunchline: ConditionalEdgeRouter<typeof State> = (state) => {
    // Simple check - does the joke contain "?" or "!"
    console.log("checking punch line...!");
    console.log("length", state.story.length);

    if (state.story.length > 20) {
      return "Finish";
    }
    return "Continue";
  };

  // Second LLM call to improve the joke
  const addComicScene: GraphNode<typeof State> = async (state) => {
    console.log("improving joke...!");

    const msg = await llm.invoke(
      `add funny scene to this story: ${state.story}`,
    );
    return { comicScene: msg.content as string };
  };

  // Third LLM call for final polish
  const addHorrorScene: GraphNode<typeof State> = async (state) => {
    console.log("Adding horror scence..!");

    const msg = await llm.invoke(
      `Add a horror scene to this story: ${state.story}`,
    );
    return { horrorScene: msg.content as string };
  };

  const chain = new StateGraph(State)
    .addNode("generateStory", generateStory)
    .addNode("addComicScene", addComicScene)
    .addNode("addHorrorScene", addHorrorScene)
    .addEdge("__start__", "generateStory")
    .addConditionalEdges("generateStory", checkPunchline, {
      Finish: "__end__",
      Continue: "addComicScene",
    })
    // .addEdge("addComicScene", "addHorrorScene")

    .addConditionalEdges("addComicScene", checkPunchline, {
      Finish: "__end__",
      Continue: "addHorrorScene",
    })
    .addEdge("addHorrorScene", "__end__")

    .compile();

  const state = await chain.invoke({ topic: "university" });
  console.log("Initial Story: ");
  console.log(state.story);
  console.log("\n--- --- ---\n");
  if (state.comicScene !== undefined) {
    console.log("comic scene:");
    console.log(state.comicScene);
    console.log("\n--- --- ---\n");

    console.log("horror scene");
    console.log(state.horrorScene);

    return NextResponse.json({
      state,
      comicScene: state.comicScene,
      horrorScene: state.horrorScene,
      story: state.story,
    });
  } else {
    console.log("Story failed quality gate - no punchline detected!");
  }
}
