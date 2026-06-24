/* eslint-disable @typescript-eslint/no-explicit-any */
import { tool, ToolRuntime } from "langchain";
import { END, START, StateGraph } from "@langchain/langgraph";
import { graph1 } from "../schemas/graphSchema";
import {
  createFile,
  finishUpdate,
  fixError,
  readFile,
  updateFile,
} from "../graph1/g1_nodes";
import z from "zod";

import { routeDecision, routeDecision_II } from "./router";
import { findProjectRoot } from "@/app/helper";

export const UpdateFileTool = tool(
  async (
    {
      task,
      fileName,
      operation,
    }: {
      task: string;
      fileName: string;
      operation: "READ" | "UPDATE" | "FIXERROR" | "DELETE";
    },
    config: ToolRuntime,
  ) => {
    try {
      const rootDir = config?.configurable?.rootPath;
      const rootDirectory = findProjectRoot(rootDir);
      const error = config?.configurable?.error;
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
        .addEdge("createFile", "finishUpdate")
        .addEdge("updateFile", "finishUpdate")
        .addEdge("finishUpdate", END)
        // .addEdge("updateFile", END)
        .compile();

      const inputs = {
        rootDir: rootDirectory ?? undefined,
        task,
        fileName,
        error,
        operation,
      };

      let full_state: any = "";
      let updates: any = "";
      let custom: any = "";

      for await (const [mode, chunk] of await graph.stream(inputs, {
        streamMode: ["values", "custom", "updates"],
      })) {
        if (mode === "values") {
          full_state = chunk;
        } else if (mode === "updates") {
          updates = chunk;
        } else if (mode === "custom") {
          if (config.writer) {
            custom = chunk;
            config.writer({ message: custom.message, id: custom.id });
          }
        }
      }
      // const state = graph.invoke(inputs);

      return { content: full_state.content };
    } catch (error) {
      return `error while performing the action ${error instanceof Error && error.message}`;
    }
  },
  {
    name: "FileModifier&ErrorFixer",
    description: `

          Read and update file/files content ( PLANNER ONLY )
          `,
    schema: z.object({
      task: z.string().describe(
        `Describe the task
    `,
      ),
      operation: z.enum(["UPDATE", "DELETE", "READ"]),
      fileName: z.string().describe("file /folder name only .. no paths "),
    }),
  },
);
