import type { RoleId } from "@/lib/types";

export const PLAYER_ID_STORAGE_KEY = "museum-player-id";
export const PLAYER_NICKNAME_STORAGE_KEY = "museum-player-nickname";
export const LAST_RUN_RESULT_STORAGE_KEY = "museum-last-run-result";

export function getRunSessionStorageKey(roleId: RoleId, storyId: string) {
  return `museum-run-session:${roleId}:${storyId}`;
}

export function getRunStartedAtStorageKey(roleId: RoleId, storyId: string) {
  return `museum-run-started-at:${roleId}:${storyId}`;
}

export function ensureRunTracking(roleId: RoleId, storyId: string) {
  const sessionKey = getRunSessionStorageKey(roleId, storyId);
  const startedAtKey = getRunStartedAtStorageKey(roleId, storyId);
  let sessionId = window.sessionStorage.getItem(sessionKey);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    window.sessionStorage.setItem(sessionKey, sessionId);
  }

  let startedAt = window.sessionStorage.getItem(startedAtKey);

  if (!startedAt) {
    startedAt = String(Date.now());
    window.sessionStorage.setItem(startedAtKey, startedAt);
  }

  return {
    sessionId,
    startedAt: Number(startedAt),
  };
}

export function clearRunTracking(roleId: RoleId, storyId: string) {
  window.sessionStorage.removeItem(getRunSessionStorageKey(roleId, storyId));
  window.sessionStorage.removeItem(getRunStartedAtStorageKey(roleId, storyId));
}

export interface PlayerInitResponse {
  playerId: string;
  nickname: string;
}

export interface SubmitRunResponse {
  runId: string;
  score: number;
  grade: string;
  globalRank: number | null;
  roleRank: number | null;
  isPersonalBest: boolean;
}

export interface LeaderboardItem {
  rank: number;
  playerId: string;
  nickname: string;
  roleId: RoleId;
  storyId: string;
  storyTitle: string;
  score: number;
  grade: string;
  perfectOrder: boolean;
  perfectBlanks: boolean;
  durationSeconds: number | null;
  submittedAt: string;
}

export interface LeaderboardResponse {
  scope: "global" | "role";
  roleId: RoleId | null;
  items: LeaderboardItem[];
  myRank: number | null;
  myBest: LeaderboardItem | null;
  recentRuns: LeaderboardItem[];
}

export interface LeaderboardBundleResponse {
  global: LeaderboardResponse;
  role: LeaderboardResponse;
}

export interface LastRunResult {
  storyId: string;
  runId: string;
  score: number;
  grade: string;
  globalRank: number | null;
  roleRank: number | null;
  isPersonalBest: boolean;
}
