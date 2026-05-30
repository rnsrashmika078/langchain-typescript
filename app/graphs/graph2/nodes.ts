/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConditionalEdgeRouter, GraphNode } from "@langchain/langgraph";
import { graph2 } from "../schemas/graphSchema";
import { graphLanguageModel } from "@/app/agents/languageModel";
import {
  CommandStructuredOutput,
  PowerShellDocOutput,
} from "../schemas/structuredOutputSchema";
import { execFile } from "child_process";
import { ReadDirectory } from "@/app/helper";

// Node: => Find a path
export const getCommand: GraphNode<typeof graph2> = async (state, config) => {
  if (config.writer) {
    config.writer({ message: "Requesting Powershell command..." });
  }

  console.log("failed command", state.failedCommand);
  let prompt = "";
  if (state.error) {
    console.log("ERROR", state.error);

    prompt = `
  DECIDE SUITABLE POWERSHELL COMMAND BASED ON USER TASK, PROJECT FILE TREE AND POWERSHELL DOCUMENTATION
  You MUST return ONLY valid JSON.

  Output format:
  {"command": "string"}


  TASK: ${state.task}
  POWERSHELL DOCUMENTATION: ${state.powershellDoc}
  PROJECT FILE TREE: ${JSON.stringify(state.fileTree)}
  ROOT DIRECTORY: ${state.rootDir}

  COMMAND PATH MUST BE ABSOLUTE PATH. DONT USE RELATIVE PATH AT ALL
  

  Failed Commands list and corresponding errors : ${JSON.stringify(state.failedCommand)}

  Rules:
  - TRY NEW COMMAND THAT MATCH TO TASK. DONT USE failed command again and again
  - Only return valid JSON
  - No explanations
  - No extra text
  `;
  } else {
    prompt = `
  DECIDE SUITABLE POWERSHELL COMMAND BASED ON USER TASK, PROJECT FILE TREE AND POWERSHELL DOCUMENTATION

  You MUST return ONLY valid JSON.

  Output format:
  {command: string}

  TASK:${state.task}
  POWERSHELL DOCUMENTATION: ${state.powershellDoc}
  PROJECT FILE TREE: ${JSON.stringify(state.fileTree)}
  CURRENT WORKING DIRECTORY: ${state.rootDir}
  ROOT DIRECTORY: ${state.rootDir}


   Rules:
    - Only return valid JSON
    - No explanations
    - No extra text
`;
  }
  // CURRENT WORKING DIRECTORY: ${state.rootDir}
  const structuredLlm = graphLanguageModel.withStructuredOutput(
    CommandStructuredOutput,
  );
  const result = await structuredLlm.invoke(prompt);
  console.log("getCommand", result.command);
  return { command: result.command };
};
export const readPowershellDocs: GraphNode<typeof graph2> = async (
  state,
  config,
) => {
  if (config.writer) {
    config.writer({ message: "reading powershell docs..." });
  }

  //   const md = `
  // # Safe PowerShell Commands for AI Agent

  // This document defines a **restricted safe command set** for AI systems that interact with the file system using PowerShell.

  // #  1. File & Folder Listing (SAFE)

  // #

  // ## List all files and folders / find path / find directory
  // Get-ChildItem

  // ## Recursive listing
  // Get-ChildItem -Recurse

  // ## Only folders
  // Get-ChildItem -Directory

  // ## Only files
  // Get-ChildItem -File

  // ## Filter by extensions (useful for codebases)
  // Get-ChildItem -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx

  // #  2. File Reading (SAFE)

  // ## Read full file
  // Get-Content "path\file.ts"

  // ## Read first N lines
  // Get-Content "path\file.ts" -TotalCount 50

  // ## Stream file content
  // Get-Content "path\file.ts" | ForEach-Object { $_ }

  // # 3. Search Inside Files (VERY IMPORTANT)

  // ## Search pattern in files
  // Select-String -Path "*.ts" -Pattern "useState" -Recurse

  // ## Search across entire project
  // Get-ChildItem -Recurse -File | Select-String "console.log"
  // ---

  // #  4. Path Utilities (SAFE)

  // ## Get current directory
  // Get-Location

  // ## Check if path exists
  // Test-Path "path"

  // ## Resolve full path
  // Resolve-Path "path"

  // # 5. BLOCKED COMMANDS (DO NOT ALLOW)

  // - Remove-Item
  // - rm
  // - rmdir
  // - del
  // - Start-Process
  // - Invoke-WebRequest
  // - Set-Content
  // - New-Item (unless explicitly allowed)

  // - list_files → Get-ChildItem
  // - read_file → Get-Content
  // - search → Select-String

  // `;

  const md = `
    POWERSHELL COMMAND DOCUMENTATION
    
    1. GET A SINGLE FILE OR FOLDER PATH/LOCATION/FILE METADATA AND LIST OUT
      
        -> Get-ChildItem -Path "<absolute_root_Directory>" -Filter "<file/folder name>" -Recurse -ErrorAction SilentlyContinue
        EXAMPLE: 
          Get-ChildItem -Path "C:\\Users\\John\\OneDrive\\Desktop\\ReactProject" -Filter "components" -Recurse -ErrorAction SilentlyContinue

    2. GET A SINGLE FILE CONTENT

      ->Get-Content -Path "<absolute_file_path>\<filename>.<extension>" -Raw
        EXAMPLE:
          Get-Content -Path "C:\\Users\\John\\OneDrive\\Desktop\\ReactProject\\src\\App.jsx" -Raw

    3. LIST OUT DIRECTORY

      -> Get-ChildItem -Path "<absolute_root_Directory>" -Recurse -ErrorAction SilentlyContinue
      EXAMPLE:
          Get-ChildItem -Path "C:\\Users\\John\\OneDrive\\Desktop\\ReactProject" -Recurse -ErrorAction SilentlyContinue

`;
  // const prompt = `
  // READ BELOW MARKDOWN FILE TO UNDERSTAND ABOUT POWERSHELL COMMANDS

  // POWERSHELL COMMANDS DOCUMENTS: ${md}

  // EXCLUDE THIS FOLDER: node_modules

  // You MUST return ONLY valid JSON.

  // Output format:
  // {powershellDoc: string}

  // Rules:
  // - Only return JSON
  // - Do NOT explain
  // - Do NOT add extra text
  // - Only use read-only commands unless explicitly allowed
  // - Never delete or modify system files
  // - Never execute external scripts or downloads
  // - Always prefer Get-ChildItem + Get-Content + Select-String
  // - Treat file system as read-only by default
  // `;

  // const structuredLlm =
  //   graphLanguageModel.withStructuredOutput(PowerShellDocOutput);
  // const result = await structuredLlm.invoke(prompt);
  // console.log("getCommand", result.powershellDoc);
  return { powershellDoc: md };
};
export const readFileTree: GraphNode<typeof graph2> = async (state, config) => {
  if (config.writer) {
    config.writer({ message: "Reading file tree...." });
  }
  // const safeCwd = path.resolve(state.rootDir);
  const result = await ReadDirectory(state.rootDir);
  return { fileTree: result.tree };
};
export const isError: ConditionalEdgeRouter<typeof graph2> = (
  state,
  config,
) => {
  if (config.writer) {
    config.writer({ message: "Checking errors..." });
  }

  if (state.error) return "Continue";
  return "Done";
};
export const isReadDocs: ConditionalEdgeRouter<typeof graph2> = (
  state,
  config,
) => {
  if (config.writer) {
    config.writer({ message: "Checking Memory..." });
  }

  if (state.powershellDoc) return "Yes";
  return "No";
};
export const isReadFileTree: ConditionalEdgeRouter<typeof graph2> = (
  state,
  config,
) => {
  if (config.writer) {
    config.writer({ message: "Checking Memory..." });
  }

  if (state.fileTree) return "Yes";
  return "No";
};
export const runCommand: GraphNode<typeof graph2> = async (state, config) => {
  if (config.writer) {
    config.writer({ message: "Running Powershell command..." });
  }

  let safeCommand = state.command;

  if (
    state.command.includes("Get-ChildItem") ||
    state.command.includes("ls") ||
    state.command.includes("dir")
  ) {
    safeCommand = `
  ${state.command} | Where-Object { $_.FullName -notmatch "node_modules" }
  `;
  }
  console.log("command", safeCommand);

  try {
    return new Promise((resolve) => {
      execFile(
        "powershell",
        ["-Command", safeCommand],
        { cwd: state.rootDir },
        (error, stdout, stderr) => {
          if (error)
            return resolve({
              error: error.message,
              failedCommand: [
                ...(state.failedCommand ?? []),
                {
                  failedCommand: state.command,
                  error: error ? (error.message as any) : undefined,
                },
              ],
            });
          if (stderr)
            return resolve({
              error: stderr,
              failedCommand: [
                ...(state.failedCommand ?? []),
                {
                  failedCommand: state.command,
                  error: stderr ? (stderr as any) : undefined,
                },
              ],
            });

          resolve({
            result: stdout || "Command Execute Silently.",
            error: error || stderr ? error || (stderr as any) : undefined,
            failedCommand: error
              ? [
                  ...(state.failedCommand ?? []),
                  {
                    failedCommand: state.command,
                    error: error ? (error as any) : undefined,
                  },
                ]
              : undefined,
          });
        },
      );
      console.log("error", state.error);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unkown error ";
    return { error: message };
  }
};
