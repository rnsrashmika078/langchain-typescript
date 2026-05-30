import { createAgent, humanInTheLoopMiddleware, trimMessages } from "langchain";
import { getCheckpointer } from "../memory/mongoDbSaver";
import { mainAgentSystemPrompt } from "../data";
import { languageModel } from "./languageModel";
import { modelTools } from "../tools/primaryTools";
import { createDeepAgent, FilesystemBackend } from "deepagents";
import { AgentState } from "../agent_middleware";
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
        //   description: "🚨 Create file execution requires User approval",
        // },
        // get_weather: {
        //   allowedDecisions: ["approve", "reject"],
        //   description: "To get weather we need User approval ?",
        // },
        // run_langgraph: {
        //   allowedDecisions: ["approve", "reject"],
        //   description: "Do you want to run ?",
        // },
        run_langgraph: {
          allowedDecisions: ["approve", "reject"],
          description: "Do you want to run graph?",
        },
        // executePowerShellCommands: {
        //   allowedDecisions: ["approve", "reject"],
        //   description: "Do you want to run shell command",
        // },
      },
    }),
  ],
  checkpointer: checkpointer,
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
