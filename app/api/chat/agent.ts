import { createAgent } from "langchain";
import { modelTools } from "./tools";
import { llm } from "./model";
import { MemorySaver } from "@langchain/langgraph";

export const agent = createAgent({
  model: llm,
  systemPrompt: "you are expert ai code assistant.use tailwind for styling ",
  tools: modelTools,
  checkpointer: new MemorySaver(),
});
