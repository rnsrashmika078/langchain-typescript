/* eslint-disable @typescript-eslint/no-explicit-any */
import { asyncExecPowerShell } from "@/app/helper";
import { mkdirSync, writeFileSync } from "fs";
import { tool, ToolRuntime } from "langchain";
import * as z from "zod";
// import { getWeatherTool, shellTool } from "./primaryTools";
import { getWeatherTool, ShellCommandExecutor } from "./primaryTools";
import path, { dirname } from "path";
import { UpdateFileTool } from "../graphs/graph1/FileMutationCommandGenerator";

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

      if (writer) {
        writer("Generating files...");
      }
      const rootDir = config?.configurable?.rootPath;
      const dirModified = absoluteFilePath.includes("C:")
        ? absoluteFilePath
        : path.join(rootDir, absoluteFilePath);
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

    NEVER ASSUME THE FILE PATH. instead run ReadProjectTreeTool 
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

export const modelTools = [
  ReadProjectTreeTool,
  CreateFile,
  getWeatherTool,
  UpdateFileTool,
  ShellCommandExecutor,
  checkFileAttachment,
];
