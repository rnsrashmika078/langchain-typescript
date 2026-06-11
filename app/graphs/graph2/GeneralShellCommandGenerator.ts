/* eslint-disable @typescript-eslint/no-explicit-any */
import * as z from "zod";
import { tool, ToolRuntime } from "langchain";
import {
  // Command,
  ConditionalEdgeRouter,
  END,
  GraphNode,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { graph2 } from "../schemas/graphSchema";
import { getCommand, readFilePath, readFileTree } from "./g2_nodes";
import { graphLanguageModel } from "@/app/agents/languageModel";
// import { getPostgressCheckpointer } from "@/app/memory/memorySavers";

// const checkpointer = await getPostgressCheckpointer();

const routeSchema = z.object({
  step: z
    .enum(["first", "second", "third"])
    .describe("The next step in the routing process"),
});

const router = graphLanguageModel.withStructuredOutput(routeSchema);

const llmCallRouter: GraphNode<typeof graph2> = async (state) => {
  const prompt = `
You are a router for file system tasks.

You MUST return ONLY valid JSON.
Do NOT return plain text.

Format:
{ "step": "first" } OR { "step": "second" } OR { "step": "third" } OR {"step" : "fourth"}

Rules:
- If the task is about folder structure, listing files → first
- If the task is about a specific file but not related to coding issue (e.g., README.md, Welcome.tsx, find file content, find file path) → second
- If the task is about Create file/folder → third
- If the task is about code fixing / current the code → fourth
`;
  const decision = await router.invoke([
    {
      role: "system",
      content: prompt,
    },
    {
      role: "user",
      content: state.task,
    },
  ]);

  return { decision: decision.step };
};

const routeDecision: ConditionalEdgeRouter<typeof graph2, any> = (state) => {
  if (state.decision === "first") {
    return "read_file_tree";
  } else if (state.decision === "second") {
    return "read_file_path";
  } else {
    return "third";
  }
};

export const GeneralShellCommandGenerator = tool(
  async (
    { task, fileOrFolderName }: { task: string; fileOrFolderName: string },
    runtime: ToolRuntime,
  ) => {
    const rootDir = runtime?.configurable?.rootPath;
    // const thread_id = runtime?.configurable?.thread_id;
    const graph = new StateGraph(graph2)

      // Route A
      .addNode("read_file_tree", readFileTree)

      // Route B
      .addNode("read_file_path", readFilePath)

      .addNode("get_command", getCommand)

      // Route D

      // common
      .addNode("llmCallRouter", llmCallRouter)

      //start
      .addEdge(START, "llmCallRouter")

      // conditional
      .addConditionalEdges("llmCallRouter", routeDecision, [
        "read_file_tree",
        "read_file_path",
      ])

      //folder path route
      .addEdge("read_file_tree", "get_command")
      .addEdge("read_file_path", "get_command")
      .addEdge("get_command", END)

      .compile();
    // { checkpointer: checkpointer }
    // const config = { configurable: { thread_id } };

    const inputs = {
      task,
      rootDir,
      fileOrFolderName,
    };

    let full_state: any = "";
    let custom: any = "";

  for await (const [mode, chunk] of await graph.stream(inputs, {
      // ...config,
      streamMode: ["values", "custom"],
    })) {
      if (mode === "values") {
        full_state = chunk;
      } else if (mode === "custom") {
        if (runtime.writer) {
          custom = chunk;
          runtime.writer(custom.message);
        }
      }
    }
    return full_state.command;
  },
  {
    name: "GeneralShellCommandGenerator",
    description: `
      Tool to interact with the project file system using a controlled execution graph.

      Used for:
      - Reading file tree
      - Inspecting project structure
      - Decide file path to create file/files
      - Decide file content
      - Understanding project state

      Rules:
      - Do NOT assume file system state — always fetch fresh data.

      `,
    schema: z.object({
      task: z.string().describe(
        `Describe the file system related task you want to accomplish.
          
          Examples:
          - "Read the file tree of the current project and find all .js files."
          - "Get the content of README.md in the project root."
          - "Run a PowerShell command to list all processes related to node."`,
      ),
      fileOrFolderName: z.string().describe("file /folder name"),
    }),
  },
);
