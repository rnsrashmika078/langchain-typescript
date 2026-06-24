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
import { TavilySearch } from "@langchain/tavily";

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
      const messageId = config?.configurable?.messageId;

      if (writer) {
        writer({ message: "Calling Weather Tool...", id: messageId });
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
      const messageId = config?.configurable?.messageId;
      // const safeCommand = `Get-ChildItem -Path "${rootDir}"  -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules" }`;

      const safeCommand = `
Get-ChildItem -Path "${rootDir}" -Recurse -ErrorAction SilentlyContinue |
Where-Object { $_.FullName -notmatch "node_modules" } |
Select-Object -ExpandProperty FullName
`;
      const writer = config.writer;

      if (writer) {
        writer({ message: "Scanning the project explore...", id: messageId });
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
      const messageId = config?.configurable?.messageId;

      const rootDirectory = findProjectRoot(rootDir);
      if (!rootDirectory)
        return {
          message: "No active project found!",
        };
      console.log("project path", rootDirectory);

      if (writer) {
        writer({ message: "Generating files...", id: messageId });
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
      const messageId = config?.configurable?.messageId;

      if (writer) {
        writer({ message: "Checking attached files...", id: messageId });
      }
      const referenceFile = config?.configurable?.referenceFile;
      const error = config?.configurable?.error;

      if (!referenceFile) {
        return `Found Error:${error}. Now i will fix it using FileModifier&ErrorFixer tool`;
      }

      return `reference file found: ${JSON.stringify(referenceFile)}`;
    } catch (error) {
      return `error while creating files ${error instanceof Error && error.message}`;
    }
  },
  {
    name: "checkFileAttachment",
    description: `
check weather the reference file found or not on vague prompt 
parameters: 
  task

  FLOW :
  run this tool first to read attached files
  then run FileModifier&ErrorFixer tool


  example vague prompt: 
    "fix this error"
    "try to solve error in this file"

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
    }: {
      command: string;
    },
    config: ToolRuntime,
  ) => {
    const rootPath = config?.configurable?.rootPath;
    const messageId = config?.configurable?.messageId;

    console.log("Message Id from shell command exec", messageId);
    console.log("rootPath from shell command exec", rootPath);
    let modifiedCommand = "";

    if (config.writer) {
      config.writer({ message: "Executing command...", id: messageId });
    }

    if (!rootPath) {
      return "You have currently doesn`t open any project, so you can't run shell commands that interact with file system.";
    }

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

      return {
        message:
          "React Vite app is running in development mode. You can access it in your browser at http://localhost:5174",
        command: modifiedCommand,
      };
    }

    if (command.includes("npm install") || command.includes("bun install")) {
      if (config.writer) {
        config.writer({ message: "Installing dependencies...", id: messageId });
      }
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
export const internetSearch = tool(
  async ({
    query,
    maxResults = 5,
    includeRawContent = false,
  }: {
    query: string;
    maxResults?: number;
    topic?: "general" | "news" | "finance";
    includeRawContent?: boolean;
  }) => {
    const tavilySearch = new TavilySearch({
      maxResults,
      tavilyApiKey: process.env.TAVILY_API_KEY,
      includeRawContent,
      // topic,
    });
    return await tavilySearch._call({ query });
  },
  {
    name: "internet_search",
    description: "Run a web search",
    schema: z.object({
      query: z.string().describe("The search query"),
      maxResults: z.number().optional().default(5),
      includeRawContent: z.boolean().optional().default(false),
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
  // configureTailwind,
  internetSearch,
];
