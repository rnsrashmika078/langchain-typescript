import { createAgent } from "langchain";
import { modelTools } from "./tools";


export const agent = createAgent({
  //@ts-expect-error:model ts mismatch issue
  model,
  // tools: modelTools,
});