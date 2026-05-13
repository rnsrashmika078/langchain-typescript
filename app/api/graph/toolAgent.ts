import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { llm } from "../chat/model";
import {
  StateGraph,
  StateSchema,
  MessagesValue,
  GraphNode,
  ConditionalEdgeRouter,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
  SystemMessage,
  ToolMessage,
  AIMessage,
} from "@langchain/core/messages";
import { BaseMessage } from "langchain";
import { requestWeatherAPI } from "@/app/helper";

// Define tools
export const ToolAgent = async () => {
  const getWeather = tool(
    async ({ city }: { city: string }) => {
      const data = await requestWeatherAPI(city);
      return data;
    },
    {
      name: "getweather",
      description: "get the weather status in given location",
      schema: z.object({
        city: z.string().describe("location"),
      }),
    },
  );

  // Augment the LLM with tools
  const tools = [getWeather];
  const llmWithTools = llm.bindTools(tools);

  // Graph state
  const State = new StateSchema({
    messages: MessagesValue,
  });

  // Nodes
  const llmCall: GraphNode<typeof State> = async (state) => {
    // LLM decides whether to call a tool or not
    const result = await llmWithTools.invoke([
      {
        role: "system",
        content: "You are a helpful assistant tasked with tools.",
      },
      ...state.messages,
    ]);

    console.log("result", result);
    return {
      messages: [result],
    };
  };

  const toolNode = new ToolNode(tools);

  // Conditional edge function to route to the tool node or end
  const shouldContinue: ConditionalEdgeRouter<typeof State> = (state) => {
    const messages = state.messages;
    const lastMessage = messages.at(-1);
    // if (lastMessage instanceof ToolMessage) {
    //   console.log("tool result:", lastMessage.);
    // }
    // If the LLM makes a tool call, then perform an action
    if (
      lastMessage &&
      lastMessage instanceof AIMessage &&
      lastMessage.tool_calls?.length
    ) {
      return "toolNode";
    }

    // Otherwise, we stop (reply to the user)
    return "__end__";
  };

  // Build workflow
  const agentBuilder = new StateGraph(State)
    .addNode("llmCall", llmCall)
    .addNode("toolNode", toolNode)
    // Add edges to connect nodes
    .addEdge("__start__", "llmCall")
    .addConditionalEdges("llmCall", shouldContinue, ["toolNode", "__end__"])
    .addEdge("toolNode", "llmCall")
    .compile();

  // Invoke
  const messages = [
    {
      role: "user",
      content: "what is the weather status in colombo",
    },
  ];
  //   const result = await agentBuilder.invoke({ messages });
  return new ReadableStream({
    async start(controller) {
      try {
        const stream = agentBuilder.stream(
          { messages },
          { streamMode: "updates" }, // or "messages" for token streaming
        );

        for await (const chunk of await stream) {
          for (const [nodeName, state] of Object.entries(chunk)) {
            const lastMessage = state.messages?.at(-1);

            const payload = {
              node: nodeName,
              content: lastMessage?.content ?? null,
              toolCalls: lastMessage?.tool_calls ?? null,
            };

            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`),
            );

            console.log("STREAM:", payload);
          }
        }

        controller.close();
      } catch (err) {
        console.error(err);
        controller.error(err);
      }
    },
  });
};
