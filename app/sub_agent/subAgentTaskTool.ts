/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAgent, tool } from "langchain";
import { graphLanguageModel } from "../agents/languageModel";
import z from "zod";

const researchAgent = createAgent({
  model: graphLanguageModel,
  systemPrompt: "You are a research specialist...for testing just generate 5 lines research",
});

const writerAgent = createAgent({
  model: graphLanguageModel,
  systemPrompt: "You are a writing specialist....",
});
const SUBAGENTS: Record<string, any> = {
  research: researchAgent,
  writer: writerAgent,
};

const task = tool(
  async ({ agentName, description }) => {
    const agent = SUBAGENTS[agentName];
    const result = await agent.invoke({
      messages: [{ role: "user", content: description }],
    });
    return result.messages.at(-1)?.content;
  },
  {
    name: "task",
    description: `Launch an ephemeral subagent.

Available agents:
- research: Research and fact-finding
- writer: Content creation and editing`,
    schema: z.object({
      agentName: z.string().describe("Name of agent to invoke"),
      description: z.string().describe("Task description"),
    }),
  },
);
export { task as subAgentTaskTool };
