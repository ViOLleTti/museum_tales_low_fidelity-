"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type BottomNavTab = "home" | "scan" | "chat" | "profile";

export function PageShell({
  title,
  subtitle,
  children,
  backHref,
  bottomNav,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  backHref?: string;
  bottomNav?: BottomNavTab;
}) {
  const pathname = usePathname();
  const navItems: Array<{ id: BottomNavTab; label: string; href: string }> = [
    { id: "home", label: "Home", href: "/home" },
    { id: "scan", label: "Scan", href: "/scan" },
    { id: "chat", label: "Chat", href: "/npc" },
    { id: "profile", label: "Profile", href: "/profile" },
  ];

  return (
    <div className="phone-stage">
      <div className="phone-shell">
        <main className={`mobile-app flex min-h-full flex-col ${bottomNav ? "pb-6" : ""}`}>
          <div className="mobile-header">
            <div className="mobile-header-center">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-[#cdee71]">
                廿载交汇
              </p>
              <h1 className="mt-2 text-[28px] font-semibold leading-tight text-white">{title}</h1>
              {subtitle ? <p className="mt-2 text-sm leading-6 text-slate-400">{subtitle}</p> : null}
            </div>
            {backHref ? (
              <Link
                href={backHref}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[#1a1d1a] text-sm font-medium text-white transition hover:bg-[#232823]"
              >
                返回
              </Link>
            ) : null}
          </div>
          <div className="flex-1">{children}</div>
          {bottomNav ? (
            <nav className="sticky bottom-0 z-20 mt-6 rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[rgba(26,29,26,0.96)] px-3 py-3 backdrop-blur">
              <div className="grid grid-cols-4 gap-2">
                {navItems.map((item) => {
                  const isActive = bottomNav === item.id || pathname === item.href;

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`rounded-2xl px-3 py-3 text-center text-sm font-medium transition ${
                        isActive
                          ? "bg-[#cdee71] text-[#101110]"
                          : "bg-[#202521] text-slate-300 hover:bg-[#262c26]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </nav>
          ) : null}
        </main>
      </div>
    </div>
  );
}

export function CluePill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[rgba(205,238,113,0.18)] bg-[rgba(205,238,113,0.12)] px-3 py-1 text-sm font-medium text-[#e7f6ac]">
      {children}
    </span>
  );
}

export function StatusBadge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "amber" | "emerald" | "slate";
}) {
  const className =
    tone === "emerald"
      ? "bg-emerald-100 text-emerald-900"
      : tone === "amber"
        ? "bg-[#cdee71] text-[#101110]"
        : "bg-[#262a26] text-slate-300";

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{children}</span>;
}

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-2xl bg-[#cdee71] px-5 py-3 text-sm font-semibold text-[#101110] transition hover:bg-[#d8f290] disabled:cursor-not-allowed disabled:bg-slate-500 disabled:text-slate-200 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`mobile-panel p-5 ${className}`}>{children}</section>;
}
