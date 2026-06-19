/* eslint-disable @typescript-eslint/no-explicit-any */
import { tool, ToolRuntime } from "langchain";
import { END, START, StateGraph } from "@langchain/langgraph";
import { graph1 } from "../schemas/graphSchema";
import {
  finishUpdate,
  fixError,
  readFile,
  updateFile,
} from "../graph2/g2_nodes";
import z from "zod";
import { routeDecision } from "./router";
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
      const error = config?.configurable?.error;
      const graph = new StateGraph(graph1)
        .addNode("readFile", readFile)
        .addNode("updateFile", updateFile)
        .addNode("fixError", fixError)
        .addNode("finishUpdate", finishUpdate)
        .addNode("conditionRouter", async () => {})

        .addEdge(START, "conditionRouter")
        .addConditionalEdges("conditionRouter", routeDecision, {
          updateOnly: "updateFile",
          readOnly: "readFile",
          ErrorFixOnly: "fixError",
        })
        .addEdge("readFile", END)
        .addEdge("fixError", "finishUpdate")
        .addEdge("updateFile", "finishUpdate")
        .addEdge("finishUpdate", END)
        // .addEdge("updateFile", END)
        .compile();

      const inputs = {
        rootDir,
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
            config.writer(custom.message);
          }
        }
      }
      // const state = graph.invoke(inputs);

      return { content: full_state.content, updates };
    } catch (error) {
      return `error while performing the action ${error instanceof Error && error.message}`;
    }
  },
  {
    name: "UpdateFileTool",
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
