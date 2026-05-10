"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CluePill, PageShell, Panel, PrimaryButton, StatusBadge } from "@/components/game-ui";
import { NPCS } from "@/lib/game-data";
import { applyDialogueResult, useGameStore } from "@/lib/game-store";
import {
  checkEndingUnlock,
  checkNpcDialogueTrigger,
  getExhibitRule,
  getNpcFallbackDialogue,
  hasRemainingDialogueTriggers,
} from "@/lib/narrative-rules";
import type { DialogueCheckResult } from "@/lib/narrative-types";
import type { NpcId, RoleId } from "@/lib/types";

const NPC_SCAN_HINTS: Record<NpcId, string> = {
  N1: "也许先去看看别的展品，会有更清楚的线索浮出来，到时再聊可能更容易串起故事。",
  N2: "你可以先沿着展品再找一点观察线索，说不定下一次回来问，我会更想倾诉点什么。",
  N3: "不妨先去展柜那边转转，等你抓到新的展品线索，我们再继续往下说。",
};

function buildScanHint(roleId: RoleId, npcId: NpcId): DialogueCheckResult {
  return {
    success: true,
    isValidTrigger: false,
    isRepeatedTrigger: false,
    roleId,
    npcId,
    fallbackDialogue: NPC_SCAN_HINTS[npcId],
  };
}

export default function NpcPage() {
  const router = useRouter();
  const roleId = useGameStore((state) => state.selectedRole);
  const collectedClueIds = useGameStore((state) => state.collectedClueIds);
  const scannedExhibits = useGameStore((state) => state.scannedExhibits);
  const consumedTriggerIds = useGameStore((state) => state.consumedTriggerIds);
  const lastScannedExhibitId = useGameStore((state) => state.lastScannedExhibitId);
  const [dialogueResult, setDialogueResult] = useState<DialogueCheckResult | null>(null);

  const unlockedEnding = useMemo(
    () => (roleId ? checkEndingUnlock(roleId, collectedClueIds).ending : undefined),
    [collectedClueIds, roleId],
  );

  useEffect(() => {
    if (!roleId) {
      router.replace("/role");
    }
  }, [roleId, router]);

  if (!roleId) {
    return null;
  }

  const currentExhibit = lastScannedExhibitId ? getExhibitRule(lastScannedExhibitId) : null;
  const hasRemainingTriggers = hasRemainingDialogueTriggers(roleId, scannedExhibits, consumedTriggerIds);

  return (
    <PageShell
      title={currentExhibit ? `${currentExhibit.name} · NPC 选择` : "NPC 选择"}
      subtitle={
        currentExhibit
          ? "扫描后会弹出三个 NPC。你可以自由选择对话对象，只有命中有效 NPC 时才会获得 F10-F25 线索。"
          : "当前还没有选中展品。你仍然可以先和三个 NPC 对话，他们会提示你先去找一找展品线索。"
      }
      bottomNav="chat"
    >
      <div className="mobile-section space-y-4">
        <Panel>
          {currentExhibit ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="amber">{currentExhibit.id}</StatusBadge>
                <StatusBadge tone="emerald">{currentExhibit.scanClueId}</StatusBadge>
              </div>
              <h2 className="mt-3 text-xl font-semibold text-white">{currentExhibit.name}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{currentExhibit.observation}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <CluePill>{currentExhibit.highlightKeyword}</CluePill>
                {currentExhibit.fuzzyKeywords.map((keyword) => (
                  <StatusBadge key={keyword}>{keyword}</StatusBadge>
                ))}
              </div>
            </>
          ) : (
            <>
              <StatusBadge tone="amber">未扫描展品</StatusBadge>
              <h2 className="mt-3 text-xl font-semibold text-white">先聊也可以，但暂时不会推进剧情</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                你现在可以先点进三个 NPC 看他们给出的提示。等去 Scan 输入任意展品编号后，再回来追问，才可能命中有效对话并获得 F10-F25 线索。
              </p>
            </>
          )}
        </Panel>

        {NPCS.map((npc) => (
          <Panel key={npc.id}>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone="amber">{npc.name}</StatusBadge>
              {dialogueResult?.npcId === npc.id && dialogueResult.isValidTrigger ? (
                <StatusBadge tone="emerald">
                  {dialogueResult.isRepeatedTrigger ? "已记录过" : "有效对话"}
                </StatusBadge>
              ) : null}
            </div>

            <h2 className="mt-3 text-xl font-semibold text-white">向 {npc.name} 追问这件展品</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              大多数 NPC 只会给出普通回应，只有命中有效对象时才会推进剧情。
            </p>

            <div className="mt-5">
              <PrimaryButton
                onClick={() => {
                  let result: DialogueCheckResult;

                  if (!currentExhibit || !hasRemainingTriggers) {
                    result = buildScanHint(roleId, npc.id as NpcId);
                  } else {
                    const checkedResult = checkNpcDialogueTrigger({
                      roleId,
                      exhibitId: currentExhibit.id,
                      npcId: npc.id as NpcId,
                      scannedExhibits,
                      consumedTriggerIds,
                    });

                    result =
                      checkedResult.isValidTrigger && !checkedResult.isRepeatedTrigger
                        ? checkedResult
                        : {
                            ...checkedResult,
                            isValidTrigger: false,
                            fallbackDialogue: getNpcFallbackDialogue(npc.id as NpcId),
                          };
                  }
                  setDialogueResult(result);
                  if (result.isValidTrigger) {
                    applyDialogueResult(result);
                  }
                }}
              >
                与 {npc.name} 对话
              </PrimaryButton>
            </div>

            {dialogueResult?.npcId === npc.id ? (
              <div className="mt-5 rounded-3xl bg-[#202521] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {dialogueResult.isValidTrigger ? "有效对话" : dialogueResult.fallbackDialogue === NPC_SCAN_HINTS[npc.id as NpcId] ? "探索提示" : "普通对话"}
                </p>
                <p className="mt-3 text-sm font-medium text-white">
                  {dialogueResult.prompt ??
                    (dialogueResult.fallbackDialogue === NPC_SCAN_HINTS[npc.id as NpcId]
                      ? `${npc.name} 的提示`
                      : currentExhibit
                        ? `关于 ${currentExhibit.name}，${npc.name} 的回应`
                        : `${npc.name} 的回应`)}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {dialogueResult.response ?? dialogueResult.fallbackDialogue}
                </p>

                {dialogueResult.isValidTrigger ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {dialogueResult.rewardClueId ? (
                      <StatusBadge tone="emerald">{dialogueResult.rewardClueId}</StatusBadge>
                    ) : null}
                    {dialogueResult.rewardClueName ? (
                      <StatusBadge>{dialogueResult.rewardClueName}</StatusBadge>
                    ) : null}
                    {dialogueResult.isSecret ? <StatusBadge tone="amber">隐藏触发</StatusBadge> : null}
                  </div>
                ) : null}

                {dialogueResult.keywords?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {dialogueResult.keywords.map((keyword) => (
                      <CluePill key={keyword}>{keyword}</CluePill>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </Panel>
        ))}

        <Panel>
          <h2 className="text-lg font-semibold text-white">本轮已收集线索</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {collectedClueIds.length ? (
              collectedClueIds.map((clueId) => <CluePill key={clueId}>{clueId}</CluePill>)
            ) : (
              <p className="text-sm text-slate-500">还没有有效线索，先尝试和上面的 NPC 对话。</p>
            )}
          </div>
          {unlockedEnding ? (
            <PrimaryButton className="mt-5 w-full" onClick={() => router.push(`/reconstruct/${unlockedEnding.storyId}`)}>
              已满足结局条件，进入故事还原页
            </PrimaryButton>
          ) : (
            <p className="mt-5 text-sm text-slate-500">
              如未触发有效对话，可以返回扫码页重新输入其他展品编号继续探索。
            </p>
          )}
        </Panel>
      </div>
    </PageShell>
  );
}
