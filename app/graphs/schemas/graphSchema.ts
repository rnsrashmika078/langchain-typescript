import { StateSchema } from "@langchain/langgraph";
import z from "zod";

// Graph 2 state
// TODOS
// --> clean up
export const graph2 = new StateSchema({
  task: z.string(),
  status: z.string(),
  rootDir: z.string(),
  command: z.string(),
  fileOrFolderName: z.optional(z.string()),
  absoluteFilePath: z.string(),
  fileTree: z.any(),
  powershellDoc: z.string(),
  decision: z.string(),
});
// Graph 1 state
export const graph1 = new StateSchema({
  task: z.string(),
  fileName: z.string(),
  rootDir: z.string(),
  content: z.string(),
  fileTree: z.string(),
  absoluteFilePath: z.string(),
  command: z.string(),
});
