import { requestWeatherAPI } from "@/app/helper";
import { mkdirSync, writeFileSync } from "fs";
import { tool, ToolRuntime } from "langchain";
import path from "path";
import * as z from "zod";
import { run_langgraph } from "../graph/file-system-graph";

const getWeather = tool(
  async (
    {
      city,
      country,
    }: {
      city: string;
      country: string;
    },
    config: ToolRuntime,
  ) => {
    try {
      const writer = config.writer;

      if (writer) {
        writer("Calling Weather Tool...");
      }
      const result = await requestWeatherAPI(city);

      if (!result) {
        return "error while requesting weather api.. try again";
      }
      return {
        weather: result?.condition.text,
        temperature: result?.temp_c,
        city,
        icon: result?.condition.icon,
        wind: result?.wind_kph,
      };
    } catch (error) {
      return `error while requesting weather api.. error: ${error instanceof Error ? error.message : "no internet connection"}`;
    }
  },
  {
    name: "get_weather",
    description: "Get weather",
    schema: z.object({
      city: z.string(),
      country: z.string(),
    }),
  },
);

const getCurrentTime = tool(
  () => {
    return `current time: ${new Date().toLocaleTimeString()}`;
  },
  {
    name: "return_current_time",
    description: "return current local time",
  },
);
const generateCode = tool(
  ({ code }: { code: string }) => {
    return `code: ${code}`;
  },
  {
    name: "generate_code",
    description: "generate user ask code using programing language",
    schema: z.object({
      code: z.string(),
    }),
  },
);
const createFile = tool(
  async ({ filePath, content }: { filePath: string; content: string }) => {
    try {
      const dir = path.dirname(filePath);
      console.log("dir", dir);
      mkdirSync(dir, { recursive: true });
      writeFileSync(filePath, content);

      return `file created successfully with filePath: ${filePath}`;
    } catch (e) {
      return `${e instanceof Error ? e.message : "Error while create file"}`;
    }
  },
  {
    name: "create_file",
    description:
      "create file in suitable directory with generated_code tool result",
    schema: z.object({
      filePath: z.string(),
      content: z.string(),
    }),
  },
);

export const modelTools = [
  // getWeather,
  // getCurrentTime,
  // generateCode,
  // createFile,
  run_langgraph,
];
