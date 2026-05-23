// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { createClient } from "@redis/client";
// import { RedisSaver } from "@langchain/langgraph-checkpoint-redis";

// let redisClient: any = null;
// let checkpointer: RedisSaver | null = null;

// export async function getCheckpointer() {
//   if (!checkpointer) {
//     redisClient = createClient({
//       host: process.env.REDIS_HOST || "127.0.0.1",
//       port: parseInt(process.env.REDIS_PORT || "6379"),
//     });

//     // Connect and wait
//     await redisClient.connect();
//     console.log("✅ Redis connected");

//     checkpointer = new RedisSaver(redisClient);
//   }

//   return checkpointer;
// }

// export { redisClient };


