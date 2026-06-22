/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  requestWeatherAPI,
  findProjectRoot,
  asyncExecPowerShell,
} from "@/app/helper";
import { tool, ToolRuntime } from "langchain";
import * as z from "zod";
import { deepAgent } from "../agents/agent";
// import { GeneralShellCommandGenerator } from "../graphs/graph2/GeneralShellCommandGenerator";
// import { FileMutationCommandGenerator } from "../graphs/graph1/FileMutationCommandGenerator";

export const runDeepAgent = tool(
  async ({ task }: { task: string }) => {
    const result: any = await deepAgent.invoke({
      messages: [{ role: "user", content: task }],
    });
    return result.messages[0].content;
  },
  {
    name: "runDeepAgent",
    description: "Create or overwrite a file with given content",
    schema: z.object({
      task: z.string().describe("Use given task"),
    }),
  },
);



export const modelTools = [
  // runDeepAgent,
  getWeatherTool,
  // FileMutationCommandGenerator,
  ShellCommandExecutor,
  // GeneralShellCommandGenerator,
];
