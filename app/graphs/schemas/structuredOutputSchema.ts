import { Content } from "next/font/google";
import z from "zod";

// Schema for structured output -> file path
export const FilePathStructuredOutput = z.object({
  absolute_path: z
    .string()
    .describe("Suitable Absolute directory path to the file"),
});
// Schema for structured output -> file structure knowledge
export const StandardReactProjectStructure = z.object({
  knowledge_base: z
    .string()
    .describe(
      "The knowledge you gain from read md file about react project standard structure",
    ),
});
// Schema for structured output -> file content
export const FileContentStructuredOutput = z.object({
  content: z.string().describe("Suitable file content to the file"),
});

// Schema for structured output -> command executer ( graph2 )
export const CommandStructuredOutput = z.object({
  command: z.string().describe("POWERSHELL COMMAND"),
});
export const createFileStructureOutput = z.object({
  absoluteFilePath: z.string().describe("POWERSHELL COMMAND"),
  content: z.string().describe("file content"),
});
export const contentFileStructuredOutput = z.object({
  content: z
    .string()
    .describe("content to the file based on the task; e.g.React code"),
});

// Schema for structured output -> powershell docs ( graph2 )
export const PowerShellDocOutput = z.object({
  powershellDoc: z.string().describe("POWERSHELL DOCUMENTATION"),
});
