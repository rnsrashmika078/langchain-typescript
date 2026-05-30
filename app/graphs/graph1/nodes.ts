import { GraphNode } from "@langchain/langgraph";
import { graph1 } from "../schemas/graphSchema";
import { graphLanguageModel } from "@/app/agents/languageModel";
import {
  FileContentStructuredOutput,
  FilePathStructuredOutput,
  StandardReactProjectStructure,
} from "../schemas/structuredOutputSchema";
import { CreateFile, ReadDirectory } from "@/app/helper";

// Node: => Find a path
export const determineFilePath: GraphNode<typeof graph1> = async (
  state,
  config,
) => {
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

  const structuredLlm = graphLanguageModel.withStructuredOutput(
    FilePathStructuredOutput,
  );
  const result = await structuredLlm.invoke(prompt);
  return { absolute_path: result.absolute_path };
};
export const recallStandardStructure: GraphNode<typeof graph1> = async (
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
   {"knowledge_base": "string"}

    Task:
    Recall the Below Markdown Content about the React Standard file structure

    Markdown content:
    ${knowledge}

    Rules:
    - Only return valid JSON
    - No explanations
    - No extra text
   `;

  const structuredLlm = graphLanguageModel.withStructuredOutput(
    StandardReactProjectStructure,
  );
  const result = await structuredLlm.invoke(prompt);
  return { knowledge_base: result.knowledge_base };
};
export const readFileTree: GraphNode<typeof graph1> = async (state, config) => {
  if (config.writer) {
    config.writer({ message: "Reading file tree...." });
  }
  const result = await ReadDirectory(state.rootPath);
  return { fileTree: result.tree };
};
export const generateFileContent: GraphNode<typeof graph1> = async (
  state,
  config,
) => {
  if (config.writer) {
    config.writer({ message: "Generating file content..." });
  }

  const prompt = `
    YOU ARE CONTENT GENERATOR
    Generate file content based on TASK
    You MUST return ONLY valid JSON.
    
     Output format:
    {"content": "string"}
    
    Task : ${state.task}
    
    Rules:
    - Only return JSON
    - Do NOT explain
    - GENERATE JUST CONTENT ONLY 
    `;
  const structuredLlm = graphLanguageModel.withStructuredOutput(
    FileContentStructuredOutput,
  );
  const result = await structuredLlm.invoke(prompt);
  return { content: result.content };
};
export const generateFile: GraphNode<typeof graph1> = async (state, config) => {
  if (config.writer) {
    config.writer({ message: "Generating file ..." });
  }
  const result = await CreateFile(state.absolute_path, state.content);
  return { task_status: result.success ? "Success" : "Failed" };
};

export const cleanState: GraphNode<typeof graph1> = () => {
  return {
    content: "",
    task_status: "Empty",
  };
};
