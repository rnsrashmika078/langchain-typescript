/* eslint-disable @typescript-eslint/no-explicit-any */
import { tool, ToolRuntime } from "langchain";
import {
  ConditionalEdgeRouter,
  END,
  GraphNode,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { graph1 } from "../schemas/graphSchema";
import {
  finishUpdate,
  fixError,
  readFile,
  updateFile,
} from "../graph2/g2_nodes";
import z from "zod";
import { graphLanguageModel } from "@/app/agents/languageModel";

const callRouter: GraphNode<typeof graph1> = async (state) => {
  if (state.error) {
    return { decision: "fixer" };
  }
  return { decision: "updater" };
};
const routeDecision: ConditionalEdgeRouter<typeof graph1, any> = (state) => {
  if (state.decision === "fixer") {
    return "fixFileError";
  } else if (state.decision === "updater") {
    return "updateFile";
  } else {
    return "third";
  }
};

export const UpdateOrErrorFixFileTool = tool(
  async (
    { task, fileName }: { task: string; fileName: string },
    runtime: ToolRuntime,
  ) => {
    const rootDir = runtime?.configurable?.rootPath;
    const error = runtime?.configurable?.error;
    const graph = new StateGraph(graph1)
      .addNode("readFile", readFile)
      .addNode("updateFile", updateFile)
      .addNode("fixFileError", fixError)
      .addNode("finishUpdate", finishUpdate)
      .addNode("callRouter", callRouter)
      .addEdge(START, "readFile")
      .addEdge("readFile", "callRouter")
      .addConditionalEdges("callRouter", routeDecision, [
        "fixFileError",
        "updateFile",
      ])
      .addEdge("fixFileError", "finishUpdate")
      .addEdge("updateFile", "finishUpdate")
      .addEdge("finishUpdate", END)
      .compile();

    const inputs = {
      rootDir,
      task,
      fileName,
      error,
    };

    let full_state: any = "";
    let custom: any = "";

    for await (const [mode, chunk] of await graph.stream(inputs, {
      streamMode: ["values", "custom"],
    })) {
      if (mode === "values") {
        full_state = chunk;
      } else if (mode === "custom") {
        if (runtime.writer) {
          custom = chunk;
          runtime.writer(custom.message);
        }
      }
    }
    return "successfully update the file";
  },
  {
    name: "UpdateOrErrorFixFileTool",
    description: `
          Read,update and error fix on file/files content
          `,
    schema: z.object({
      task: z.string().describe(
        `Describe the task
    `,
      ),
      fileName: z
        .optional(z.string())
        .describe("file /folder name only .. no paths "),
    }),
  },
);
