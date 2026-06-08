/* eslint-disable @typescript-eslint/no-explicit-any */
import { MongoClient } from "mongodb";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { MemorySaver } from "@langchain/langgraph";
import { RedisSaver } from "@langchain/langgraph-checkpoint-redis";

export async function getCheckpointer() {
  const mongoUrl = process.env.MONGODB_URI;

  if (!mongoUrl) {
    throw new Error("MONGODB_URI is not set as an environment variable");
  }
  const client = new MongoClient(mongoUrl);
  await client.connect();

  return new MongoDBSaver({
    client: client as any,
    dbName: "Memory",
    enableTimestamps: true,
  });
}

// const redisUrl = process.env.REDIS_URL;
// if (!redisUrl) {
//   throw new Error("REDIS_URL is not set as an environment variable");
// }

// export const redisCheckpointer = await RedisSaver.fromUrl(redisUrl, {
//   defaultTTL: 60, // TTL in minutes
//   refreshOnRead: true,
// });
// export const InLineMemory = new MemorySaver();

export async function getRedisCheckpointer() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error("REDIS_URL is not set as an environment variable");
  }

  return await RedisSaver.fromUrl(redisUrl, {
    defaultTTL: 60, // TTL in minutes
    refreshOnRead: true,
  });
}
export async function getPostgressCheckpointer() {
  const DB_URI =
    "postgresql://postgres:root@localhost:5432/postgres?sslmode=disable";

  const checkpointer = await PostgresSaver.fromConnString(DB_URI);

  await checkpointer.setup(); // safe to include

  return checkpointer;
}
