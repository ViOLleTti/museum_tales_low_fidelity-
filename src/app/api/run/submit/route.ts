import { NextResponse } from "next/server";
import { submitRun } from "@/lib/server/leaderboard-service";
import { HttpError } from "@/lib/server/http-error";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Parameters<typeof submitRun>[0];
    const result = await submitRun(body);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
