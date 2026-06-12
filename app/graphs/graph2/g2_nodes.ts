import { GraphNode } from "@langchain/langgraph";
import { graph2 } from "../schemas/graphSchema";
import { graphLanguageModel } from "@/app/agents/languageModel";
import {
  CommandStructuredOutput,
  updateContentStructuredOutput,
} from "../schemas/structuredOutputSchema";
import { execFile } from "child_process";
import { powershellDoc } from "@/markdown/markdown";
import { writeFileSync } from "fs";
import path from "path";

// Node: => Find a path
export const getCommand: GraphNode<typeof graph2> = async (state, config) => {
  if (config.writer) {
    config.writer({ message: "Requesting Powershell command..." });
  }

  let prompt = "";

  prompt = `
  DECIDE SUITABLE POWERSHELL COMMAND BASED ON USER TASK, PROJECT FILE TREE AND POWERSHELL DOCUMENTATION

  You MUST return ONLY valid JSON.

  Output format:
{"command": "string"}

  TASK:${state.task}
  POWERSHELL DOCUMENTATION: ${powershellDoc}
  PROJECT FILE TREE: ${state.fileTree}
  CURRENT WORKING DIRECTORY: ${state.rootDir}


   Rules:
    - Only return valid JSON
    - No explanations
    - No extra text
`;
  // CURRENT WORKING DIRECTORY: ${state.rootDir}
  const structuredLlm = graphLanguageModel.withStructuredOutput(
    CommandStructuredOutput,
  );
  const result = await structuredLlm.invoke(prompt);
  return { command: result.command };
};

export const readFileTree: GraphNode<typeof graph2> = async (state, config) => {
  if (config.writer) {
    config.writer({ message: "Reading file tree...." });
  }

  const safeCommand = `Get-ChildItem -Path "${state.rootDir}"  -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules" }`;

  return new Promise((resolve) => {
    execFile(
      "powershell",
      ["-Command", safeCommand],
      { cwd: state.rootDir },
      (error, stdout, stderr) => {
        resolve({ fileTree: stdout.trim() });
      },
    );
  });
};
export const readFile: GraphNode<typeof graph2> = async (state, config) => {
  if (config.writer) {
    config.writer({ message: "Reading file paths...." });
  }

  const safeCommand = `Get-ChildItem -Path "${state.rootDir}" -Filter "${state.fileName}" -Recurse -ErrorAction SilentlyContinue |
Where-Object { $_.FullName -notmatch "node_modules" } |
ForEach-Object {
    "---- $($_.FullName) ----"
    Get-Content $_.FullName
}`;
  // const safeCommand = `Get-ChildItem -Path "${state.rootDir}" -Filter "${state.fileOrFolderName}" -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch "node_modules" }`;
  return new Promise((resolve) => {
    execFile(
      "powershell",
      ["-Command", safeCommand],
      { cwd: state.rootDir },
      (error, stdout, stderr) => {
        resolve({ content: stdout });
      },
    );
  });
};
export const updateFile: GraphNode<typeof graph2> = async (state, config) => {
  if (config.writer) {
    config.writer({ message: "Updating file paths...." });
  }
  let prompt = "";
  prompt = `
  YOU ARE EXPERT REACT VITE DEVELOPER
  You MUST return ONLY valid JSON.

  BASE ON THE TASK MODIFY/UPDATE THE CODE/CONTENT

  TASK:${state.task}
  CONTENT TO BE UPDATE OR MODIFIED:${state.content}

  Output format:
  {"content": "string", "absoluteFilePath:"string"}

   Rules:
    - Only return valid JSON
    - No explanations
    - No extra text
`;
  // CURRENT WORKING DIRECTORY: ${state.rootDir}
  const structuredLlm = graphLanguageModel.withStructuredOutput(
    updateContentStructuredOutput,
  );
  const result = await structuredLlm.invoke(prompt);
  return { content: result.content, absoluteFilePath: result.filePath };
};
export const finishUpdate: GraphNode<typeof graph2> = async (state, config) => {
  if (config.writer) {
    config.writer({ message: "Updating file paths...." });
  }
  const dirModified = state.absoluteFilePath.includes("C:")
    ? state.absoluteFilePath
    : path.join(state.rootDir, state.absoluteFilePath);
  console.log("file absolute path: ", state.absoluteFilePath);
  console.log("file content: ", state.content);
  writeFileSync(dirModified, state.content, "utf-8");
  console.log("file modified path: ", dirModified);

  return { content: "Success" };
};
