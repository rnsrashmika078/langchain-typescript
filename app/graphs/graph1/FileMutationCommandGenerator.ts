/* eslint-disable @typescript-eslint/no-explicit-any */
import { tool, ToolRuntime } from "langchain";
import { END, START, StateGraph } from "@langchain/langgraph";
import { graph1 } from "../schemas/graphSchema";
import { FMCGProperties } from "@/markdown/tool_properties";
import { readFileTree } from "../graph2/g2_nodes";
import { generateFileContent } from "./g1_nodes";
export const FileMutationCommandGenerator = tool(
  async (
    { fileName, task }: { fileName: string; task: string },
    runtime: ToolRuntime,
  ) => {
    const rootDir = runtime?.configurable?.rootPath;
    const graph = new StateGraph(graph1)
      .addNode("read_file_tree", readFileTree)
      .addNode("generatefile", generateFileContent)
      .addEdge(START, "read_file_tree")
      .addEdge("read_file_tree", "generatefile")
      .addEdge("generatefile", END)
      .compile();

    const inputs = {
      rootDir,
      task,
      fileName,
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

    return full_state.command;
  },
  {
    ...FMCGProperties,
  },
);
