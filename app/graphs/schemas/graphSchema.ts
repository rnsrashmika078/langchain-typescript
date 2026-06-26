import { StateSchema } from "@langchain/langgraph";
import z from "zod";

// Graph 1 state
export const graph1 = new StateSchema({
  task: z.string(),
  messageId: z.string(),
  error: z.string().nullish(),
  fileName: z.string(),
  rootDir: z.string(),
  content: z.string().default(""),
  relativeFilePath: z.string(),
  status: z.string(),
  approve: z.string(),
  operation: z.enum(["READ", "UPDATE", "DELETE", "FIXERROR"]),
});
export const graph2 = new StateSchema({
  task: z.string(),
  messageId: z.string(),
  error: z.string().nullish(),
  fileName: z.string(),
  rootDir: z.string(),
  content: z.string().default(""),
  relativeFilePath: z.string(),
  status: z.string(),
  operation: z.enum(["READ", "UPDATE", "DELETE", "FIXERROR"]),
});
