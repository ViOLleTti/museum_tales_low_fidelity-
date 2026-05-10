"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageShell, Panel, PrimaryButton, StatusBadge } from "@/components/game-ui";
import { ROLES } from "@/lib/game-data";
import { useGameStore } from "@/lib/game-store";
import type { RoleId } from "@/lib/types";

export default function RolePage() {
  const router = useRouter();
  const selectRole = useGameStore((state) => state.selectRole);
  const [activeRole, setActiveRole] = useState<RoleId>("P1");

  return (
    <PageShell
      title="选择身份"
      subtitle="选定身份后会先进入地图页；后续结局会根据你扫描的展品和 NPC 有效对话自动判定。"
      backHref="/"
    >
      <div className="mobile-section grid gap-4">
        {ROLES.map((role) => {
          const selected = role.id === activeRole;

          return (
            <button
              key={role.id}
              type="button"
              onClick={() => setActiveRole(role.id)}
              className={`rounded-3xl border p-5 text-left transition ${
                selected
                  ? "border-[#cdee71] bg-[#cdee71] text-[#101110]"
                  : "border-[rgba(255,255,255,0.08)] bg-[#1a1d1a] text-white hover:border-[#cdee71]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] opacity-80">{role.id}</p>
                  <h2 className="mt-2 text-2xl font-semibold">{role.title}</h2>
                  <p className="text-sm opacity-80">{role.titleEn}</p>
                </div>
                {selected ? <StatusBadge tone="amber">已选中</StatusBadge> : null}
              </div>
              <p className="mt-4 text-sm leading-6 opacity-90">{role.blurb}</p>
            </button>
          );
        })}
      </div>

      <Panel className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">确认后将先进入地图页</h3>
          <p className="text-sm text-slate-400">
            本次游玩数据仅保存在当前页面状态中，刷新页面会重置进度。
          </p>
        </div>
        <PrimaryButton
          onClick={() => {
            selectRole(activeRole);
            router.push("/home");
          }}
        >
          以该身份进入
        </PrimaryButton>
      </Panel>
    </PageShell>
  );
}
