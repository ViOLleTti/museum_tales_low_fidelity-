import { getStoryRule } from "@/lib/narrative-rules";
import type { RoleId } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { touchPlayer } from "./player-service";
import { HttpError } from "./http-error";

interface RunRow {
  id: string;
  player_id: string;
  session_id: string;
  role_id: RoleId;
  story_id: string;
  story_title: string;
  numeric_score: number;
  rank_grade: string;
  perfect_order: boolean;
  perfect_blanks: boolean;
  duration_seconds: number | null;
  submitted_at: string;
  created_at: string;
}

interface SubmitRunPayload {
  playerId: unknown;
  sessionId: unknown;
  roleId: unknown;
  storyId: unknown;
  perfectOrder: unknown;
  perfectBlanks: unknown;
  durationSeconds?: unknown;
  submittedAt: unknown;
  collectedClueIds?: unknown;
  scannedExhibitIds?: unknown;
}

interface PlayerLookupRow {
  id: string;
  nickname: string;
}

interface GetLeaderboardOptions {
  scope: "global" | "role";
  roleId?: RoleId;
  limit?: number;
  playerId?: string;
}

function isRoleId(value: unknown): value is RoleId {
  return value === "P1" || value === "P2" || value === "P3" || value === "P4";
}

function validateString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(400, `${field} must be a non-empty string.`);
  }

  return value.trim();
}

function validateBoolean(value: unknown, field: string) {
  if (typeof value !== "boolean") {
    throw new HttpError(400, `${field} must be a boolean.`);
  }

  return value;
}

function validateOptionalStringArray(value: unknown, field: string) {
  if (value === undefined) {
    return null;
  }

  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new HttpError(400, `${field} must be an array of strings.`);
  }

  return value;
}

function validateDurationSeconds(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (!Number.isInteger(value) || Number(value) < 0) {
    throw new HttpError(400, "durationSeconds must be a non-negative integer.");
  }

  return Number(value);
}

function validateSubmittedAt(value: unknown) {
  const submittedAt = validateString(value, "submittedAt");
  const parsed = Date.parse(submittedAt);

  if (Number.isNaN(parsed)) {
    throw new HttpError(400, "submittedAt must be a valid ISO date string.");
  }

  return new Date(parsed).toISOString();
}

function validateRoleStoryPair(roleId: RoleId, storyId: string) {
  const story = getStoryRule(storyId);

  if (!story) {
    throw new HttpError(400, "Unknown storyId.");
  }

  if (story.roleId !== roleId) {
    throw new HttpError(400, "roleId does not match storyId.");
  }

  return story;
}

function compareRuns(a: RunRow, b: RunRow) {
  if (b.numeric_score !== a.numeric_score) {
    return b.numeric_score - a.numeric_score;
  }

  if (Number(b.perfect_blanks) !== Number(a.perfect_blanks)) {
    return Number(b.perfect_blanks) - Number(a.perfect_blanks);
  }

  if (Number(b.perfect_order) !== Number(a.perfect_order)) {
    return Number(b.perfect_order) - Number(a.perfect_order);
  }

  const aDuration = a.duration_seconds ?? Number.MAX_SAFE_INTEGER;
  const bDuration = b.duration_seconds ?? Number.MAX_SAFE_INTEGER;
  if (aDuration !== bDuration) {
    return aDuration - bDuration;
  }

  const aSubmittedAt = Date.parse(a.submitted_at);
  const bSubmittedAt = Date.parse(b.submitted_at);
  if (aSubmittedAt !== bSubmittedAt) {
    return aSubmittedAt - bSubmittedAt;
  }

  return a.id.localeCompare(b.id);
}

function buildBestRuns(rows: RunRow[]) {
  const sorted = [...rows].sort(compareRuns);
  const bestByPlayer = new Map<string, RunRow>();

  for (const row of sorted) {
    if (!bestByPlayer.has(row.player_id)) {
      bestByPlayer.set(row.player_id, row);
    }
  }

  return Array.from(bestByPlayer.values());
}

function mapRunToLeaderboardItem(
  row: RunRow,
  rank: number,
  nicknameByPlayerId: Map<string, string>,
) {
  return {
    rank,
    playerId: row.player_id,
    nickname: nicknameByPlayerId.get(row.player_id) ?? "匿名玩家",
    roleId: row.role_id,
    storyId: row.story_id,
    storyTitle: row.story_title,
    score: row.numeric_score,
    grade: row.rank_grade,
    perfectOrder: row.perfect_order,
    perfectBlanks: row.perfect_blanks,
    durationSeconds: row.duration_seconds,
    submittedAt: row.submitted_at,
  };
}

async function getAllRunRows() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("runs")
    .select(
      "id, player_id, session_id, role_id, story_id, story_title, numeric_score, rank_grade, perfect_order, perfect_blanks, duration_seconds, submitted_at, created_at",
    );

  if (error) {
    throw new HttpError(500, error.message);
  }

  return (data ?? []) as RunRow[];
}

async function getRunRowsForPlayer(playerId: string) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("runs")
    .select(
      "id, player_id, session_id, role_id, story_id, story_title, numeric_score, rank_grade, perfect_order, perfect_blanks, duration_seconds, submitted_at, created_at",
    )
    .eq("player_id", playerId);

  if (error) {
    throw new HttpError(500, error.message);
  }

  return (data ?? []) as RunRow[];
}

async function getNicknameByPlayerId(runRows: RunRow[]) {
  const playerIds = Array.from(new Set(runRows.map((row) => row.player_id)));

  if (!playerIds.length) {
    return new Map<string, string>();
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from("players").select("id, nickname").in("id", playerIds);

  if (error) {
    throw new HttpError(500, error.message);
  }

  const nicknameByPlayerId = new Map<string, string>();

  for (const player of (data ?? []) as PlayerLookupRow[]) {
    nicknameByPlayerId.set(player.id, player.nickname);
  }

  return nicknameByPlayerId;
}

function buildLeaderboardResponse(args: {
  scope: "global" | "role";
  roleId?: RoleId;
  limit?: number;
  playerId?: string | null;
  runRows: RunRow[];
  nicknameByPlayerId: Map<string, string>;
}) {
  const { scope, roleId, runRows, nicknameByPlayerId } = args;
  const limit = args.limit && args.limit > 0 ? Math.min(args.limit, 50) : 10;
  const playerId = args.playerId?.trim() || null;
  const bestRuns = buildBestRuns(runRows);
  const scopedRuns =
    scope === "role" && roleId ? bestRuns.filter((run) => run.role_id === roleId) : bestRuns;

  const items = scopedRuns
    .slice(0, limit)
    .map((row, index) => mapRunToLeaderboardItem(row, index + 1, nicknameByPlayerId));

  let myRank: number | null = null;
  let myBest = null;

  if (playerId) {
    const myIndex = scopedRuns.findIndex((run) => run.player_id === playerId);
    myRank = myIndex >= 0 ? myIndex + 1 : null;

    if (myIndex >= 0) {
      myBest = mapRunToLeaderboardItem(scopedRuns[myIndex], myIndex + 1, nicknameByPlayerId);
    }
  }

  const recentRuns = playerId
    ? runRows
        .filter((run) => run.player_id === playerId)
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
        .slice(0, 5)
        .map((row, index) => mapRunToLeaderboardItem(row, index + 1, nicknameByPlayerId))
    : [];

  return {
    scope,
    roleId: roleId ?? null,
    items,
    myRank,
    myBest,
    recentRuns,
  };
}

export async function submitRun(payload: SubmitRunPayload) {
  const playerId = validateString(payload.playerId, "playerId");
  const sessionId = validateString(payload.sessionId, "sessionId");

  if (!isRoleId(payload.roleId)) {
    throw new HttpError(400, "roleId must be one of P1, P2, P3, P4.");
  }

  const roleId = payload.roleId;
  const storyId = validateString(payload.storyId, "storyId");
  const perfectOrder = validateBoolean(payload.perfectOrder, "perfectOrder");
  const perfectBlanks = validateBoolean(payload.perfectBlanks, "perfectBlanks");
  const durationSeconds = validateDurationSeconds(payload.durationSeconds);
  const submittedAt = validateSubmittedAt(payload.submittedAt);
  const collectedClueIds = validateOptionalStringArray(
    payload.collectedClueIds,
    "collectedClueIds",
  );
  const scannedExhibitIds = validateOptionalStringArray(
    payload.scannedExhibitIds,
    "scannedExhibitIds",
  );
  const story = validateRoleStoryPair(roleId, storyId);
  const supabase = createSupabaseServerClient();
  const runPayload = {
    player_id: playerId,
    session_id: sessionId,
    role_id: roleId,
    story_id: storyId,
    story_title: story.title,
    numeric_score: story.score,
    rank_grade: story.grade,
    perfect_order: perfectOrder,
    perfect_blanks: perfectBlanks,
    duration_seconds: durationSeconds,
    submitted_at: submittedAt,
    collected_clue_ids: collectedClueIds,
    scanned_exhibit_ids: scannedExhibitIds,
    game_mode: "solo",
  };

  await touchPlayer(playerId);

  const { data: existingRun, error: existingRunError } = await supabase
    .from("runs")
    .select("id")
    .eq("player_id", playerId)
    .eq("role_id", roleId)
    .eq("story_id", storyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingRunError) {
    throw new HttpError(500, existingRunError.message);
  }

  const writeQuery = existingRun
    ? supabase.from("runs").update(runPayload).eq("id", existingRun.id)
    : supabase.from("runs").insert(runPayload);

  const { data: insertedRun, error: insertError } = await writeQuery
    .select(
      "id, player_id, session_id, role_id, story_id, story_title, numeric_score, rank_grade, perfect_order, perfect_blanks, duration_seconds, submitted_at, created_at",
    )
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      throw new HttpError(409, "This session has already been submitted.");
    }

    throw new HttpError(500, insertError.message);
  }

  const inserted = insertedRun as RunRow | null;

  if (!inserted) {
    throw new HttpError(500, "Failed to create run.");
  }

  const playerRunRows = await getRunRowsForPlayer(playerId);
  const playerBestRun = [...playerRunRows].sort(compareRuns)[0] ?? inserted;

  return {
    runId: inserted.id,
    score: story.score,
    grade: story.grade,
    globalRank: null,
    roleRank: null,
    isPersonalBest: playerBestRun.id === inserted.id,
  };
}

export async function getLeaderboard(options: GetLeaderboardOptions) {
  const scope = options.scope;

  if (scope === "role" && !options.roleId) {
    throw new HttpError(400, "roleId is required when scope=role.");
  }

  const runRows = await getAllRunRows();
  const nicknameByPlayerId = await getNicknameByPlayerId(runRows);
  return buildLeaderboardResponse({
    scope,
    roleId: options.roleId,
    limit: options.limit,
    playerId: options.playerId,
    runRows,
    nicknameByPlayerId,
  });
}

export async function getLeaderboardBundle(options: {
  roleId: RoleId;
  limit?: number;
  playerId?: string;
}) {
  const runRows = await getAllRunRows();
  const nicknameByPlayerId = await getNicknameByPlayerId(runRows);

  return {
    global: buildLeaderboardResponse({
      scope: "global",
      limit: options.limit,
      playerId: options.playerId,
      runRows,
      nicknameByPlayerId,
    }),
    role: buildLeaderboardResponse({
      scope: "role",
      roleId: options.roleId,
      limit: options.limit,
      playerId: options.playerId,
      runRows,
      nicknameByPlayerId,
    }),
  };
}
