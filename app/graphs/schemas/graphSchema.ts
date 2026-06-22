import { StateSchema } from "@langchain/langgraph";
import z from "zod";

// Graph 1 state
export const graph1 = new StateSchema({
  task: z.string(),
  error: z.string().nullish(),
  fileName: z.string(),
  rootDir: z.string(),
  content: z.string(),
  fileTree: z.string(),
  relativeFilePath: z.string(),
  decision: z.string(),
  status: z.string(),
  command: z.string(),
  operation: z.enum(["READ", "UPDATE", "DELETE", "FIXERROR"]),
});
