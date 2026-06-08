// /* eslint-disable @typescript-eslint/no-explicit-any */
// import * as z from "zod";
// import { tool, ToolRuntime } from "langchain";
// import { END, START, StateGraph } from "@langchain/langgraph";
// import { graph1 } from "../schemas/graphSchema";
// import { readFileTree } from "../graph2/nodes";
// export const fileOperationTool = tool(
//   async (
//     { fileName, task }: { fileName: string; task: string },
//     runtime: ToolRuntime,
//   ) => {
//     const rootDir = runtime?.configurable?.rootPath;
//     const graph = new StateGraph(graph1)
//       .addNode("read_file_tree", readFileTree)
//       .addNode("pick_path", pickPath)
//       .addNode("generate_content", generateFileContent)
//       .addEdge(START, "read_file_tree")
//       .addEdge("read_file_tree", "pick_path")
//       .addEdge("pick_path", "generate_content")
//       .addEdge("pick_path", END)
//       .compile();

//     const inputs = {
//       rootDir,
//       task,
//       fileName,
//     };

//     let full_state: any = "";
//     let custom: any = "";

//     for await (const [mode, chunk] of await graph.stream(inputs, {
//       streamMode: ["values", "custom"],
//     })) {
//       if (mode === "values") {
//         full_state = chunk;
//       } else if (mode === "custom") {
//         if (runtime.writer) {
//           custom = chunk;
//           runtime.writer(custom.message);
//         }
//       }
//     }

//     return full_state.command;
//   },
//   {
//     name: "fileOperationTool",
//     description: `
//       Decide the correct file system command for the given task.

//       Rules:
//       - NEVER create actual file/folder.
//       - ONCE this tool finish it should call generalShellTool for actually file operation

//       Output:
//       - Return final computed result only
//       `,
//     schema: z.object({
//       task: z.string().describe(
//         `Describe the file system related task you want to accomplish.
          
//           Examples:
//           - "create file ABC.tsx"
//           - "create file called Welcome.tsx"
// `,
//       ),
//       fileName: z.optional(z.string()).describe("file /folder name"),
//     }),
//   },
// );
