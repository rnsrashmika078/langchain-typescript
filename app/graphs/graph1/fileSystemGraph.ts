/* eslint-disable @typescript-eslint/no-explicit-any */
import * as z from "zod";
import { tool, ToolRuntime } from "langchain";
import {
  END,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { graph1 } from "../schemas/graphSchema";
import {
  cleanState,
  determineFilePath,
  generateFile,
  generateFileContent,
  readFileTree,
  recallStandardStructure,
} from "./nodes";
import { isPathAvailable } from "./edges";

export const run_langgraph = tool(
  async ({ task }: { task: string }, runtime: ToolRuntime) => {
    const rootPath = runtime?.configurable?.rootPath;

    const graph = new StateGraph(graph1)
      .addNode("determine_path", determineFilePath)
      .addNode("recall_knowledge", recallStandardStructure)
      .addNode("read_file_tree", readFileTree)
      .addNode("generate_file_content", generateFileContent)
      .addNode("generate_file", generateFile)
      .addNode("clean_state", cleanState)

      .addEdge(START, "recall_knowledge")
      .addEdge("recall_knowledge", "read_file_tree")
      .addEdge("read_file_tree", "determine_path")
      .addConditionalEdges("determine_path", isPathAvailable, {
        Pass: "generate_file_content",
        Fail: END,
      })
      .addEdge("generate_file_content", "generate_file")
      .addEdge("generate_file", "clean_state")
      .addEdge("clean_state", END)
      // .addConditionalEdges("clean_state", isLoopDone, {
      //   Done: END,
      //   Continue: "determine_path",
      // })
      .compile();

    const inputs = {
      task,
      rootPath,
      absolute_path: "",
      // loopCount,
      // currentLoopCount:1
    };

    let full_state: any = null;
    let custom: any = null;

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

    return `file create successful at ${full_state?.absolute_path}`;
  },
  {
    name: "run_langgraph",
    description: "Langgraph agent that work with the file system",
    schema: z.object({
      task: z.string().describe("Task user given to you"),
    }),
  },
);
