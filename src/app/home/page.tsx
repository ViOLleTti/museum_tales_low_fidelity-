"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageShell, Panel, StatusBadge } from "@/components/game-ui";
import { ROLES } from "@/lib/game-data";
import { useGameStore } from "@/lib/game-store";

export default function MapHomePage() {
  const router = useRouter();
  const roleId = useGameStore((state) => state.selectedRole);
  const currentRole = ROLES.find((role) => role.id === roleId);

  useEffect(() => {
    if (!roleId) {
      router.replace("/role");
    }
  }, [roleId, router]);

  if (!roleId) {
    return null;
  }

  return (
    <PageShell
      title="Home"
      subtitle="地图页占位：阶段二先保留空白入口，后续再接入真实地图与探索节点。"
      backHref="/role"
      bottomNav="home"
    >
      <div className="mobile-section space-y-4">
        <Panel className="min-h-[320px] flex flex-col items-center justify-center text-center">
          <StatusBadge tone="amber">{roleId}</StatusBadge>
          <h2 className="mt-4 text-2xl font-semibold text-white">{currentRole?.title ?? "当前身份"}</h2>
          <p className="mt-3 max-w-xs text-sm leading-6 text-slate-400">
            这里是地图页占位区，当前先保持空白。你可以直接通过底部导航进入 Scan 或 Chat。
          </p>
        </Panel>
      </div>
    </PageShell>
  );
}
