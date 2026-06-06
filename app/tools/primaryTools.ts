/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  requestWeatherAPI,
  findProjectRoot,
  asyncExecPowerShell,
} from "@/app/helper";
import { tool, ToolRuntime } from "langchain";
import * as z from "zod";
import { fileSystemTool } from "../graphs/graph2/fileSystemGraph";
import { subAgentTaskTool } from "../sub_agent/subAgentTaskTool";
export const getWeather = tool(
  async (
    {
      city,
    }: {
      city: string;
      country: string;
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
      country: z.string(),
    }),
  },
);
const getCurrentTime = tool(
  () => {
    return `current time: ${new Date().toLocaleTimeString()}`;
  },
  {
    name: "return_current_time",
    description: "return current local time",
  },
);
const generateCode = tool(
  ({ code }: { code: string }) => {
    return `code: ${code}`;
  },
  {
    name: "generate_code",
    description: "generate user ask code using programing language",
    schema: z.object({
      code: z.string(),
    }),
  },
);

const getFileORFolderPath = tool(
  async (runtime: ToolRuntime) => {
    try {
      // const dir = path.dirname(filePath);
      // mkdirSync(dir, { recursive: true });
      // writeFileSync(filePath, content);
      const rootDir = runtime?.configurable?.rootPath;

      console.log("rood dir", rootDir);
      if (!rootDir) {
        return "no project found!";
      }
      const filePath = `Get-ChildItem -Path ${rootDir} -Filter "Welcome.tsx" -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules" }`;
      const result = await asyncExecPowerShell(filePath, rootDir);
      return result;
    } catch (e) {
      return `${e instanceof Error ? e.message : "Error while create file"}`;
    }
  },
  {
    name: "getFileORFolderPath",
    description: "get absolute file/folder path",
    // schema: z.object({
    //   filePath: z.string().describe("absolute file path"),
    //   content: z.string(),
    // }),
  },
);
export const generalShellTool = tool(
  async ({ command }: { command: string }, runtime: ToolRuntime) => {
    const rootPath = runtime?.configurable?.rootPath;
    let modifiedCommand = "";

    // if (runtime.writer) {
    //   runtime.writer({ message: "Scanning the project explore..." });
    // }

    if (!rootPath)
      return "You have currently doesn`t open any project, so you can't run shell commands that interact with file system.";

    const projectRelativePath = findProjectRoot(rootPath);
    console.log("projectRelativePath", projectRelativePath);

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
    const result = await asyncExecPowerShell(command, rootPath);
    return result;
  },
  {
    name: "generalShellTool",
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
      command: z.string(),
    }),
  },
);

export const modelTools = [
  // getWeather,
  // getCurrentTime,
  // generateCode,
  // createFile,
  // run_langgraph,
  // runReactApp,
  generalShellTool,
  // createViteProject,
  fileSystemTool,
  subAgentTaskTool,
  // updateFile,
  getFileORFolderPath,
  // TestGraph
];
