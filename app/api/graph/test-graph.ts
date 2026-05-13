import {
  StateGraph,
  StateSchema,
  GraphNode,
  ConditionalEdgeRouter,
  MemorySaver,
} from "@langchain/langgraph";
import { z } from "zod/v4";
import { llm } from "../chat/model";

// Graph state
const State = new StateSchema({
  topic: z.string().describe("topic of the story given by the user"),
  story: z.string().describe("story content"),
  comicScene: z.string().describe("comic content"),
  horrorScene: z.string().describe("horror content"),
});

export async function StoryGraph(query: string) {
  // First LLM call to generate initial joke
  const generateStory: GraphNode<typeof State> = async (state) => {
    console.log("generating story...!");
    const msg = await llm.invoke(
      `Write  story of a 20 words about ${state.topic}`,
    );
    // console.log("msg", msg);
    const scene = typeof msg === "object" ? (msg.content as string) : "";

    return { story: scene };
  };

  // Gate function to check if the joke has a punchline
  const checkPunchline: ConditionalEdgeRouter<typeof State> = (state) => {
    // Simple check - does the joke contain "?" or "!"
    console.log("checking punch line...!");

    const story =
      state.comicScene !== undefined
        ? state.comicScene
        : state.horrorScene !== undefined
          ? state.horrorScene
          : state.story;
    console.log("length", story);

    if (story.length > 600) {
      console.log("Hm...Story is lengthier that 60 words..mission abort..");
      return "Finish";
    }
    console.log("Mission continue..");
    return "Continue";
  };

  // Second LLM call to improve the joke
  const addComicScene: GraphNode<typeof State> = async (state) => {
    console.log("Adding comic scene...!");

    const msg = await llm.invoke(
      `add 10 words funny scene to this story : ${state.story}`,
    );
    const scene = typeof msg === "object" ? (msg.content as string) : "";

    return {
      comicScene: scene,
    };
  };

  // Third LLM call for final polish
  const addHorrorScene: GraphNode<typeof State> = async (state) => {
    console.log("Adding horror scence..!");

    const msg = await llm.invoke(
      `Add a 10 words horror scene to this story: ${state.comicScene}`,
    );
    const scene = typeof msg === "object" ? (msg.content as string) : "";

    return {
      horrorScene: scene,
    };
  };

  const chain = new StateGraph(State)
    .addNode("generateStory", generateStory, {
      retryPolicy: {
        maxAttempts: 3,
        initialInterval: 1,
      },
    })
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
    .addEdge("addHorrorScene", "__end__");

  const memory = new MemorySaver();
  const config = { configurable: { thread_id: "customer_123" } };
  const app = chain.compile({ checkpointer: memory });

  const state = await app.invoke({ topic: query }, config);
  console.log("Initial Story: ");
  console.log(state.story);
  console.log("\n--- --- ---\n");
  if (state.comicScene !== undefined) {
    console.log("comic scene:");
    console.log(state.comicScene);
    console.log("\n--- --- ---\n");

    console.log("horror scene");
    console.log(state.horrorScene);
    console.log("Length ", state.story && state.story.length);

    return {
      state,
      finalStory: state.horrorScene,
    };
  } else {
    console.log("Story failed quality gate - no punchline detected!");
    return {
      state,
      finalStory: state.horrorScene,
    };
  }
}
