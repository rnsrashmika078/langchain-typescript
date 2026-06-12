import z from "zod";

export const FMCGProperties = {
 
};

export const GSCGProperties = {
  name: "GeneralShellCommandGenerator",
  description: `
        Tool to interact with the project file system using a controlled execution graph.
  
        Used for:
        - Reading file tree
        - Inspecting project structure
        - Decide file path to create file/files
        - Decide file content
        - Understanding project state
  
        Rules:
        - Do NOT assume file system state — always fetch fresh data.
  
        `,
  schema: z.object({
    task: z.string().describe(
      `Describe the file system related task you want to accomplish.
            
            Examples:
            - "Read the file tree of the current project and find all .js files."
            - "Get the content of README.md in the project root."
            - "Run a PowerShell command to list all processes related to node."`,
    ),
    fileOrFolderName: z.string().describe("file /folder name"),
  }),
};
