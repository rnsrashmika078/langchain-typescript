import { prisma } from "@/app/libs/prisma/prismaClient";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const allThreads = await prisma.threads.findMany();

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
