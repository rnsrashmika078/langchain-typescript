/* eslint-disable @typescript-eslint/no-explicit-any */
import * as z from "zod";
import { tool, ToolRuntime } from "langchain";
import {
  ConditionalEdgeRouter,
  END,
  GraphNode,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { graph2 } from "../schemas/graphSchema";
import {
  getCommand,
  isError,
  readFilePath,
  readFileTree,
  readPowershellDocs,
  runCommand,
} from "./nodes";
import { graphLanguageModel } from "@/app/agents/languageModel";
const routeSchema = z.object({
  step: z
    .enum(["first", "second", "third"])
    .describe("The next step in the routing process"),
});

// const State = new StateSchema({
//   input: z.string(),
//   decision: z.string(),
//   output: z.string(),
// });

const router = graphLanguageModel.withStructuredOutput(routeSchema);
const llmCallRouter: GraphNode<typeof graph2> = async (state) => {
  const prompt = `
You are a router for file system tasks.

You MUST return ONLY valid JSON.
Do NOT return plain text.

Format:
{ "step": "first" } OR { "step": "second" } OR { "step": "third" }


Rules:
- If the task is about a specific file (e.g., README.md, Welcome.tsx, file content, file path) → second
- If the task is about folder structure, listing files, searching files → first
- If unrelated → third
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
  // Return the node name you want to visit next
  if (state.decision === "first") {
    return "llmCall1";
  } else if (state.decision === "second") {
    return "llmCall2";
  } else {
    return "llmCall3";
  }
};
export const fileSystemTool = tool(
  async (
    { task, fileOrFolderName }: { task: string; fileOrFolderName: string },
    runtime: ToolRuntime,
  ) => {
    const rootDir = runtime?.configurable?.rootPath;
    const graph = new StateGraph(graph2)
      .addNode("read_file_tree", readFileTree)
      .addNode("read_file_path", readFilePath)
      .addNode("get_command", getCommand)
      .addNode("run_command", runCommand)
      .addNode("read_powershell_docs", readPowershellDocs)
      .addNode("llmCallRouter", llmCallRouter)
      .addNode("llmCall1", async (state) => state)
      .addNode("llmCall2", async (state) => state)
      .addNode("llmCall3", async (state) => state)
      .addEdge(START, "llmCallRouter")
      .addConditionalEdges("llmCallRouter", routeDecision, [
        "llmCall1",
        "llmCall2",
        "llmCall3",
      ])
      //folder path route
      .addEdge("llmCall1", "read_file_tree")
      .addEdge("read_file_tree", "read_powershell_docs")

      //file path route
      .addEdge("llmCall2", "read_file_path")
      .addEdge("read_file_path", "read_powershell_docs")
      .addEdge("read_powershell_docs", "get_command")
      .addEdge("get_command", "run_command")
      .addConditionalEdges("run_command", isError, {
        Continue: "get_command",
        Done: END,
      })
      .addEdge("llmCall3", END)
      // .addEdge(START, "read_file_tree")
      // // .addConditionalEdges("read_file_tree", isReadDocs, {
      // //   Yes: "get_command",
      // //   No: "read_powershell_docs",
      // // })
      // .addEdge("read_powershell_docs", "get_command")
      // .addEdge("get_command", "run_command")
      // .addConditionalEdges("run_command", isError, {
      //   Continue: "get_command",
      //   Done: END,
      // })
      .compile();

    const inputs = {
      task,
      rootDir,
      fileOrFolderName,
    };

    let full_state: any = null;
    let custom: any = null;

    for await (const [mode, chunk] of await graph.stream(inputs, {
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

    return full_state.result;
  },
  {
    name: "fileSystemTool",
    description: `
      Tool to interact with the project file system using a controlled execution graph.

      Used for:
      - Reading file tree
      - Inspecting project structure
      - Running file-system related PowerShell commands
      - Understanding project state

      Rules:
      - Break complex tasks into sequential steps internally.
      - Execute ONE operation per step (no parallel actions).
      - Do NOT assume file system state — always fetch fresh data.

      Output:
      - Return final computed result only
      `,
    schema: z.object({
      task: z.string().describe(
        `Describe the file system related task you want to accomplish.
          
          Examples:
          - "Read the file tree of the current project and find all .js files."
          - "Get the content of README.md in the project root."
          - "Run a PowerShell command to list all processes related to node."`,
      ),
      fileOrFolderName: z.optional(z.string()).describe("file /folder name"),
    }),
  },
);
