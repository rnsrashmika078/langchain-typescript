import { LanguageModelLike } from "@langchain/core/language_models/base";
import { ChatOllama } from "@langchain/ollama";

export const llm = new ChatOllama({
  model: "gemma4:e2b",
  // model:"mistral:7b",
  think: true,
});
