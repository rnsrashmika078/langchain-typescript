import { StateSchema } from "@langchain/langgraph";
import z from "zod";

// Graph 1 state
export const graph1 = new StateSchema({
  task: z.string(),
  absolute_path: z.string(),
  rootPath: z.string(),
  content: z.string(),
  task_status: z.enum(["Success", "Failed", "Empty"]),
  fileTree: z.any(),
  knowledge_base: z.string(),
  currentLoopCount: z.number(),
  loopCount: z.number(),
});
export const graph2 = new StateSchema({
  task: z.string(),
  rootDir: z.string(),
  command: z.string(),
  task_status: z.enum(["Success", "Failed", "Empty"]),
  error: z.string(),
  result: z.string(),
  fileTree: z.any(),
  powershellDoc: z.string(),
  failedCommand: z.array(
    z.object({
      failedCommand: z.string(),
      error: z.string(),
    }),
  ),
});
