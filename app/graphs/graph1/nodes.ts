/* eslint-disable @typescript-eslint/no-explicit-any */
import { GraphNode } from "@langchain/langgraph";
import { graph2 } from "../schemas/graphSchema";
import { graphLanguageModel } from "@/app/agents/languageModel";
import {
  contentFileStructuredOutput,
  createFileStructureOutput,
  reactCodeErrorFixedOutput,
} from "../schemas/structuredOutputSchema";

// export const getCommand: GraphNode<typeof graph1> = async (state, config) => {
//   if (config.writer) {
//     config.writer({ message: "Requesting Powershell command..." });
//   }

//   let prompt = "";
//   if (state.error) {
//     console.log("ERROR", state.error);

//     prompt = `
//   DECIDE SUITABLE POWERSHELL COMMAND BASED ON USER TASK, PROJECT FILE TREE AND POWERSHELL DOCUMENTATION
//   You MUST return ONLY valid JSON.

//   Output format:
//   {"command": "string"}

//   TASK: ${state.task}
//   POWERSHELL DOCUMENTATION: ${state.powershellDoc}
//   PROJECT FILE TREE: ${state.fileTree}
//   ROOT DIRECTORY: ${state.rootDir}

//   COMMAND PATH MUST BE ABSOLUTE PATH. DONT USE RELATIVE PATH AT ALL

//   Failed Commands list and corresponding errors : ${JSON.stringify(state.failedCommand)}

//   Rules:
//   - TRY NEW COMMAND THAT MATCH TO TASK. DONT USE failed command again and again
//   - Only return valid JSON
//   - No explanations
//   - No extra text
//   `;
//   } else {
//     prompt = `
//   DECIDE SUITABLE POWERSHELL COMMAND BASED ON USER TASK, PROJECT FILE TREE AND POWERSHELL DOCUMENTATION

//   You MUST return ONLY valid JSON.

//   Output format:
//   {command: string}

//   TASK:${state.task}
//   POWERSHELL DOCUMENTATION: ${state.powershellDoc}
//   PROJECT FILE TREE: ${state.fileTree}
//   CURRENT WORKING DIRECTORY: ${state.rootDir}

//    Rules:
//     - Only return valid JSON
//     - No explanations
//     - No extra text
// `;
//   }
//   // CURRENT WORKING DIRECTORY: ${state.rootDir}
//   const structuredLlm = graphLanguageModel.withStructuredOutput(
//     CommandStructuredOutput,
//   );
//   const result = await structuredLlm.invoke(prompt);
//   return { command: result.command };
// };
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
export const fixFileResource: GraphNode<typeof graph2> = async (
  state,
  config,
) => {
  if (config.writer) {
    config.writer({ message: "Fix the coding issues..." });
  }

  let prompt = "";
  prompt = `
  YOU ARE EXPERT REACT VITE CODE DEBUG AGENT
  YOUR TASKS LISTED BELOW:
  
    #TASK 01 -
      GENERATE UPDATED / FIX CODE CONTENT
    #TASK 02 -
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
    reactCodeErrorFixedOutput,
  );

  const result = await structuredLlm.invoke(prompt);

  //   const command = `
  //   @"${result.fixed_code}
  // "@ | Set-Content -Path "${result.absoluteFilePath}"
  //   `;

  const command = "";

  return { command };
};

export const generateFileContent: GraphNode<typeof graph2> = async (
  state,
  config,
) => {
  if (config.writer) {
    config.writer({ message: "Reading file tree...." });
  }

  let prompt = "";
  prompt = `
  GENERATE FILE CONTENT BASED ON USER GIVEN TASK

  TASK:
  ${state.task}
  
  You MUST return ONLY valid JSON.

  Output format:
  {"content": "string"}

  e.g: absoluteFilePath -> "C:/users/rashm/project01/src/component/filename.tsx"

   Rules:
    - Only return valid JSON
    - No explanations
    - No extra text
`;
  const structuredLlm = graphLanguageModel.withStructuredOutput(
    contentFileStructuredOutput,
  );

  const result = await structuredLlm.invoke(prompt);

  //   const command = `
  //   Set-Content -Path "${state.absoluteFilePath}" -Value @"${result.content}
  // "@
  //   `;

  const command = `
  @"${result.content}
"@ | Set-Content -Path "${state.absoluteFilePath}"
  `;
  return { content: result.content, command };
};
