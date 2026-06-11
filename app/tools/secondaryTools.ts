/* eslint-disable @typescript-eslint/no-explicit-any */
import { asyncExecPowerShell } from "@/app/helper";
import { mkdirSync, writeFileSync } from "fs";
import { tool, ToolRuntime } from "langchain";
import path, { dirname } from "path";
import * as z from "zod";

export const ReadProjectTreeTool = tool(
  async (
    {
      task,
    }: {
      task: string;
    },
    runtime: ToolRuntime,
  ) => {
    const rootDir = runtime?.configurable?.rootPath;
    const safeCommand = `Get-ChildItem -Path "${rootDir}"  -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules" }`;

    if (runtime.writer) {
      runtime.writer("Scanning the project explore...");
    }
    const result = await asyncExecPowerShell(safeCommand, rootDir);
    return result;
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
export const CreateFileTool = tool(
  async (
    {
      absoluteFilePath,
      content,
    }: {
      absoluteFilePath: string;
      content: string;
    },
    runtime: ToolRuntime,
  ) => {
    const rootDir = runtime?.configurable?.rootPath;
    console.log("absolute path", absoluteFilePath);
    // const dir = dirname(rootDir);
    mkdirSync(absoluteFilePath, { recursive: true });
    const paths = rootDir + "\\" + absoluteFilePath;

    writeFileSync(paths, content, "utf-8");
    return "Files created successfully" ;
  },
  {
    name: "CreateFileTool",
    description: `
create file/files 
`,
    schema: z.object({
      task: z.string().describe(`
        task name
        `),
      content: z.string().describe(`
          file content
        `),
      absoluteFilePath: z.string().describe(`
          absolute file path to the file destination
          NEVER ASSUME THE FILE PATH
        `),
    }),
  },
);

export const modelTools = [ReadProjectTreeTool, CreateFileTool];

//     // const safeCommand = `Get-ChildItem -Path "${rootDir}"  -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules" }`;
//     const safeCommand = `Set-Content -Path "${absoluteFilePath}" -Value @"
//     ${content}
// "@`;
//     if (runtime.writer) {
//       runtime.writer("Scanning the project explore...");
//     }
//     const result = await asyncExecPowerShell(safeCommand, rootDir);
//     return result;
