/* eslint-disable @typescript-eslint/no-explicit-any */
import { graphLanguageModel } from "@/app/agents/languageModel";
import { ConditionalEdgeRouter, GraphNode } from "@langchain/langgraph";
import z from "zod";
import { graph1 } from "../schemas/graphSchema";

// const routeSchema = z.object({
//   step: z
//     .enum(["READ", "UPDATE", "DELETE"])
//     .describe("The next step in the routing process"),
// });

// const router = graphLanguageModel.withStructuredOutput(routeSchema);

export const routeDecision: ConditionalEdgeRouter<typeof graph1, any> = (
  state,
) => {
  if (state.error) {
    return "ErrorFixOnly";
  }
  if (state.operation === "READ") {
    return "readOnly";
  } else if (state.operation === "UPDATE") {
    return "updateOnly";
  } else if (state.operation === "FIXERROR") {
    return "ErrorFixOnly";
  } else {
    // default to read-only route when no other condition matches
    return "readOnly";
  }
};
