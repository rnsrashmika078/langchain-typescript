/* eslint-disable @typescript-eslint/no-explicit-any */
import { ConditionalEdgeRouter } from "@langchain/langgraph";
import z from "zod";
import { graph1 } from "../schemas/graphSchema";
import { promisify } from "util";
import { exec } from "child_process";
const execAsync = promisify(exec);

// const routeSchema = z.object({
//   step: z
//     .enum(["READ", "UPDATE", "DELETE"])
//     .describe("The next step in the routing process"),
// });

// const router = graphLanguageModel.withStructuredOutput(routeSchema);

export const routeDecision: ConditionalEdgeRouter<typeof graph1, any> = (
  state,
) => {
  if (state.error) {
    return "ErrorFixOnly";
  }
  if (state.operation === "READ") {
    return "readOnly";
  } else if (state.operation === "UPDATE") {
    return "updateOnly";
  } else if (state.operation === "FIXERROR") {
    return "ErrorFixOnly";
  } else {
    // default to read-only route when no other condition matches
    return "readOnly";
  }
};
export const routeDecision_II: ConditionalEdgeRouter<
  typeof graph1,
  any
> = async (state) => {
  const { stdout, stderr } = await execAsync(
    `powershell -Command "Get-ChildItem -Path '${state.rootDir}' -Recurse -Filter '${state.fileName}' -ErrorAction SilentlyContinue | Select-Object -First 1"`,
    {
      cwd: state.rootDir,
      timeout: 5000,
    },
  );
  console.log(
    "==================================================================",
  );
  console.log("ROUTER DECISION II", stdout);
  console.log(
    "==================================================================",
  );

  if (!stdout) {
    return "create";
  }
  return "update";
};
