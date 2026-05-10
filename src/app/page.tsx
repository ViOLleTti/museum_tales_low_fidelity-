import Link from "next/link";
import { PageShell, Panel } from "@/components/game-ui";

export default function HomePage() {
  return (
    <PageShell
      title="虚拟古代数字人 · 单机本地闭环"
      subtitle="阶段二本地原型：选择身份后输入 E1-E9 模拟扫码，获得 AR 线索并继续向 NPC 追问，满足结局条件后进入故事还原并到达 END。"
    >
      <div className="mobile-section space-y-4">
        <Panel className="hero-panel">
          <h2 className="text-xl font-semibold text-[#101110]">本阶段可玩的完整流程</h2>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-[#24301b]">
            <li>1. 选择身份，进入探索流程。</li>
            <li>2. 进入统一扫码页，输入 E1-E9 模拟扫描。</li>
            <li>3. 前往 NPC 页进行对话，自由选择三个 NPC 中的任意一个追问。</li>
            <li>4. 满足结局前置条件后，自动进入故事还原页。</li>
            <li>5. 完成还原并进入 END 页查看结局、分数和等级。</li>
            <li>6. 点击“查看当前排名”，首次输入昵称后同步云端成绩。</li>
            <li>7. 在 Profile 中查看身份榜、总榜与最近记录。</li>
            <li>8. 同身份同结局可重复挑战，排行榜会刷新为最新成绩。</li>
          </ol>
        </Panel>

        <Panel className="flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">当前范围</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>单人完整闭环（身份选择 - 扫码 - NPC - 还原 - 结局）</li>
              <li>扫码仍为输入模拟，未接入真实 WebAR / 相机识别</li>
              <li>已接入匿名昵称 + 云端排行榜（身份榜 / 总榜）</li>
              <li>支持同身份同结局重复提交并刷新记录</li>
            </ul>
          </div>

          <Link
            href="/role"
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#cdee71] px-5 py-3 text-sm font-semibold text-[#101110] transition hover:bg-[#d8f290]"
          >
            开始游戏
          </Link>
        </Panel>
      </div>
    </PageShell>
  );
}
