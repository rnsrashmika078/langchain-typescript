import { createAgent, humanInTheLoopMiddleware, trimMessages } from "langchain";
import {
  getPostgressCheckpointer,
} from "../memory/memorySavers";
import { mainAgentSystemPrompt } from "../data";
import { graphLanguageModel, languageModel } from "./languageModel";
import { getWeather, modelTools } from "../tools/primaryTools";
import { AgentState } from "../agent_middleware";
import z from "zod";
// import { checkpointer, getCheckpointer, InLineMemory } from "../memory/mongoDbSaver";
// const checkpointer = await getRedisCheckpointer();
// const checkpointer = await getRedisCheckpointer();
const checkpointer = await getPostgressCheckpointer();
export const mainAgent = createAgent({
  model: languageModel,
  systemPrompt: mainAgentSystemPrompt,
  tools: modelTools,
  // stateSchema: AgentState,
  middleware: [
    humanInTheLoopMiddleware({
      interruptOn: {
        generalShellTool: {
          allowedDecisions: ["approve", "reject"],
          description: "Execute this command?",
        },
        fileSystemTool: {
          allowedDecisions: ["approve", "reject"],
          description: "Execute this command?",
        },
        fileOperationTool: {
          allowedDecisions: ["approve", "reject"],
          description: "Execute this command?",
        },
        getWeather: {
          allowedDecisions: ["approve", "reject"],
          description: "Execute this command?",
        },
      },
    }),
  ],
  checkpointer: checkpointer,
});

const weatherSchema = z.object({
  temperature: z.number(),
  condition: z.string(),
});
export const subAgent = createAgent({
  model: graphLanguageModel,
  systemPrompt:
    "You are help full coding assistant. USE getWeather tool to get the weather data",
  tools: [getWeather],
  responseFormat: weatherSchema,
  middleware: [
    trimMessages,
    humanInTheLoopMiddleware({
      interruptOn: {
        get_weather: {
          allowedDecisions: ["approve", "reject"],
          description: "To get weather we need User approval ?",
        },
      },
    }),
  ],
  // checkpointer: checkpointer,
});

// export const deepAgent = createDeepAgent({
//   model: languageModel,
//   systemPrompt: "YOU ARE AN AI AGENT. AlWAYS RUN TOOLS",
//   tools: modelTools,
//   backend: new FilesystemBackend({
//     rootDir: "C:\\Users\\Rashm\\OneDrive\\Desktop\\sandbox",
//     virtualMode: false,
//   }),
// });
