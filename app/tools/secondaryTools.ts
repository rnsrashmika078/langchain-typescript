/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  asyncExecPowerShell,
  findProjectRoot,
  requestWeatherAPI,
} from "@/app/helper";
import { mkdirSync, writeFileSync } from "fs";
import { tool, ToolRuntime } from "langchain";
import * as z from "zod";
import path, { dirname } from "path";
import { UpdateFileTool } from "../graphs/graph1/FileMutationCommandGenerator";
export const getWeatherTool = tool(
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
    name: "getWeatherTool",
    description: "Get weather",
    schema: z.object({
      city: z.string(),
    }),
  },
);
export const ReadProjectTreeTool = tool(
  async (
    {
      task,
    }: {
      task: string;
    },
    config: ToolRuntime,
  ) => {
    try {
      const rootDir = config?.configurable?.rootPath;
      // const safeCommand = `Get-ChildItem -Path "${rootDir}"  -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules" }`;

      const safeCommand = `
Get-ChildItem -Path "${rootDir}" -Recurse -ErrorAction SilentlyContinue |
Where-Object { $_.FullName -notmatch "node_modules" } |
Select-Object -ExpandProperty FullName
`;
      const writer = config.writer;

      if (writer) {
        writer("Scanning the project explore...");
      }
      const result = await asyncExecPowerShell(safeCommand, rootDir);
      return result;
    } catch (error) {
      return `error while creating files ${error instanceof Error && error.message}`;
    }
  },
  {
    name: "ReadProjectTreeTool",
    description: `
read the file tree of active project.
`,
    schema: z.object({
      task: z.string().describe(`
          Read currently open project file tree
        `),
    }),
  },
);
export const CreateFile = tool(
  async (
    {
      absoluteFilePath,
      content,
    }: {
      absoluteFilePath: string;
      content: string;
    },
    config: ToolRuntime,
  ) => {
    try {
      const writer = config.writer;
      const rootDir = config?.configurable?.rootPath;
      const rootDirectory = findProjectRoot(rootDir);
      if (!rootDirectory)
        return {
          message: "No active project found!",
        };
      console.log("project path", rootDirectory);

      if (writer) {
        writer("Generating files...");
      }
      // const rootDir = config?.configurable?.rootPath;
      const dirModified = absoluteFilePath.includes("C:")
        ? absoluteFilePath
        : path.join(rootDirectory, absoluteFilePath);
      mkdirSync(dirname(dirModified), { recursive: true });

      writeFileSync(dirModified, content, "utf-8");
      return {
        success: true,
        message: `Files Created successfully`,
      };
    } catch (error) {
      return `error while creating files ${error instanceof Error && error.message}`;
    }
  },
  {
    name: "create_simple_file",
    description: `
use to create file/files that not need much priority and not related to sequence of process

parameters: 
  content,
  absoluteFilePath
  operation

    NEVER ASSUME THE FILE PATH or rootDirectory. instead run ReadProjectTreeTool 
`,
    schema: z.object({
      content: z.string().describe(`
          file content
        `),
      absoluteFilePath: z.string().describe(`
          absolute file path to the file destination choose from ReadProjectTreeTool result
          example : "/src/component/first.txt"
        `),
      operation: z.enum(["Create", "Update"]),
    }),
  },
);
export const checkFileAttachment = tool(
  async (
    {
      task,
    }: {
      task: string;
    },
    config: ToolRuntime,
  ) => {
    try {
      const writer = config.writer;

      if (writer) {
        writer("Generating files...");
      }
      const referenceFile = config?.configurable?.referenceFile;
      if (!referenceFile) {
        return `no reference file found`;
      }

      return `reference file found: ${JSON.stringify(referenceFile)}`;
    } catch (error) {
      return `error while creating files ${error instanceof Error && error.message}`;
    }
  },
  {
    name: "checkFileAttachment",
    description: `
check weather the reference file found or not
parameters: 
  task

`,
    schema: z.object({
      task: z.string().describe(`
describe the task in 2 words `),
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
      return {
        result:
          "You have currently doesn`t open any project, so you can't run shell commands that interact with file system.",
      };

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

      return { result };
    }

    if (command.includes("cd")) {
      modifiedCommand = command.replace(command, `cd ${projectRelativePath}`);
      const result = await asyncExecPowerShell(modifiedCommand, rootPath);
      return { result };
    }

    // if (purpose === "create") {
    // }
    const result = await asyncExecPowerShell(command, rootPath);
    return { result };
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
- project must create with typescript ( .tsx / .ts) 

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
  ReadProjectTreeTool,
  CreateFile,
  getWeatherTool,
  UpdateFileTool,
  ShellCommandExecutor,
  checkFileAttachment,
];
