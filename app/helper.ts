import { mkdirSync, readdirSync, statSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { v4 as uuid } from "uuid";
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
