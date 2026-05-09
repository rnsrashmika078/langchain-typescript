import z from "zod";
import { llm } from "../chat/model";
import { NextResponse } from "next/server";

export async function structuredOutput() {
  const SearchQuery = z.object({
    search_query: z.string().describe("Query that is optimized web search."),
    justification: z
      .string()
      .describe("Why this query is relevant to the user's request."),
  });

  // Augment the LLM with schema for structured output
  const structuredLlm = llm.withStructuredOutput(SearchQuery);

  // Invoke the augmented LLM
  const output = await structuredLlm.invoke(
    "How does Calcium CT score relate to high cholesterol?",
  );

  return NextResponse.json({
    output,
  });
}
