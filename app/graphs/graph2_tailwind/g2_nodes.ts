import { GraphNode } from "@langchain/langgraph";
import { graph1 } from "../schemas/graphSchema";
import { graphLanguageModel } from "@/app/agents/languageModel";
import { updateContentStructuredOutput } from "../schemas/structuredOutputSchema";
import { execFile } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import path, { dirname } from "path";

export const readFile: GraphNode<typeof graph1> = async (state, config) => {
  if (config.writer) {
    config.writer({ message: "Reading Directories...", id: state.messageId });
  }

  const safeCommand = `Get-ChildItem -Path "${state.rootDir}" -Filter "${state.fileName}" -Recurse -ErrorAction SilentlyContinue |
Where-Object { $_.FullName -notmatch "node_modules" } |
ForEach-Object {
    "---- $($_.FullName) ----"
    Get-Content $_.FullName
}`;
  return new Promise((resolve) => {
    execFile(
      "powershell",
      ["-Command", safeCommand],
      { cwd: state.rootDir },
      (error, stdout, stderr) => {
        if (stderr) {
          resolve({ content: stderr });
        }
        resolve({ content: stdout });
      },
    );
  });
};
export const updateFile: GraphNode<typeof graph1> = async (state, config) => {
  if (config.writer) {
    config.writer({
      message: "Generating file contents for update files...",
      id: state.messageId,
    });
  }
  const prompt = `
You are a React + Vite expert.

You MUST update ONLY ONE file.

STRICT RULES:
- DO NOT create new components in this file
- DO NOT include code for other files
- DO NOT add comments like "// src/components/..."
- DO NOT generate multiple components in one file
- DO NOT move code to other files
- ONLY modify the existing component in this file

FILE TO UPDATE:
${state.relativeFilePath}

TASK:
${state.task}

OLD CONTENT:
${state.content}

OUTPUT RULES:
- Return ONLY valid JSON
- No explanations
- No extra text
- Return FULL updated content
- Keep structure same unless explicitly required

FORMAT:
{"content":"string","relativeFilePath":"string"}
`;
  const structuredLlm = graphLanguageModel.withStructuredOutput(
    updateContentStructuredOutput,
  );
  const result = await structuredLlm.invoke(prompt);

  return { content: result.content, relativeFilePath: result.filePath };
};
export const createFile: GraphNode<typeof graph1> = async (state, config) => {
  if (config.writer) {
    config.writer({
      message: "Generating file contents for create file...",
      id: state.messageId,
    });
  }
  const prompt = `
You are a React + Vite expert.
Generate the content based on given task

CONSIDER BELOW  BEST PRACTICES AS WELL
 
BEST PRACTICES
------------------
REACT + VITE:
- Use functional components only.
- Must be minimal code as well
- Each component must be separate file
- Always use TypeScript (.ts/.tsx).
- Keep components small, reusable, and strongly typed.
- Avoid inline logic inside JSX (move logic above return).
- Use hooks properly (useState, useEffect, custom hooks).
- Never mutate state directly.
- Use strict typing for props, state, and events.
- Keep file structure modular (components/, pages/, hooks/).

TAILWIND CSS STYLING RULES:
- Use Tailwind CSS for all styling (no CSS files unless necessary).
- Prefer utility classes over custom CSS.
- Avoid inline styles (style={{}}) unless dynamic edge case.
- Use className composition for conditional styling.
- Keep class names readable (use clsx or cn helper if needed).
- Maintain consistent spacing, typography, and responsive design using Tailwind utilities.

PERFORMANCE RULES:
- Avoid unnecessary re-renders.
- Use React.memo, useCallback, useMemo when required.
- Split large components into smaller ones.
- Lazy load pages/components when possible.

TASK:
${state.task}


Rules:
- Return ONLY valid JSON
- No explanations or extra text
- Return FULL updated content (not partial)
- Keep existing working code, change only what is needed

Format:
{"content":"string","absoluteFilePath":"string"}
`;
  const structuredLlm = graphLanguageModel.withStructuredOutput(
    updateContentStructuredOutput,
  );
  const result = await structuredLlm.invoke(prompt);

  return { content: result.content, absoluteFilePath: result.filePath };
};

export const fixError: GraphNode<typeof graph1> = async (state, config) => {
  if (config.writer) {
    config.writer({
      message: "Fixing errors in project...",
      id: state.messageId,
    });
  }
  const prompt = `
You are a React + Vite expert.
Fix the error in the given code.


CONSIDER BELOW  BEST PRACTICES AS WELL

BEST PRACTICES
------------------
REACT + VITE:
- Use functional components only.
- Always use TypeScript (.ts/.tsx).
- Keep components small, reusable, and strongly typed.
- Avoid inline logic inside JSX (move logic above return).
- Use hooks properly (useState, useEffect, custom hooks).
- Never mutate state directly.
- Use strict typing for props, state, and events.
- Keep file structure modular (components/, pages/, hooks/).

TAILWIND CSS STYLING RULES:
- Use Tailwind CSS for all styling (no CSS files unless necessary).
- Prefer utility classes over custom CSS.
- Avoid inline styles (style={{}}) unless dynamic edge case.
- Use className composition for conditional styling.
- Keep class names readable (use clsx or cn helper if needed).
- Maintain consistent spacing, typography, and responsive design using Tailwind utilities.

PERFORMANCE RULES:
- Avoid unnecessary re-renders.
- Use React.memo, useCallback, useMemo when required.
- Split large components into smaller ones.
- Lazy load pages/components when possible.

ERROR:
${state.error}

CODE:
${state.content}

Rules:
- Return ONLY valid JSON
- No explanation, no extra text
- Always return FULL updated code
- Do minimal changes to fix error
- Keep existing working code

Format:
{"content":"string","relativeFilePath":"string"}
`;
  const structuredLlm = graphLanguageModel.withStructuredOutput(
    updateContentStructuredOutput,
  );
  const result = await structuredLlm.invoke(prompt);
  return { content: result.content, relativeFilePath: result.filePath };
};
export const finishUpdate: GraphNode<typeof graph1> = async (state, config) => {
  if (config.writer) {
    config.writer({
      message: `${state.operation} file paths....`,
      id: state.messageId,
    });
  }

  try {
    const dirModified = path.isAbsolute(state.relativeFilePath)
      ? state.relativeFilePath
      : path.join(state.rootDir, state.relativeFilePath);
    mkdirSync(dirname(dirModified), { recursive: true });

    writeFileSync(dirModified, state.content || "", "utf-8");

    return { ...state, status: state.operation };
  } catch (err) {
    return {
      status:
        err instanceof Error ? err.message : "error while write in file sync",
    };
  }
};
