/* eslint-disable @typescript-eslint/no-explicit-any */
import { requestWeatherAPI } from "@/app/helper";
import { mkdirSync, writeFileSync } from "fs";
import { tool, ToolRuntime } from "langchain";
import path from "path";
import * as z from "zod";
import { exec } from "child_process";
import { cwd } from "process";
import { run_langgraph } from "../graphs/graph2/powershellCommand";

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

// const executePowerShellCommands = tool(
//   async ({ command }: { command: string }, runtime: ToolRuntime) => {
//     const rootPath = runtime?.configurable?.rootPath;
//     const safeCommand = `
//     ${command} | Where-Object { $_.FullName -notmatch "node_modules" }
//     `;

//     const modified = safeCommand.replace("-Path" , `-Path "${rootPath}" `)
//     return new Promise((resolve) => {
//       exec(
//         `powershell -Command "${modified}"`,
//         { cwd: rootPath },
//         (error, stdout, stderr) => {
//           if (error) return resolve(error.message);
//           if (stderr) return resolve(stderr);
//           resolve(stdout);
//         },
//       );
//     });
//   },
//   {
//     name: "executePowerShellCommands",
//     description:
//       "run POWERSHELL commands only..ALWAYS EXCLUDE 'node_modules' folder",
//     schema: z.object({
//       command: z.string(),
//     }),
//   },
// );

export const modelTools = [
  // getWeather,
  // getCurrentTime,
  // generateCode,
  // createFile,
  // run_langgraph,
  // executePowerShellCommands,
  run_langgraph
];
