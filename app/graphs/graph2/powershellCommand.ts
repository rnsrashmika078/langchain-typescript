/* eslint-disable @typescript-eslint/no-explicit-any */
import * as z from "zod";
import { tool, ToolRuntime } from "langchain";
import { END, START, StateGraph } from "@langchain/langgraph";
import { graph1, graph2 } from "../schemas/graphSchema";
import {
  getCommand,
  isError,
  isReadDocs,
  readFileTree,
  readPowershellDocs,
  runCommand,
} from "./nodes";

export const run_langgraph = tool(
  async ({ task }: { task: string }, runtime: ToolRuntime) => {
    const rootDir = runtime?.configurable?.rootPath;
    console.log("root Dir", rootDir);
    console.log("rootDir", rootDir);
    const graph = new StateGraph(graph2)
      .addNode("read_file_tree", readFileTree)
      .addNode("get_command", getCommand)
      .addNode("run_command", runCommand)
      .addNode("read_powershell_docs", readPowershellDocs)

      .addEdge(START, "read_file_tree")
      .addConditionalEdges("read_file_tree", isReadDocs, {
        Yes: "get_command",
        No: "read_powershell_docs",
      })
      .addEdge("read_powershell_docs", "get_command")
      .addEdge("get_command", "run_command")
      .addConditionalEdges("run_command", isError, {
        Continue: "get_command",
        Done: END,
      })
      .compile();

    const inputs = {
      task,
      rootDir,
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

    return full_state.result;
  },
  {
    name: "run_langgraph",
    description: "Langgraph agent that work with the file system",
    schema: z.object({
      task: z
        .string()
        .describe("What user want to get with file system and current project"),
    }),
  },
);
