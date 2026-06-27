import { ChatOllama } from "@langchain/ollama";
import schema from "../../schema.json";
export const languageModel = new ChatOllama({
  model: schema.languageModel.model,
  think: schema.languageModel.reasoning,
  temperature: schema.languageModel.temperature,
});
export const graphLanguageModel = new ChatOllama({
  model: schema.languageModel.graphLanguageModel.model,
  think: schema.languageModel.graphLanguageModel.reasoning,
  temperature: schema.languageModel.graphLanguageModel.temperature,
});
export const codingModel = new ChatOllama({
  model: schema.languageModel.codingModel.model,
  think: schema.languageModel.codingModel.reasoning,
  temperature: schema.languageModel.codingModel.temperature,
});
export const summarizeModel = new ChatOllama({
  model: schema.languageModel.summarizeModel.model,
  think: schema.languageModel.summarizeModel.reasoning,
  temperature: schema.languageModel.summarizeModel.temperature,
});
