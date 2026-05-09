import { tool } from "langchain";
import { llm } from "../chat/model";
import z from "zod";

export async function ToolOutput() {
  // Define a tool
  const multiply = tool(
    ({ a, b }) => {
      return a * b;
    },
    {
      name: "multiply",
      description: "Multiply two numbers",
      schema: z.object({
        a: z.number(),
        b: z.number(),
      }),
    },
  );
  // Augment the LLM with tools
  const llmWithTools = llm.bindTools([multiply]);

  // Invoke the LLM with input that triggers the tool call
  const msg = await llmWithTools.invoke("What is 2 times 3?");

  // Get the tool call
  console.log(msg.tool_calls);
  return msg.tool_calls;
}
