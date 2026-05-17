import { requestWeatherAPI } from "@/app/helper";
import { mkdirSync, writeFileSync } from "fs";
import { tool } from "langchain";
import path from "path";
import * as z from "zod";

const getWeather = tool(
  async ({ city }: { city: string }) => {
    try {
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
    const dir = path.dirname(filePath);
    console.log("dir", dir);
    mkdirSync(dir, { recursive: true });
    writeFileSync(filePath, content);
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
  getWeather,
  getCurrentTime,
  generateCode,
  createFile,
];
