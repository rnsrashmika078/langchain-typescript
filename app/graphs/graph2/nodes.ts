/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConditionalEdgeRouter, GraphNode } from "@langchain/langgraph";
import { graph2 } from "../schemas/graphSchema";
import { graphLanguageModel } from "@/app/agents/languageModel";
import { CommandStructuredOutput } from "../schemas/structuredOutputSchema";
import { execFile } from "child_process";

// Node: => Find a path
export const getCommand: GraphNode<typeof graph2> = async (state, config) => {
  if (config.writer) {
    config.writer({ message: "Requesting Powershell command..." });
  }

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
  PROJECT FILE TREE: ${state.fileTree}
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
  PROJECT FILE TREE: ${state.fileTree}
  CURRENT WORKING DIRECTORY: ${state.rootDir}


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
  return { command: result.command };
};
export const readPowershellDocs: GraphNode<typeof graph2> = async (
  state,
  config,
) => {
  if (config.writer) {
    config.writer({ message: "reading powershell docs..." });
  }

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

  return { powershellDoc: md };
};
export const readFileTree: GraphNode<typeof graph2> = async (state, config) => {
  if (config.writer) {
    config.writer({ message: "Reading file tree...." });
  }

  const safeCommand = `Get-ChildItem -Path "${state.rootDir}"  -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules" }`;

  console.log("safeCommand", safeCommand);
  return new Promise((resolve) => {
    execFile(
      "powershell",
      ["-Command", safeCommand],
      { cwd: state.rootDir },
      (error, stdout, stderr) => {
        console.log("FILE TREE", stdout);
        resolve({ fileTree: stdout });
      },
    );
  });
};
export const readFilePath: GraphNode<typeof graph2> = async (state, config) => {
  if (config.writer) {
    config.writer({ message: "Reading file paths...." });
  }

  const safeCommand = `Get-ChildItem -Path "${state.rootDir}" -Filter "${state.fileOrFolderName}" -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules" }`;

  console.log("safeCommand", safeCommand);
  return new Promise((resolve) => {
    execFile(
      "powershell",
      ["-Command", safeCommand],
      { cwd: state.rootDir },
      (error, stdout, stderr) => {
        console.log("FILE PATH", stdout);
        resolve({ fileTree: stdout });
      },
    );
  });
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
export const isLoopDone: ConditionalEdgeRouter<typeof graph2> = (
  state,
  config,
) => {
  if (config.writer) {
    config.writer({ message: "Checking next task..." });
  }

  if (state.fileTree) return "Yes";
  return "No";
};
export const runCommand: GraphNode<typeof graph2> = async (state, config) => {
  if (config.writer) {
    config.writer({ message: "Running Powershell command..." });
  }

  let safeCommand = state.command;
  console.log("FILE TREEEE: ", state.fileTree);

  const hasGetChildItem =
    safeCommand.includes("Get-ChildItem") ||
    safeCommand.includes("ls") ||
    safeCommand.includes("dir");

  if (hasGetChildItem) {
    safeCommand += ' | Where-Object { $_.FullName -notmatch "node_modules" }';
  }

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
            result: stdout || "required file or project not found!",
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
    const message = err instanceof Error ? err.message : "unknown error ";
    return { error: message };
  }
};
