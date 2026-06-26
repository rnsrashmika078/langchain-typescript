import {
  createAgent,
  humanInTheLoopMiddleware,
  todoListMiddleware,
} from "langchain";
import { trimMessages } from "../agent_middleware";
import { getPostgressCheckpointer } from "../memory/memorySavers";
import { mainAgentSystemPrompt } from "../data";
import { graphLanguageModel, languageModel } from "./languageModel";
import { modelTools } from "../tools/secondaryTools";
// import { AgentState } from "../agent_middleware";
import z from "zod";
import { createDeepAgent, FilesystemBackend } from "deepagents";
import { StateSchema } from "@langchain/langgraph";
import { graph1 } from "../graphs/schemas/graphSchema";
const checkpointer = await getPostgressCheckpointer();

const targetDir = "C:/Users/Rashm/Desktop/VIRTUAL"; // Avoid OneDrive
export const AgentState = new StateSchema({
  content: z.string().default(""), // Providing a default is highly recommended
});
export const mainAgent = createAgent({
  model: languageModel,
  systemPrompt: mainAgentSystemPrompt,
  tools: modelTools,
  stateSchema: graph1,

  middleware: [
    // filesys
    // trimMessages,
    // todoListMiddleware(),
    humanInTheLoopMiddleware({
      interruptOn: {
        toolA: true,
        CreateFileTool: {
          allowedDecisions: ["approve", "reject"],
          description: "Execute this command?",
        },
        getWeatherTool: {
          allowedDecisions: ["approve", "reject"],
          description: "Execute this command?",
        },
        ReadProjectTreeTool: false,
      },
    }),
  ],
  checkpointer: checkpointer,
});

const weatherSchema = z.object({
  temperature: z.number(),
  condition: z.string(),
});
// export const subAgent = createAgent({
//   model: graphLanguageModel,
//   systemPrompt:
//     "You are help full coding assistant. USE getWeather tool to get the weather data",
//   tools: [getWeatherTool],
//   responseFormat: weatherSchema,
//   middleware: [
//     trimMessages,
//     humanInTheLoopMiddleware({
//       interruptOn: {
//         get_weather: {
//           allowedDecisions: ["approve", "reject"],
//           description: "To get weather we need User approval ?",
//         },
//       },
//     }),
//   ],
//   // checkpointer: checkpointer,
// });

export const deepAgent = createDeepAgent({
  model: languageModel,
  systemPrompt: "YOU ARE AN AI AGENT. AlWAYS RUN TOOLS",
  tools: modelTools,
  backend: new FilesystemBackend({
    rootDir: "C:\\Users\\Rashm\\OneDrive\\Desktop\\sandbox",
    virtualMode: false,
  }),
});
