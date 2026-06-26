import { END, START, StateGraph } from "@langchain/langgraph";
import { graph1 } from "../schemas/graphSchema";
import {
  createFile,
  finishUpdate,
  fixError,
  readFile,
  updateFile,
} from "./g1_nodes";
import { routeDecision, routeDecision_II } from "./router";

const graph = new StateGraph(graph1)

  .addNode("readFile", readFile)
  .addNode("createFile", createFile)
  .addNode("updateFile", updateFile)
  .addNode("checkExistent", async () => {})
  .addNode("fixError", fixError)
  .addNode("finishUpdate", finishUpdate)
  .addEdge(START, "readFile")
  .addConditionalEdges("readFile", routeDecision, {
    updateOnly: "checkExistent",
    readOnly: END,
    ErrorFixOnly: "fixError",
  })
  // .addEdge("readFile", END)
  .addEdge("fixError", "finishUpdate")
  // .addEdge("updateFile", "finishUpdate")
  .addConditionalEdges("checkExistent", routeDecision_II, {
    create: "createFile",
    update: "updateFile",
  })
  .addEdge("createFile", END)
  .addEdge("updateFile", END);
//   .addEdge("finishUpdate", END);

import { getPostgressCheckpointer } from "@/app/memory/memorySavers";
import { AgentState } from "@/app/agents/agent";

const checkpointer = await getPostgressCheckpointer();

export const compiledGraph = graph.compile({
  //   interruptAfter: "*",
  checkpointer,
});
