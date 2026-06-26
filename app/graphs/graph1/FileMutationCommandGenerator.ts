/* eslint-disable @typescript-eslint/no-explicit-any */
import { tool, ToolRuntime } from "langchain";
import { v4 as uuid } from "uuid";
import z from "zod";

import { findProjectRoot } from "@/app/helper";
import { compiledGraph } from "./graph";

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
      const threadId = config?.configurable?.thread_id;
      const agentState = config?.state;
      // const threadId = uuid();

      console.log("thread id ", threadId);

      const configs = {
        configurable: { thread_id: threadId },
      };

      const rootDirectory = findProjectRoot(rootDir);
      const error = config?.configurable?.error;
      const inputs = {
        rootDir: rootDirectory ?? undefined,
        task,
        fileName,
        error,
        operation,
      };

      // let full_state: any = null;
      // let custom: any = null;

      // for await (const [mode, chunk] of await compiledGraph.stream(inputs, {
      //   configurable: configs.configurable,
      //   runName: "fileoperation",
      //   streamMode: ["values", "custom", "updates", "checkpoints"],
      // })) {
      //   if (mode === "values") {
      //     // if (mode === "values") {
      //     full_state = chunk;
      //   } else if (mode === "custom") {
      //     if (config.writer) {
      //       custom = chunk;
      //       config.writer({ message: custom.message, id: custom.id });
      //     }
      //   }
      // }

      const state = await compiledGraph.invoke(inputs, {
        configurable: configs.configurable,
      });
      // return { content: full_state.content };
      console.log("state", state);
      // return { content: state.content };
      return {
        relativeFilePath: state.relativeFilePath,
        rootDir: state.rootDir,
        content: state.content,
        operation: state.operation,
        ...(state.operation != "READ"
          ? { nextStep: `run toolA to actual file ${state.operation}` }
          : {}),
      };
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
