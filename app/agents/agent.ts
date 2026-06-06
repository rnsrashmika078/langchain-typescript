import { createAgent, humanInTheLoopMiddleware, trimMessages } from "langchain";
import { getCheckpointer } from "../memory/mongoDbSaver";
import { mainAgentSystemPrompt } from "../data";
import { graphLanguageModel, languageModel } from "./languageModel";
import {
  generalShellTool,
  getWeather,
  modelTools,
} from "../tools/primaryTools";
import { createDeepAgent, FilesystemBackend } from "deepagents";
import { AgentState } from "../agent_middleware";
import z from "zod";
const checkpointer = await getCheckpointer();
// Main agent
export const mainAgent = createAgent({
  model: languageModel,
  systemPrompt: mainAgentSystemPrompt,
  tools: modelTools,
  stateSchema: AgentState,
  middleware: [
    trimMessages,
    humanInTheLoopMiddleware({
      interruptOn: {
        // create_file: {
        //   allowedDecisions: ["approve", "reject"],
        //   description: "Create file execution requires User approval",
        // },
        // get_weather: {
        //   allowedDecisions: ["approve", "reject"],
        //   description: "To get weather we need User approval ?",
        // },
        // run_langgraph: {
        //   allowedDecisions: ["approve", "reject"],
        //   description: "Do you want to run ?",
        // },
        // fileSystemTool: {
        //   allowedDecisions: ["approve", "reject"],
        //   description: "Do you want to run graph?",
        // },
        fileSystemTool: false,
        // generalShellTool: {
        //   allowedDecisions: ["approve", "reject"],
        //   description: "Do you want to run the command?",
        // },
        generalShellTool: true,
        readFileTree: {
          allowedDecisions: ["approve", "reject"],
          description: "Do you want to run PowerShell Command?",
        },
        // runReactApp: {
        //   allowedDecisions: ["approve", "reject"],
        //   description: "Do you want to run application?",
        // },
        // executePowerShellCommands: {
        //   allowedDecisions: ["approve", "reject"],
        //   description: "Do you want to run shell command",
        // },
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
