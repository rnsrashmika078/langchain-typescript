import { GraphNode } from "@langchain/langgraph";
import { graph1, graph2 } from "../schemas/graphSchema";
import { graphLanguageModel } from "@/app/agents/languageModel";
import {
  CommandStructuredOutput,
  updateContentStructuredOutput,
} from "../schemas/structuredOutputSchema";
import { execFile } from "child_process";
import { powershellDoc, stdProjectTree } from "@/markdown/markdown";
import { writeFileSync } from "fs";
import path from "path";

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
export const readFile: GraphNode<typeof graph1> = async (state, config) => {
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
        if (stderr) {
          resolve({ content: stderr });
        }
        console.log("Content", stdout);
        resolve({ content: stdout });
      },
    );
  });
};
export const updateFile: GraphNode<typeof graph1> = async (state, config) => {
  if (config.writer) {
    config.writer({ message: "Updating file paths...." });
  }
  let prompt = "";
  prompt = `
 YOU ARE AN EXPERT REACT VITE DEVELOPER.

You MUST return ONLY valid JSON.

STANDARD REACT VITE FOLDER STRUCTURE:
${stdProjectTree}

TASK:
${state.task}

OLD FILE CONTENT:
${state.content}


RULES:
- DO NOT REWRITE THE ENTIRE FILE
- CONSIDER STANDARD REACT VITE FOLDER STRUCTURE ( STRICTLY FOLLOW THIS STRUCTURE )
- ONLY MODIFY MINIMUM REQUIRED PARTS
- PRESERVE ALL UNRELATED CODE EXACTLY AS IS
- DO NOT REMOVE EXISTING FUNCTIONS OR IMPORTS unless required
- ACT LIKE A CODE PATCH SYSTEM, NOT A GENERATOR

OUTPUT FORMAT:
{
  "content": "full updated file content",
  "absoluteFilePath": "string"
}

- Only valid JSON
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
export const fixError: GraphNode<typeof graph1> = async (state, config) => {
  if (config.writer) {
    config.writer({ message: "Updating file paths...." });
  }
  let prompt = "";
  prompt = `
  YOU ARE EXPERT REACT VITE DEVELOPER
  You MUST return ONLY valid JSON.

  PLEASE FIX THE ERROR OF GIVEN CODE

  ERROR : ${state.error}
  OLD CONTENT OF THE FILE  :${state.content}

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
export const finishUpdate: GraphNode<typeof graph1> = async (state, config) => {
  if (config.writer) {
    config.writer({ message: "Updating file paths...." });
  }

  try {
    const dirModified = state.absoluteFilePath.includes("C:")
      ? state.absoluteFilePath
      : path.join(state.rootDir, state.absoluteFilePath);
    writeFileSync(dirModified, state.content, "utf-8");
    return { status: state.operation };
  } catch (err) {
    return {
      status:
        err instanceof Error ? err.message : "error while write in file sync",
    };
  }
};
