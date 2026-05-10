import { createSupabaseServerClient } from "@/lib/supabase/server";
import { HttpError } from "./http-error";

const NICKNAME_MIN_LENGTH = 2;
const NICKNAME_MAX_LENGTH = 20;

interface PlayerRow {
  id: string;
  nickname: string;
}

function normalizeNickname(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function validateNickname(value: unknown) {
  if (typeof value !== "string") {
    throw new HttpError(400, "Nickname must be a string.");
  }

  const nickname = normalizeNickname(value);

  if (nickname.length < NICKNAME_MIN_LENGTH || nickname.length > NICKNAME_MAX_LENGTH) {
    throw new HttpError(400, "Nickname must be between 2 and 20 characters.");
  }

  return nickname;
}

export async function createAnonymousPlayer(rawNickname: unknown) {
  const nickname = validateNickname(rawNickname);
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("players")
    .insert({ nickname })
    .select("id, nickname")
    .single<PlayerRow>();

  if (error || !data) {
    throw new HttpError(500, error?.message ?? "Failed to create player.");
  }

  return data;
}

export async function touchPlayer(playerId: string) {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from("players")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", playerId);

  if (error) {
    throw new HttpError(500, error.message);
  }
}
