/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  requestWeatherAPI,
  findProjectRoot,
  asyncExecPowerShell,
} from "@/app/helper";
import { tool, ToolRuntime } from "langchain";
import * as z from "zod";
import { deepAgent } from "../agents/agent";
import { GeneralShellCommandGenerator } from "../graphs/graph2/GeneralShellCommandGenerator";
import { FileMutationCommandGenerator } from "../graphs/graph1/FileMutationCommandGenerator";
export const getWeather = tool(
  async (
    {
      city,
    }: {
      city: string;
    },
    config: ToolRuntime,
  ) => {
    try {
      const writer = config.writer;

      if (writer) {
        writer("Calling Weather Tool...");
      }
      const result = await requestWeatherAPI(city);

      if (!result) {
        return "error while requesting weather api.. try again";
      }
      return {
        weather: result?.condition.text,
        temperature: result?.temp_c,
        city,
        icon: result?.condition.icon,
        wind: result?.wind_kph,
      };
    } catch (error) {
      return `error while requesting weather api.. error: ${error instanceof Error ? error.message : "no internet connection"}`;
    }
  },
  {
    name: "get_weather",
    description: "Get weather",
    schema: z.object({
      city: z.string(),
    }),
  },
);
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

export const ShellCommandExecutor = tool(
  async (
    {
      command,
      // purpose,
      // path,
    }: {
      command: string;
      // purpose: "install" | "run" | "check" | "info" | "create";
      // path: string;
    },
    runtime: ToolRuntime,
  ) => {
    const rootPath = runtime?.configurable?.rootPath;
    let modifiedCommand = "";

    // if (runtime.writer) {
    //   runtime.writer({ message: "Scanning the project explore..." });
    // }

    if (!rootPath)
      return "You have currently doesn`t open any project, so you can't run shell commands that interact with file system.";

    const projectRelativePath = findProjectRoot(rootPath);

    if (
      command.includes("npm run dev") ||
      command.includes("bun run dev") ||
      command.includes("bun dev")
    ) {
      const mainCommand = command.includes(" && ")
        ? command.split(" && ")[1]
        : command;
      modifiedCommand = `cd ${projectRelativePath}; if ($?) { ${mainCommand} }`;
      // if (runtime.writer) {
      //   runtime.writer({ message: "Executing powershell command..." });
      // }

      return {
        success: true,
        message:
          "React Vite app is running in development mode. You can access it in your browser at http://localhost:5174",
        command: modifiedCommand,
      };
    }

    if (command.includes("npm install") || command.includes("bun install")) {
      const mainCommand = command.includes(" && ")
        ? command.split(" && ")[1]
        : command;
      modifiedCommand = `cd ${projectRelativePath}; if ($?) { ${mainCommand} }`;
      const result = await asyncExecPowerShell(modifiedCommand, rootPath);

      return result;
    }

    if (command.includes("cd")) {
      modifiedCommand = command.replace(command, `cd ${projectRelativePath}`);
      const result = await asyncExecPowerShell(modifiedCommand, rootPath);
      return result;
    }

    // if (purpose === "create") {
    // }
    const result = await asyncExecPowerShell(command, rootPath);
    return result;
  },
  {
    name: "ShellCommandExecutor",
    description: `
Run non-interactive PowerShell commands in the current project directory.

Package manger : npm only. no bun or yarn.

Used for:
- Node.js / npm / npx commands 
- Running dev/build/test scripts
- File system checks
- Environment/system info

Rules:
- Run ONLY ONE command per tool call
- Do NOT chain commands (no && or ;)
- Split multiple actions into separate calls
- Avoid interactive commands (like npm init, vim)

Output:
- Return stdout if available
- Return error message if failed
- If no output, return success message
`,
    schema: z.object({
      command: z.string().describe(`
          command that need to run.. usually comes from fileSystemTool call result
        `),
    }),
  },
);

export const modelTools = [
  // runDeepAgent,
  getWeather,
  FileMutationCommandGenerator,
  ShellCommandExecutor,
  GeneralShellCommandGenerator,
];
