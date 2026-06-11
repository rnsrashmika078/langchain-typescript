import { GraphNode } from "@langchain/langgraph";
import { graph2 } from "../schemas/graphSchema";
import { graphLanguageModel } from "@/app/agents/languageModel";
import { createFileStructureOutput } from "../schemas/structuredOutputSchema";
import { powershellDoc, stdProjectTree } from "@/markdown/markdown";

export const generateFileContent: GraphNode<typeof graph2> = async (
  state,
  config,
) => {
  if (config.writer) {
    config.writer({ message: "Reading file tree...." });
  }

  let prompt = "";
  prompt = `
  YOU ARE EXPERT REACT VITE DEVELOPER

  YOUR ROLE: 
    1. GENERATE FILE CONTENT BASED ON USER GIVEN TASK
    2. READ THE STANDARD REACT VITE PROJECT TREE
    3. PICK SUITABLE ABSOLUTE FILE PATH BY READING FILE TREE
    4. READ THE POWERSHELL DOCUMENTATION

  TASK: ${state.task}

  STANDARD REACT PROJECT TREE: ${stdProjectTree}

  POWERSHELL DOCUMENTATION: ${powershellDoc}
  FILE TREE: ${state.fileTree}
  
  You MUST return ONLY valid JSON.

  Output format:
  {absoluteFilePath: "string" , "content": "string",  "command":"string"}

  e.g: absoluteFilePath -> "C:/users/rashm/project01/src/component/filename.tsx"

  Rules:
    - Only return valid JSON
    - No explanations
    - No extra text
`;
  const structuredLlm = graphLanguageModel.withStructuredOutput(
    createFileStructureOutput,
  );
  const result = await structuredLlm.invoke(prompt);
  //   const command = `
  // @"
  // ${result.content}
  // "@ | Set-Content -Path "${result.absoluteFilePath}"
  // `;
  return { command: result.command };
};
export const createFileResources: GraphNode<typeof graph2> = async (
  state,
  config,
) => {
  if (config.writer) {
    config.writer({ message: "Reading file tree...." });
  }

  console.log("file tree", state.fileTree);

  const defaultCode = `import 'react' from react;
  
    const page = () => {
     return <div>"hi there"</div>
    }

    export default page;
  `;

  let prompt = "";
  prompt = `
  YOU ARE REACT VITE CODING AGENT
  YOUR TASKS LISTED BELOW:
  
    #TASK 01 -
      DECIDE SUITABLE PATH BASED ON THE FILE TREE AND TASK FOR REACT VITE PROJECT
    #TASK 02 -
      GENERATE CONTENT SUITABLE FOR THE FILE: default -> ${defaultCode}
    #TASK 03 -
      ${state.task}

  FILE TREE:
  ${state.fileTree}

  FILE NAME ( Name that set to file that we going to create):
  ${state.fileOrFolderName}

  You MUST return ONLY valid JSON.

  Output format:
  {"absoluteFilePath": "string" , "content: "string"}

  e.g: absoluteFilePath -> "C:/users/rashm/project01/src/component/filename.tsx"

   Rules:
    - Only return valid JSON
    - No explanations
    - No extra text
`;
  const structuredLlm = graphLanguageModel.withStructuredOutput(
    createFileStructureOutput,
  );

  const result = await structuredLlm.invoke(prompt);

  const command = `
  @"
  ${result.content ?? defaultCode}
"@ | Set-Content -Path "${result.absoluteFilePath}"
  `;

  console.log("command", command);
  return { command };
};
