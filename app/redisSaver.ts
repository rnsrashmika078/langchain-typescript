import { MongoClient } from "mongodb";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";

const mongoUrl = process.env.MONGODB_URI;
console.log(mongoUrl);
if (!mongoUrl) {
  throw new Error("MONGODB_URI is not set as an environment variable");
}

// Initialize the MongoDB client
const client = new MongoClient(mongoUrl);
await client.connect();
// Instantiate MongoDBSaver
export const checkpointer = new MongoDBSaver({
  // @ts-expect-error:client type issue
  client: client,
  dbName: "Memory", // Replace with your actual DB name
});
