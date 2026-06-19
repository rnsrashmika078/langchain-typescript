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
  fileName: z.optional(z.string()),
  absoluteFilePath: z.string(),
  fileTree: z.any(),
  powershellDoc: z.string(),
  content: z.string(),
});
// Graph 1 state
export const graph1 = new StateSchema({
  task: z.string(),
  error: z.string().nullish(),
  fileName: z.string(),
  rootDir: z.string(),
  content: z.string(),
  fileTree: z.string(),
  absoluteFilePath: z.string(),
  decision: z.string(),
  command: z.string(),
});
// accept undefined or null when missing
