"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { isStoryUnlocked, useGameStore } from "@/lib/game-store";
import { ensureRunTracking } from "@/lib/leaderboard-client";
import { getStoryReconstruction, getStoryRule } from "@/lib/narrative-rules";

export default function ReconstructStoryPage() {
  const params = useParams<{ storyId: string }>();
  const router = useRouter();
  const roleId = useGameStore((state) => state.selectedRole);
  const submitStory = useGameStore((state) => state.submitStory);
  const story = useMemo(() => getStoryRule(params.storyId), [params.storyId]);
  const reconstruction = useMemo(() => getStoryReconstruction(params.storyId), [params.storyId]);
  const [animationStage, setAnimationStage] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!roleId) {
      router.replace("/role");
      return;
    }

    if (!story || !reconstruction || story.roleId !== roleId) {
      router.replace("/scan");
      return;
    }

    if (!isStoryUnlocked(story.storyId)) {
      router.replace("/npc");
    }
  }, [reconstruction, roleId, router, story]);

  useEffect(() => {
    if (reconstruction) {
      setSelectedOption(null);
      setFeedback("");
    }
  }, [reconstruction]);

  useEffect(() => {
    if (!roleId || !story) {
      return;
    }

    ensureRunTracking(roleId, story.storyId);
  }, [roleId, story]);

  useEffect(() => {
    const timer1 = window.setTimeout(() => setAnimationStage(1), 1200);
    const timer2 = window.setTimeout(() => setAnimationStage(2), 2200);
    const timer3 = window.setTimeout(() => setAnimationStage(3), 3200);

    return () => {
      window.clearTimeout(timer1);
      window.clearTimeout(timer2);
      window.clearTimeout(timer3);
    };
  }, []);

  if (!story || !reconstruction || !roleId || story.roleId !== roleId) {
    return null;
  }

  const options = [reconstruction.correctOption, reconstruction.distractorOption];

  return (
    <div className="phone-stage">
      <div className="phone-shell">
        <main className="mobile-app relative flex min-h-full items-center justify-center overflow-hidden bg-[#0a0a0a]">
          <div
            className={`absolute flex w-full flex-col items-center text-center transition-all duration-1000 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] ${
              animationStage >= 1 ? "-translate-y-[100px]" : ""
            }`}
          >
            <p
              className={`mb-3 text-xs font-light uppercase tracking-[0.3em] text-[#b8d96f] transition-all duration-700 ${
                animationStage >= 1 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
              }`}
            >
              STORY RECONSTRUCTION
            </p>
            <h1
              className={`whitespace-nowrap text-[44px] font-bold tracking-wide text-white transition-all duration-1000 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] ${
                animationStage >= 1 ? "scale-100" : "scale-125"
              }`}
            >
              干得漂亮！
            </h1>
          </div>

          <div
            className={`absolute w-full px-8 transition-all duration-700 [transition-timing-function:cubic-bezier(0.4,0,0.2,1)] ${
              animationStage >= 2
                ? "translate-y-[10px] opacity-100"
                : "pointer-events-none translate-y-[40px] opacity-0"
            }`}
          >
            <p className="text-center text-[19px] font-light leading-relaxed text-white">
              {reconstruction.sentencePrefix}
              <span className="relative top-1 mx-2 inline-block min-w-16 border-b-2 border-white/40 px-1 pb-0.5 align-baseline text-center leading-none">
                {selectedOption ?? ""}
              </span>
              {reconstruction.sentenceSuffix}
            </p>
          </div>

          <div
            className={`absolute flex w-full justify-center gap-5 px-6 transition-all duration-500 ${
              animationStage >= 3 ? "translate-y-[130px] scale-100 opacity-100" : "translate-y-[130px] scale-75 opacity-0"
            }`}
          >
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setSelectedOption(option);

                  if (option === reconstruction.correctOption) {
                    setFeedback("");
                    submitStory({
                      storyId: story.storyId,
                      orderedCardIds: [],
                      blankAnswers: [option],
                      perfectOrder: true,
                      perfectBlanks: true,
                      submittedAt: new Date().toISOString(),
                    });
                    router.push(`/end/${story.storyId}`);
                    return;
                  }

                  setFeedback("这个词偏得有点远，再试一次。");
                }}
                className={`max-w-[140px] flex-1 rounded-xl border border-white/5 bg-[#222222] px-6 py-3.5 text-[17px] font-medium text-white/90 shadow-lg transition-all hover:bg-[#333333] active:scale-95 ${
                  selectedOption === option ? "ring-2 ring-[#b8d96f]/40" : ""
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div
            className={`absolute bottom-10 px-8 text-center text-sm text-slate-400 transition-opacity duration-300 ${
              feedback ? "opacity-100" : "opacity-0"
            }`}
          >
            {feedback}
          </div>
        </main>
      </div>
    </div>
  );
}
