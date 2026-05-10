import { NextResponse } from "next/server";
import { createAnonymousPlayer } from "@/lib/server/player-service";
import { HttpError } from "@/lib/server/http-error";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { nickname?: unknown };
    const player = await createAnonymousPlayer(body.nickname);

    return NextResponse.json(
      {
        playerId: player.id,
        nickname: player.nickname,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
