import { ConditionalEdgeRouter } from "@langchain/langgraph";
import { graph1 } from "../schemas/graphSchema";

export const isPathAvailable: ConditionalEdgeRouter<typeof graph1> = (
  state,
  config,
) => {
  if (config.writer) {
    config.writer({ message: "Checking Path Availability..." });
  }

  if (!state.absolute_path) {
    return "Fail";
  }
  return "Pass";
};
export const isLoopDone: ConditionalEdgeRouter<typeof graph1> = (
  state,
  config,
) => {
  if (config.writer) {
    config.writer({ message: "Checking loop state..!" });
  }

  if (state.currentLoopCount > state.loopCount) {
    return "Done";
  }
  return "Continue";
};