import Thread from "@/app/libs/mongodb/Threads";
import { NextResponse } from "next/server";

export async function POST() {
  try {

    // no auth - > locl run
    const allThreads = await Thread.find();

    if (allThreads.length === 0) {
      return NextResponse.json(
        {
          message: "No Threads found!",
          success: true,
        },
        { status: 200 },
      );
    }
    return NextResponse.json(
      {
        data: allThreads,
        message: "Successful retrieve all the threads",
        success: true,
      },
      { status: 200 },
    );
  } catch (err) {
    const errorMessage =
      err instanceof Error
        ? err.message
        : "error while retrieve all the threads";
    return NextResponse.json(
      {
        message: errorMessage,
        success: false,
      },
      { status: 500 },
    );
  }
}
