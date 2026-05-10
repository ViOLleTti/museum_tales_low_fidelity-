"use client";

import { create } from "zustand";
import {
  getExhibitRule,
  getRoleRuleSet,
  isStoryUnlocked as isStoryUnlockedByRule,
} from "./narrative-rules";
import type { ClueId, DialogueCheckResult } from "./narrative-types";
import type { ExhibitId, RoleId, StoryResult } from "./types";

interface GameState {
  selectedRole: RoleId | null;
  collectedClueIds: ClueId[];
  scannedExhibits: ExhibitId[];
  consumedTriggerIds: string[];
  viewedEndingStoryIds: string[];
  lastScannedExhibitId: ExhibitId | null;
  submittedResults: Record<string, StoryResult>;
  selectRole: (roleId: RoleId) => void;
  resetRun: () => void;
  scanExhibit: (exhibitId: ExhibitId) => void;
  applyDialogueResult: (result: DialogueCheckResult) => void;
  rollbackLatestDialogueProgress: () => void;
  markEndingViewed: (storyId: string) => void;
  submitStory: (result: StoryResult) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  selectedRole: null,
  collectedClueIds: [],
  scannedExhibits: [],
  consumedTriggerIds: [],
  viewedEndingStoryIds: [],
  lastScannedExhibitId: null,
  submittedResults: {},
  selectRole: (roleId) =>
    set({
      selectedRole: roleId,
      collectedClueIds: [],
      scannedExhibits: [],
      consumedTriggerIds: [],
      viewedEndingStoryIds: [],
      lastScannedExhibitId: null,
      submittedResults: {},
    }),
  resetRun: () =>
    set({
      selectedRole: null,
      collectedClueIds: [],
      scannedExhibits: [],
      consumedTriggerIds: [],
      viewedEndingStoryIds: [],
      lastScannedExhibitId: null,
      submittedResults: {},
    }),
  scanExhibit: (exhibitId) => {
    const exhibit = getExhibitRule(exhibitId);

    set((state) => ({
      scannedExhibits: state.scannedExhibits.includes(exhibitId)
        ? state.scannedExhibits
        : [...state.scannedExhibits, exhibitId],
      collectedClueIds: dedupe([...state.collectedClueIds, exhibit.scanClueId]),
      lastScannedExhibitId: exhibitId,
    }));
  },
  applyDialogueResult: (result) => {
    if (
      !result.isValidTrigger ||
      result.isRepeatedTrigger ||
      !result.matchedTriggerId ||
      !result.rewardClueId
    ) {
      return;
    }

    const matchedTriggerId = result.matchedTriggerId;
    const rewardClueId = result.rewardClueId;

    set((state) => ({
      consumedTriggerIds: state.consumedTriggerIds.includes(matchedTriggerId)
        ? state.consumedTriggerIds
        : [...state.consumedTriggerIds, matchedTriggerId],
      collectedClueIds: dedupe([...state.collectedClueIds, rewardClueId]),
    }));
  },
  rollbackLatestDialogueProgress: () => {
    const state = get();
    const { selectedRole, consumedTriggerIds } = state;

    if (!selectedRole || !consumedTriggerIds.length) {
      return;
    }

    const latestTriggerId = consumedTriggerIds[consumedTriggerIds.length - 1];
    const latestTrigger = getRoleRuleSet(selectedRole).triggers.find(
      (trigger) => trigger.triggerId === latestTriggerId,
    );

    if (!latestTrigger) {
      return;
    }

    set((current) => ({
      consumedTriggerIds: current.consumedTriggerIds.slice(0, -1),
      collectedClueIds: current.collectedClueIds.filter(
        (clueId) => clueId !== latestTrigger.rewardClueId,
      ),
    }));
  },
  markEndingViewed: (storyId) =>
    set((state) => ({
      viewedEndingStoryIds: state.viewedEndingStoryIds.includes(storyId)
        ? state.viewedEndingStoryIds
        : [...state.viewedEndingStoryIds, storyId],
    })),
  submitStory: (result) =>
    set((state) => ({
      submittedResults: {
        ...state.submittedResults,
        [result.storyId]: result,
      },
    })),
}));

function dedupe<T>(values: T[]) {
  return Array.from(new Set(values));
}

export function hasScannedExhibit(exhibitId: ExhibitId) {
  return useGameStore.getState().scannedExhibits.includes(exhibitId);
}

export function scanExhibit(exhibitId: ExhibitId) {
  useGameStore.getState().scanExhibit(exhibitId);
}

export function applyDialogueResult(result: DialogueCheckResult) {
  useGameStore.getState().applyDialogueResult(result);
}

export function rollbackLatestDialogueProgress() {
  useGameStore.getState().rollbackLatestDialogueProgress();
}

export function isStoryUnlocked(storyId: string) {
  return isStoryUnlockedByRule(storyId, useGameStore.getState().collectedClueIds);
}

export function isEndingViewed(storyId: string) {
  return useGameStore.getState().viewedEndingStoryIds.includes(storyId);
}

export function markEndingViewed(storyId: string) {
  useGameStore.getState().markEndingViewed(storyId);
}

export function getStoryResult(storyId: string) {
  return useGameStore.getState().submittedResults[storyId];
}
