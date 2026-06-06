/* eslint-disable @typescript-eslint/no-explicit-any */
import { mkdirSync, readdirSync, statSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { v4 as uuid } from "uuid";
import path from "path";
import fs from "fs";
import { execFile, execFileSync, spawn } from "child_process";

export const requestWeatherAPI = async (city: string) => {
  try {
    const res = await fetch(
      // `https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${city}`,
      `https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${city}`,
    );

    const data = await res.json();
    return data.current;
  } catch (error) {
    return error;
  }
};
export const ReadDirectory = (path: string) => {
  console.log("Path dir from Read Dir", path);
  function Recursion(path: string): unknown {
    const project = readdirSync(path).map((name) => {
      const filePath = join(path, name);
      const stats = statSync(filePath);
      return stats.isDirectory()
        ? {
            id: uuid(),
            type: "folder",
            name,
            absolute_path: filePath,
            children: name.startsWith("node_modules")
              ? null
              : Recursion(filePath),
          }
        : {
            id: uuid(),
            type: "file",
            name,
            absolute_path: filePath,
            children: null,
          };
    });
    return project;
  }

  return { path, tree: Recursion(path) };
};
export const CreateFile = (path: string, content: string) => {
  try {
    const dir = dirname(path);
    mkdirSync(dir, { recursive: true });
    writeFileSync(path, content, "utf-8");
    return { success: true, message: "Files created successfully" };
  } catch (e) {
    return { success: false, message: String(e) };
  }
};
export const findProjectRoot = (startPath: string): string | null => {
  const command = `(Get-ChildItem -Path "${startPath}" -Recurse -Filter package.json -ErrorAction SilentlyContinue | Select -First 1).DirectoryName`;

  try {
    const stdout = execFileSync("powershell", ["-Command", command], {
      encoding: "utf-8",
    });

    return stdout.trim() || null;
  } catch {
    return null;
  }
};

export async function asyncExecPowerShell(
  command: string,
  rootPath: string,
): Promise<string> {
  return new Promise((resolve) => {
    execFile(
      "powershell",
      ["-Command", command],
      { cwd: rootPath },
      (error, stdout, stderr) => {
        if (error) return resolve(error.message);
        if (stderr) return resolve(stderr);
        // if (runtime.writer) {
        //   runtime.writer({ message: "Executing powershell command..." });
        // }
        resolve(stdout || "Command Execute Silently.");
      },
    );
  });
}
export function runPowerShellStream(
  command: string,
  rootPath: string,
  onData?: (data: string) => void,
  onExit?: (code: number | null) => void,
) {
  const child = spawn("powershell", ["-Command", command], {
    cwd: rootPath,
  });

  child.stdout.on("data", (data) => {
    onData?.(data.toString());
  });

  child.stderr.on("data", (data) => {
    onData?.(data.toString());
  });

  child.on("close", (code) => {
    onExit?.(code);
  });

  return child;
}
