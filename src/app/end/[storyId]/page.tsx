"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CluePill, PageShell, Panel, StatusBadge } from "@/components/game-ui";
import {
  clearRunTracking,
  ensureRunTracking,
  LAST_RUN_RESULT_STORAGE_KEY,
  PLAYER_ID_STORAGE_KEY,
  PLAYER_NICKNAME_STORAGE_KEY,
  type PlayerInitResponse,
  type LastRunResult,
  type SubmitRunResponse,
} from "@/lib/leaderboard-client";
import {
  getStoryResult,
  isStoryUnlocked,
  markEndingViewed,
  rollbackLatestDialogueProgress,
  useGameStore,
} from "@/lib/game-store";
import { getStoryProgress, getStoryRule } from "@/lib/narrative-rules";

export default function EndPage() {
  const params = useParams<{ storyId: string }>();
  const router = useRouter();
  const roleId = useGameStore((state) => state.selectedRole);
  const collectedClueIds = useGameStore((state) => state.collectedClueIds);
  const scannedExhibits = useGameStore((state) => state.scannedExhibits);
  const story = useMemo(() => getStoryRule(params.storyId), [params.storyId]);
  const reconstructionResult = story ? getStoryResult(story.storyId) : undefined;
  const [lastRunResult, setLastRunResult] = useState<LastRunResult | null>(null);
  const [nickname, setNickname] = useState("");
  const [showNicknameInput, setShowNicknameInput] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmittingRank, setIsSubmittingRank] = useState(false);

  useEffect(() => {
    if (!roleId) {
      router.replace("/role");
      return;
    }

    if (!story || story.roleId !== roleId) {
      router.replace("/scan");
      return;
    }

    if (!isStoryUnlocked(story.storyId)) {
      router.replace("/scan");
      return;
    }

    if (!reconstructionResult) {
      router.replace(`/reconstruct/${story.storyId}`);
      return;
    }

    markEndingViewed(story.storyId);
  }, [reconstructionResult, roleId, router, story]);

  useEffect(() => {
    if (!story) {
      return;
    }

    const storedNickname = window.localStorage.getItem(PLAYER_NICKNAME_STORAGE_KEY) ?? "";
    setNickname(storedNickname);

    const rawValue = window.sessionStorage.getItem(LAST_RUN_RESULT_STORAGE_KEY);

    if (!rawValue) {
      setLastRunResult(null);
      return;
    }

    try {
      const parsed = JSON.parse(rawValue) as LastRunResult;
      setLastRunResult(parsed.storyId === story.storyId ? parsed : null);
    } catch {
      setLastRunResult(null);
    }
  }, [story]);

  if (!story || !roleId || !reconstructionResult) {
    return null;
  }

  const currentStory = story;
  const currentRoleId = roleId;
  const currentReconstructionResult = reconstructionResult;
  const progress = getStoryProgress(story.storyId, collectedClueIds, scannedExhibits);

  async function createAnonymousPlayer(rawNickname: string) {
    const normalizedNickname = rawNickname.trim().replace(/\s+/g, " ");

    if (!normalizedNickname) {
      throw new Error("请输入昵称后再查看当前排名。");
    }

    const response = await fetch("/api/player/init", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nickname: normalizedNickname }),
    });

    const data = (await response.json()) as PlayerInitResponse | { error?: string };

    if (!response.ok || !("playerId" in data)) {
      throw new Error(("error" in data && data.error) || "创建匿名玩家失败。");
    }

    window.localStorage.setItem(PLAYER_ID_STORAGE_KEY, data.playerId);
    window.localStorage.setItem(PLAYER_NICKNAME_STORAGE_KEY, data.nickname);
    setNickname(data.nickname);

    return data.playerId;
  }

  async function submitRanking(playerId: string) {
    const tracking = ensureRunTracking(currentRoleId, currentStory.storyId);
    const durationSeconds = Math.max(
      0,
      Math.round((Date.parse(currentReconstructionResult.submittedAt) - tracking.startedAt) / 1000),
    );
    const sessionId = `${playerId}:${tracking.sessionId}`;
    const response = await fetch("/api/run/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        playerId,
        sessionId,
        roleId: currentRoleId,
        storyId: currentStory.storyId,
        perfectOrder: currentReconstructionResult.perfectOrder,
        perfectBlanks: currentReconstructionResult.perfectBlanks,
        durationSeconds,
        submittedAt: currentReconstructionResult.submittedAt,
        collectedClueIds,
        scannedExhibitIds: scannedExhibits,
      }),
    });

    const data = (await response.json()) as SubmitRunResponse | { error?: string };

    if (!response.ok || !("runId" in data)) {
      throw new Error(("error" in data && data.error) || "排行榜同步失败。");
    }

    const nextResult: LastRunResult = {
      storyId: currentStory.storyId,
      runId: data.runId,
      score: data.score,
      grade: data.grade,
      globalRank: data.globalRank,
      roleRank: data.roleRank,
      isPersonalBest: data.isPersonalBest,
    };

    window.sessionStorage.setItem(LAST_RUN_RESULT_STORAGE_KEY, JSON.stringify(nextResult));
    clearRunTracking(currentRoleId, currentStory.storyId);
    setLastRunResult(nextResult);
  }

  async function handleViewRanking() {
    if (isSubmittingRank) {
      return;
    }

    setSubmitError("");

    const existingPlayerId = window.localStorage.getItem(PLAYER_ID_STORAGE_KEY);

    if (!existingPlayerId) {
      setShowNicknameInput(true);
      return;
    }

    try {
      setIsSubmittingRank(true);
      await submitRanking(existingPlayerId);
      rollbackLatestDialogueProgress();
      router.push("/profile");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "排行榜同步失败。");
    } finally {
      setIsSubmittingRank(false);
    }
  }

  async function handleNicknameSubmit() {
    if (isSubmittingRank) {
      return;
    }

    try {
      setIsSubmittingRank(true);
      setSubmitError("");
      const playerId = await createAnonymousPlayer(nickname);
      await submitRanking(playerId);
      rollbackLatestDialogueProgress();
      router.push("/profile");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "排行榜同步失败。");
    } finally {
      setIsSubmittingRank(false);
    }
  }

  return (
    <PageShell
      title={`干得漂亮 · ${story.grade} · END`}
      subtitle="你已经满足这个结局的全部前置条件：扫描线索与有效 NPC 对话都已经完成。"
      backHref="/scan"
    >
      <div className="mobile-section space-y-4">
        <Panel className="bg-slate-950 text-white">
          <p className="text-sm uppercase tracking-[0.25em] text-amber-300">Ending Unlocked</p>
          <h2 className="mt-3 text-3xl font-semibold">{story.title}</h2>
          <p className="mt-4 text-sm leading-7 text-slate-200">{story.feedback}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <StatusBadge tone="amber">身份：{roleId}</StatusBadge>
            <StatusBadge tone="emerald">分数：{story.score}</StatusBadge>
            <StatusBadge tone="emerald">等级：{story.grade}</StatusBadge>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {progress.requiredClueIds.map((clueId) => (
              <CluePill key={clueId}>{clueId}</CluePill>
            ))}
          </div>
        </Panel>

        {lastRunResult ? (
          <Panel>
            <h3 className="text-lg font-semibold text-white">排行榜同步结果</h3>
            <div className="mt-4 flex flex-wrap gap-3">
              <StatusBadge tone="amber">
                总榜：{lastRunResult.globalRank ? `第 ${lastRunResult.globalRank} 名` : "未上榜"}
              </StatusBadge>
              <StatusBadge tone="emerald">
                身份榜：{lastRunResult.roleRank ? `第 ${lastRunResult.roleRank} 名` : "未上榜"}
              </StatusBadge>
              {lastRunResult.isPersonalBest ? (
                <StatusBadge tone="emerald">个人最佳</StatusBadge>
              ) : null}
            </div>
          </Panel>
        ) : null}

        <div className="space-y-6">
          <Panel>
            <h3 className="text-lg font-semibold text-white">达成条件</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p>所需线索：{progress.requiredClueIds.join(" / ")}</p>
              <p>所需展品：{progress.requiredExhibitIds.join(" / ")}</p>
              <p>描述：{story.description}</p>
              <p>排序结果：{reconstructionResult.perfectOrder ? "正确" : "可优化"}</p>
              <p>填空结果：{reconstructionResult.perfectBlanks ? "正确" : "可优化"}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {progress.requiredClueIds.map((clueId) => (
                <StatusBadge
                  key={clueId}
                  tone={collectedClueIds.includes(clueId) ? "emerald" : "slate"}
                >
                  {clueId}
                </StatusBadge>
              ))}
            </div>
          </Panel>

          <Panel>
            <h3 className="text-lg font-semibold text-white">下一步</h3>
            <div className="mt-4 grid gap-3">
              <Link
                href="/scan"
                onClick={() => rollbackLatestDialogueProgress()}
                className="rounded-2xl bg-[#cdee71] px-5 py-3 text-center text-sm font-semibold text-[#101110] transition hover:bg-[#d8f290]"
              >
                返回扫码页继续探索
              </Link>
              <Link
                href="/role"
                className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#1a1d1a] px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-[#232823]"
              >
                更换身份
              </Link>
              <button
                type="button"
                onClick={() => {
                  void handleViewRanking();
                }}
                disabled={isSubmittingRank}
                className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#1a1d1a] px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-[#232823] disabled:cursor-not-allowed disabled:opacity-70"
              >
                查看当前排名
              </button>
            </div>
            {showNicknameInput ? (
              <div className="mt-4 space-y-3 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#151815] p-4">
                <label className="block text-sm font-medium text-white" htmlFor="leaderboard-nickname">
                  请输入昵称
                </label>
                <input
                  id="leaderboard-nickname"
                  type="text"
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="2-20 个字符"
                  maxLength={20}
                  className="w-full rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0f110f] px-4 py-3 text-sm text-white outline-none transition focus:border-[#cdee71]"
                />
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      void handleNicknameSubmit();
                    }}
                    disabled={isSubmittingRank}
                    className="rounded-2xl bg-[#cdee71] px-4 py-3 text-sm font-semibold text-[#101110] transition hover:bg-[#d8f290] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmittingRank ? "提交中..." : "确认并查看排名"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNicknameInput(false);
                      setSubmitError("");
                    }}
                    disabled={isSubmittingRank}
                    className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#1a1d1a] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#232823] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    取消
                  </button>
                </div>
                {submitError ? <p className="text-sm text-rose-300">{submitError}</p> : null}
              </div>
            ) : submitError ? (
              <p className="mt-4 text-sm text-rose-300">{submitError}</p>
            ) : null}
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
