/* eslint-disable @typescript-eslint/no-explicit-any */
import { tool, ToolRuntime } from "langchain";
import { END, START, StateGraph } from "@langchain/langgraph";
import { graph1 } from "../schemas/graphSchema";
import { FMCGProperties } from "@/markdown/tool_properties";
import { finishUpdate, readFile, updateFile } from "../graph2/g2_nodes";
import { generateFileContent } from "./g1_nodes";
import z from "zod";
export const UpdateFileTool = tool(
  async (
    { task, fileName }: { task: string; fileName: string },
    runtime: ToolRuntime,
  ) => {
    const rootDir = runtime?.configurable?.rootPath;
    const graph = new StateGraph(graph1)
      .addNode("readFile", readFile)
      .addNode("updateFile", updateFile)
      .addNode("finishUpdate", finishUpdate)
      .addEdge(START, "readFile")
      .addEdge("readFile", "updateFile")
      .addEdge("updateFile", "finishUpdate")
      .addEdge("finishUpdate", END)
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
    return "successfully update the file";
  },
  {
    name: "UpdateFileTool",
    description: `
          Read and update file/files content
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
