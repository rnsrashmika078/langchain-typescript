import connectDB from "@/app/libs/mongodb/connectDB";
import Thread from "@/app/libs/mongodb/Threads";
import { Collection } from "mongoose";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // no auth - > locl run

    const db = await connectDB();

    const collectionName = "threads";

    await db.useDb("Memory");
    const history = await db.collection("threads");

    return NextResponse.json(
      {
        data: history,
        message: "Successful retrieve history",
        success: true,
      },
      { status: 200 },
    );
  } catch (err) {
    const errorMessage =
      err instanceof Error
        ? err.message
        : "error while retrieve all the history";
    return NextResponse.json(
      {
        message: errorMessage,
        success: false,
      },
      { status: 500 },
    );
  }
}
