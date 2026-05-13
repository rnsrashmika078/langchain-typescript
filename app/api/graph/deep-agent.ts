import * as z from "zod";
// npm install deepagents langchain @langchain/core
import { createDeepAgent } from "deepagents";
import { createAgent, tool } from "langchain";
import { llm } from "../chat/model";
import { ChatOllama } from "@langchain/ollama";
import { LanguageModelLike } from "@langchain/core/language_models/base";

const model = new ChatOllama({
  model: "gemma4:e2b",
  // stop: ["Thinking:", "Reasoning:", "\n\nThinking", "\n1.  **Analyze\n"],
  think: true,
  // maxRetries: 10,
  // model: "llama3.1:8b",
  onFailedAttempt: () => console.log(""),
}) as LanguageModelLike;
export async function deepAgent() {
  const getWeather = tool(({ city }) => `It's always sunny in ${city}!`, {
    name: "get_weather",
    description: "Get the weather for a given city",
    schema: z.object({
      city: z.string().describe("The city to get weather for"),
    }),
  });

  const agent = createAgent({
    //@ts-expect-error:model type error
    model,
    tools: [getWeather],
    systemPrompt: "You are a helpful assistant.use tool when needed!",
  });
  const res = await agent.invoke({
    messages: [
      { role: "user", content: "what is the current weather in tokyo?" },
    ],
  });
  console.log("result", res);

  return res;
}
