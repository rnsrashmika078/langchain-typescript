/* eslint-disable @typescript-eslint/no-explicit-any */
import { exec } from "child_process";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { task } = body;

    if (!task) {
      return NextResponse.json({ error: "task is required" }, { status: 400 });
    }

    const path = "C:\\Users\\Rashm\\OneDrive\\Desktop\\sandbox\\New folder";

    exec(
      `powershell -Command "Get-ChildItem -Force`,
      { cwd: path },
      (error, stdout, stderr) => {
        if (error) {
          console.log(error.message);
          return error;
        }

        if (stderr) {
          console.log(stderr);
          return NextResponse.json({
            success: true,
            result: stdout,
            message: "command started",
          });
        }

        console.log("stdout", stdout);
        return NextResponse.json({
          success: true,
          result: stdout,
          message: "command started",
        });
      },
    );

    return NextResponse.json({
      success: true,
      message: "command started",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
