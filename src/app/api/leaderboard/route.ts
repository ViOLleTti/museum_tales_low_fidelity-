import { NextResponse } from "next/server";
import { getLeaderboard, getLeaderboardBundle } from "@/lib/server/leaderboard-service";
import { HttpError } from "@/lib/server/http-error";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawScope = searchParams.get("scope");
    const scope = rawScope === "role" ? "role" : rawScope === "bundle" ? "bundle" : "global";
    const roleId = searchParams.get("roleId");
    const limitParam = searchParams.get("limit");
    const playerId = searchParams.get("playerId") ?? undefined;
    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
    const normalizedRoleId =
      roleId === "P1" || roleId === "P2" || roleId === "P3" || roleId === "P4" ? roleId : undefined;

    if (scope === "bundle") {
      if (!normalizedRoleId) {
        throw new HttpError(400, "roleId is required when scope=bundle.");
      }

      const result = await getLeaderboardBundle({
        roleId: normalizedRoleId,
        limit,
        playerId,
      });

      return NextResponse.json(result);
    }

    const result = await getLeaderboard({
      scope,
      roleId: normalizedRoleId,
      limit,
      playerId,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof HttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
