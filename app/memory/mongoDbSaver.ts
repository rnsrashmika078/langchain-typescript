/* eslint-disable @typescript-eslint/no-explicit-any */
import { MongoClient } from "mongodb";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";

const mongoUrl = process.env.MONGODB_URI;
const client = new MongoClient(mongoUrl!);

export async function getCheckpointer() {
  try {
    if (!mongoUrl) {
      throw new Error("MONGODB_URI is not set as an environment variable");
    }
    await client.connect();
    const checkpointer = new MongoDBSaver({
      client: client as any,
      dbName: "Memory",
    });
    return checkpointer;
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : "error while setup connection",
    );
  }
}
