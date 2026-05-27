/* eslint-disable @typescript-eslint/no-explicit-any */
import * as z from "zod";
import { tool, ToolRuntime } from "langchain";
import { llm } from "../chat/model";
import {
  END,
  GraphNode,
  START,
  StateGraph,
  StateSchema,
} from "@langchain/langgraph";

// Graph state
const State = new StateSchema({
  task: z.string(),
  absolute_path: z.string(),
  rootPath: z.string(),
  fileTree: z.any(),
  knowledge_base: z.string(),
});
// Schema for structured output -> file path
const FilePathStructuredOutput = z.object({
  absolute_path: z
    .string()
    .describe("Suitable Absolute directory path to the file"),
});
// Schema for structured output -> file strcuture recall
const StandardReactProjectStructure = z.object({
  knowledge_base: z
    .string()
    .describe(
      "he knowledge you gain from read md file about react project standard structure",
    ),
});

// Node: => Find a path
const determineFilePath: GraphNode<typeof State> = async (state, config) => {
  if (config.writer) {
    config.writer({ message: "Determine the best path for the file" });
  }

  const prompt = `
YOU ARE ABSOLUTE PATH FINDER
You MUST return ONLY valid JSON.

Output format:
{"absolute_path": "string"}

Task:
${state.task}

ROOT ABSOLUTE PATH: ${state.rootPath}

File Tree:
${JSON.stringify(state.fileTree)}

Knowledge about standard file tree:
${state.knowledge_base}

Rules:
- Only return JSON
- Do NOT explain
- Do NOT add extra text
`;

  const structuredLlm = llm.withStructuredOutput(FilePathStructuredOutput);
  const result = await structuredLlm.invoke(prompt);
  return { absolute_path: result.absolute_path };
};

// Node: => Find a path
const recallStandardStructure: GraphNode<typeof State> = async (
  state,
  config,
) => {
  if (config.writer) {
    config.writer({ message: "Determine the best path for the file" });
  }

  const knowledge = `
  # Standard Project Structure

## Read this file and understand the react project Structure

├── public/ # Static assets (not processed by Webpack/Vite)
│ ├── favicon.ico
│ ├── index.html # Main HTML entry point
│ └── manifest.json # Metadata for PWA
├── src/ # Source code for the application
│ ├── assets/ # Images, fonts, and global icons
│ ├── components/ # Reusable UI components (Buttons, Inputs)
│ │ └── common/
│ ├── contexts/ # React Context API files for global state
│ ├── hooks/ # Custom React hooks
│ ├── pages/ # Main page views/routes (Home, Login)
│ ├── services/ # API calls and external integrations
│ ├── utils/ # Helper functions (date formatting, etc.)
│ ├── App.jsx # Main App component
│ ├── index.css # Global styles
│ └── main.jsx # Entry point for React rendering
├── .gitignore # Files to ignore in Git
├── package.json # Project dependencies and scripts
└── README.md # Project documentation

  `;
  const prompt = `
    You are an expert React developer.

    Your task is to extract and understand the STANDARD Vite + React project structure from the provided markdown.
    YOU DO NOT CREATE ANY FILE OR ANY THING HERE.. JUST GAIN KNOWLEDGE ABOUT  React project structure
    Output format:
    {{ knowledge_base: "string" }}

    Task:
    Recall the Below Markdown Content about the React Standard file structure

    Markdown content:
    ${knowledge}

    Rules:
    - Only return valid JSON
    - No explanations
    - No extra text
   `;

  const structuredLlm = llm.withStructuredOutput(StandardReactProjectStructure);
  const result = await structuredLlm.invoke(prompt);
  return { knowledge_base: result.knowledge_base };
};

export interface Tree {
  id: string;
  type: string;
  name: string;
  path: string;
  isExpanded: boolean;
  children?: Tree[];
}

export const run_langgraph = tool(
  async ({ task }: { task: string }, runtime: ToolRuntime) => {
    const rootPath = runtime?.configurable?.rootPath;
    const fileTree = runtime?.configurable?.fileTree;
    const configurable = runtime?.configurable;

    console.log("file Tree", fileTree);
    console.log("Configurable", configurable);

    const graph = new StateGraph(State)
      .addNode("determine_path", determineFilePath)
      .addNode("recall_knowledge", recallStandardStructure)

      .addEdge(START, "recall_knowledge")
      .addEdge("recall_knowledge", "determine_path")
      .addEdge("determine_path", END)

      .compile();

    const inputs = {
      task,
      rootPath,
      fileTree,
      absolute_path: "",
    };

    let full_state: any = null;
    let custom: any = null;

    for await (const [mode, chunk] of await graph.stream(inputs, {
      streamMode: ["values", "custom"],
    })) {
      if (mode === "values") {
        // 'chunk' is your state object
        full_state = chunk;
      } else if (mode === "custom") {
        if (runtime.writer) {
          custom = chunk;
          runtime.writer(custom.message);
        }
      }
    }

    console.log("full state", full_state);
    console.log("custom", custom);

    return `file create successful at ${full_state?.absolute_path}`;
  },
  {
    name: "run_langgraph",
    description: "Langgraph agent that work with the file system",
    schema: z.object({
      task: z.string().describe("Task user given to you"),
    }),
  },
);
