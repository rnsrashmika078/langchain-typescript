import { createAgent, humanInTheLoopMiddleware } from "langchain";
import { trimMessages } from "../agent_middleware";
import { getPostgressCheckpointer } from "../memory/memorySavers";
import { mainAgentSystemPrompt } from "../data";
import { graphLanguageModel, languageModel } from "./languageModel";
import { modelTools } from "../tools/secondaryTools";
import { getWeatherTool } from "../tools/primaryTools";
import { AgentState } from "../agent_middleware";
import z from "zod";
import {
  createDeepAgent,
  createFilesystemMiddleware,
  FilesystemBackend,
  StateBackend,
} from "deepagents";
const checkpointer = await getPostgressCheckpointer();

const targetDir = "C:/Users/Rashm/Desktop/VIRTUAL"; // Avoid OneDrive

export const mainAgent = createAgent({
  model: languageModel,
  systemPrompt: mainAgentSystemPrompt,
  // systemPrompt: mainAgentSystemPrompt,
  // tools: modelTools,

  // stateSchema: AgentState,
  middleware: [
    createFilesystemMiddleware({
      backend: new FilesystemBackend({
        rootDir: `C:/Users/Rashm/OneDrive/Desktop/VIRTUAL`,
        virtualMode: true,
      }),
    }),
    trimMessages,
    humanInTheLoopMiddleware({
      interruptOn: {
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
export const subAgent = createAgent({
  model: graphLanguageModel,
  systemPrompt:
    "You are help full coding assistant. USE getWeather tool to get the weather data",
  tools: [getWeatherTool],
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

export const deepAgent = createDeepAgent({
  model: languageModel,
  systemPrompt: "YOU ARE AN AI AGENT. AlWAYS RUN TOOLS",
  tools: modelTools,
  backend: new FilesystemBackend({
    rootDir: "C:\\Users\\Rashm\\OneDrive\\Desktop\\sandbox",
    virtualMode: false,
  }),
});
