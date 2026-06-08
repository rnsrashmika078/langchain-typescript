import { StateSchema } from "@langchain/langgraph";
import z from "zod";

// Graph 2 state
export const graph2 = new StateSchema({
  task: z.string(),
  rootDir: z.string(),
  command: z.string(),
  task_status: z.enum(["Success", "Failed", "Empty"]),
  error: z.string(),
  result: z.string(),
  fileOrFolderName: z.optional(z.string()),
  absoluteFilePath: z.string(),
  fileTree: z.any(),
  powershellDoc: z.string(),
  failedCommand: z.array(
    z.object({
      failedCommand: z.string(),
      error: z.string(),
    }),
  ),
  input: z.string(),
  decision: z.string(),
  output: z.string(),
  isLoopDone: z.boolean(),
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
