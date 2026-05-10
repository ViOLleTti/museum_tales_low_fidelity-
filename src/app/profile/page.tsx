"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell, Panel } from "@/components/game-ui";
import { useGameStore } from "@/lib/game-store";
import { ROLES } from "@/lib/game-data";
import {
  type LeaderboardBundleResponse,
  LAST_RUN_RESULT_STORAGE_KEY,
  PLAYER_ID_STORAGE_KEY,
  PLAYER_NICKNAME_STORAGE_KEY,
  type LastRunResult,
  type LeaderboardItem,
} from "@/lib/leaderboard-client";

type LeaderboardTab = "role" | "global";

export default function ProfilePage() {
  const router = useRouter();
  const roleId = useGameStore((state) => state.selectedRole);
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("role");
  const [playerNickname, setPlayerNickname] = useState("匿名玩家");
  const [lastRunResult, setLastRunResult] = useState<LastRunResult | null>(null);
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardBundleResponse["global"] | null>(null);
  const [roleLeaderboard, setRoleLeaderboard] = useState<LeaderboardBundleResponse["role"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!roleId) {
      router.replace("/role");
    }
  }, [roleId, router]);

  useEffect(() => {
    if (!roleId) {
      return;
    }

    const currentRoleId = roleId;
    const storedNickname = window.localStorage.getItem(PLAYER_NICKNAME_STORAGE_KEY);
    const playerId = window.localStorage.getItem(PLAYER_ID_STORAGE_KEY);
    const rawLastRun = window.sessionStorage.getItem(LAST_RUN_RESULT_STORAGE_KEY);

    if (storedNickname) {
      setPlayerNickname(storedNickname);
    }

    if (rawLastRun) {
      try {
        setLastRunResult(JSON.parse(rawLastRun) as LastRunResult);
      } catch {
        setLastRunResult(null);
      }
    }

    async function loadLeaderboards() {
      setIsLoading(true);
      setError("");

      try {
        const leaderboardUrl = new URL("/api/leaderboard", window.location.origin);
        leaderboardUrl.searchParams.set("scope", "bundle");
        leaderboardUrl.searchParams.set("roleId", currentRoleId);
        leaderboardUrl.searchParams.set("limit", "10");
        if (playerId) {
          leaderboardUrl.searchParams.set("playerId", playerId);
        }

        const response = await fetch(leaderboardUrl.toString());
        const data = (await response.json()) as LeaderboardBundleResponse | { error?: string };

        if (!response.ok || !("global" in data) || !("role" in data)) {
          throw new Error(("error" in data && data.error) || "加载排行榜失败。");
        }

        setGlobalLeaderboard(data.global);
        setRoleLeaderboard(data.role);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "排行榜加载失败。");
      } finally {
        setIsLoading(false);
      }
    }

    void loadLeaderboards();
  }, [roleId]);

  if (!roleId) {
    return null;
  }

  const currentRole = ROLES.find((role) => role.id === roleId);
  const currentRoleTitle = currentRole?.title ?? roleId;
  const activeLeaderboard = activeTab === "role" ? roleLeaderboard : globalLeaderboard;
  const bestItem = roleLeaderboard?.myBest ?? globalLeaderboard?.myBest ?? null;

  function formatDuration(durationSeconds: number | null) {
    if (durationSeconds === null || durationSeconds === undefined) {
      return "-- m -- s";
    }

    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    return `${minutes} m ${String(seconds).padStart(2, "0")} s`;
  }

  function renderLeaderboardItems(items: LeaderboardItem[]) {
    if (!items.length) {
      return <p className="mt-3 text-sm leading-6 text-slate-400">还没有人上榜，快来成为第一个。</p>;
    }

    return (
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div
            key={`${item.rank}-${item.playerId}-${item.storyId}`}
            className="min-h-[113px] rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#1a1d1a] px-4 py-4"
          >
            <div className="flex min-h-[81px] items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-xl font-semibold text-white">
                  #{item.rank} · {item.nickname}
                </p>
                <p className="mt-2 text-lg text-slate-300">{item.storyTitle}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-[#cdee71]">{item.grade}</p>
                <p className="mt-2 text-sm text-slate-400">{formatDuration(item.durationSeconds)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <PageShell
      title="Profile"
      subtitle="查看匿名昵称、最近一次同步结果，以及总榜 / 身份榜的实时排行。"
      bottomNav="profile"
    >
      <div className="mobile-section space-y-4">
        <Panel>
          <h2 className="text-xl font-semibold text-white">个人信息</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p>昵称：{playerNickname}</p>
            <p>当前身份：{currentRoleTitle}</p>
            <p>
              最佳成绩：
              {bestItem ? ` ${bestItem.score} 分 / ${bestItem.grade} / ${bestItem.storyTitle}` : " 暂无"}
            </p>
            <p>
              最近同步：
              {lastRunResult
                ? ` 总榜第 ${lastRunResult.globalRank ?? globalLeaderboard?.myRank ?? "-"} 名，身份榜第 ${lastRunResult.roleRank ?? roleLeaderboard?.myRank ?? "-"} 名`
                : " 暂无"}
            </p>
          </div>
        </Panel>

        <Panel>
          <h2 className="text-xl font-semibold text-white">排行榜</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("role")}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                activeTab === "role"
                  ? "bg-[#cdee71] text-[#101110]"
                  : "bg-[#1a1d1a] text-slate-300 hover:bg-[#232823]"
              }`}
            >
              {currentRoleTitle}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("global")}
              className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                activeTab === "global"
                  ? "bg-[#cdee71] text-[#101110]"
                  : "bg-[#1a1d1a] text-slate-300 hover:bg-[#232823]"
              }`}
            >
              总榜
            </button>
          </div>
          {isLoading ? <p className="mt-4 text-sm text-slate-400">排行榜加载中...</p> : null}
          {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
          {!isLoading && !error && activeLeaderboard ? renderLeaderboardItems(activeLeaderboard.items) : null}
        </Panel>

        <Panel>
          <h2 className="text-xl font-semibold text-white">我的最近记录</h2>
          {!globalLeaderboard?.recentRuns.length ? (
            <p className="mt-3 text-sm leading-6 text-slate-400">完成并同步一局后，这里会展示你最近 5 次记录。</p>
          ) : (
            <div className="mt-4 space-y-3">
              {globalLeaderboard.recentRuns.map((item) => (
                <div
                  key={`${item.submittedAt}-${item.storyId}`}
                  className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#1a1d1a] px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{item.storyTitle}</p>
                      <p className="mt-1 text-xs text-slate-400">{new Date(item.submittedAt).toLocaleString()}</p>
                    </div>
                    <div className="text-right text-sm text-[#cdee71]">
                      {item.score} 分 / {item.grade}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </PageShell>
  );
}
