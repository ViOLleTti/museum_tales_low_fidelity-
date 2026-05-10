"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CluePill, PageShell, Panel, PrimaryButton, StatusBadge } from "@/components/game-ui";
import { scanExhibit, useGameStore } from "@/lib/game-store";
import { getAllExhibitRules, getExhibitRule, scanExhibitResult } from "@/lib/narrative-rules";
import type { ExhibitId } from "@/lib/types";

function normalizeExhibitInput(value: string): ExhibitId | null {
  const normalized = value.trim().toUpperCase();
  return /^E[1-9]$/.test(normalized) ? (normalized as ExhibitId) : null;
}

export default function ScanPage() {
  const router = useRouter();
  const roleId = useGameStore((state) => state.selectedRole);
  const collectedClueIds = useGameStore((state) => state.collectedClueIds);
  const lastScannedExhibitId = useGameStore((state) => state.lastScannedExhibitId);
  const [scanInput, setScanInput] = useState(lastScannedExhibitId ?? "");
  const [selectedExhibitId, setSelectedExhibitId] = useState<ExhibitId | null>(lastScannedExhibitId);
  const [error, setError] = useState("");
  const exhibits = useMemo(() => getAllExhibitRules(), []);

  useEffect(() => {
    if (!roleId) {
      router.replace("/role");
    }
  }, [roleId, router]);

  useEffect(() => {
    if (lastScannedExhibitId) {
      setScanInput(lastScannedExhibitId);
      setSelectedExhibitId(lastScannedExhibitId);
    }
  }, [lastScannedExhibitId]);

  if (!roleId) {
    return null;
  }

  const currentExhibit = selectedExhibitId ? getExhibitRule(selectedExhibitId) : null;
  const currentScanResult = selectedExhibitId
    ? scanExhibitResult(selectedExhibitId, collectedClueIds)
    : null;

  return (
    <PageShell
      title={`${roleId} · 展品扫描`}
      subtitle="输入 E1-E9 模拟扫码。后期接入真实 AR / 二维码后，这个输入框可以直接移除。"
      bottomNav="scan"
    >
      <div className="mobile-section space-y-4">
        <Panel>
          <h2 className="text-xl font-semibold text-white">扫码输入</h2>
          <p className="mt-2 text-sm text-slate-400">
            先输入展品编号并提交，成功后会弹出 1 个关键词和 2 个模糊词。
          </p>

          <div className="mt-4 flex gap-3">
            <input
              value={scanInput}
              onChange={(event) => {
                setScanInput(event.target.value.toUpperCase());
                setError("");
              }}
              placeholder="输入 E1-E9"
              className="flex-1 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#202521] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[#cdee71]"
            />
            <PrimaryButton
              onClick={() => {
                const exhibitId = normalizeExhibitInput(scanInput);
                if (!exhibitId) {
                  setError("请输入有效展品编号：E1-E9。");
                  return;
                }
                scanExhibit(exhibitId);
                setSelectedExhibitId(exhibitId);
                setError("");
              }}
            >
              模拟扫码
            </PrimaryButton>
          </div>

          {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
        </Panel>

        <Panel className="flex flex-col items-center justify-center">
          <StatusBadge tone="amber">Stub AR Scan</StatusBadge>
          <div className="scan-frame-active mt-6 flex h-80 w-full max-w-md items-center justify-center rounded-[2rem] border-4 border-dashed border-emerald-500 bg-slate-950/90 p-6 text-center text-white">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">AR frame</p>
              <p className="mt-4 text-2xl font-semibold">
                {currentExhibit ? `已锁定 ${currentExhibit.id}` : "请输入任意展品编号"}
              </p>
              <p className="mt-3 text-sm text-slate-200">
                {currentExhibit ? currentExhibit.name : "后期这里可以直接接相机识别或二维码扫描。"}
              </p>
            </div>
          </div>
        </Panel>

        <Panel>
          {currentExhibit && currentScanResult ? (
            <div className="rounded-3xl bg-emerald-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">扫码成功</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900">{currentExhibit.name}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-700">{currentExhibit.observation}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <CluePill>{currentExhibit.highlightKeyword}</CluePill>
                {currentExhibit.fuzzyKeywords.map((keyword) => (
                  <StatusBadge key={keyword}>{keyword}</StatusBadge>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge tone="emerald">{currentScanResult.grantedClueId}</StatusBadge>
                <StatusBadge>{currentExhibit.scanClueName}</StatusBadge>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">输入展品编号后，这里会显示扫描结果与线索词。</p>
          )}
        </Panel>

        <Panel>
          <h2 className="text-lg font-semibold text-white">可扫描展品</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {exhibits.map((exhibit) => (
              <StatusBadge key={exhibit.id}>{exhibit.id}</StatusBadge>
            ))}
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
