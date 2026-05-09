import { LanguageModelLike } from "@langchain/core/language_models/base";
import { ChatOllama } from "@langchain/ollama";

export const llm = new ChatOllama({
  model: "gemma4:e2b",
  stop: ["</think>"],
  maxRetries: 10,
  // model: "llama3.1:8b",
    onFailedAttempt: () => console.log(""),
  }) as LanguageModelLike;
// });
