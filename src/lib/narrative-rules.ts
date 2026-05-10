import rulesJson from "./narrative-rules.json";
import type {
  ClueId,
  DialogueCheckResult,
  DialogueClueId,
  EndingReconstruction,
  EndingCheckResult,
  EndingRule,
  NarrativeExhibitDef,
  NarrativeRules,
  RoleRuleSet,
  ScanResult,
  StoryProgress,
  TriggerRule,
} from "./narrative-types";
import { CLUE_KEYWORDS, STORY_RECONSTRUCTIONS } from "./narrative-reconstruction";
import type { ExhibitId, NpcId, RoleId } from "./types";

export const NARRATIVE_RULES = rulesJson as NarrativeRules;

export function getRoleRuleSet(roleId: RoleId): RoleRuleSet {
  return NARRATIVE_RULES.roles[roleId];
}

export function getRoleStories(roleId: RoleId): EndingRule[] {
  return [...getRoleRuleSet(roleId).endings].sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.title.localeCompare(b.title, "zh-CN");
  });
}

export function getStoryRule(storyId: string): (EndingRule & { roleId: RoleId }) | undefined {
  const roleIds = Object.keys(NARRATIVE_RULES.roles) as RoleId[];

  for (const roleId of roleIds) {
    const ending = NARRATIVE_RULES.roles[roleId].endings.find((entry) => entry.storyId === storyId);
    if (ending) {
      return { ...ending, roleId };
    }
  }

  return undefined;
}

export function getStoryReconstruction(storyId: string): EndingReconstruction | undefined {
  return STORY_RECONSTRUCTIONS[storyId];
}

export function getClueKeyword(clueId: ClueId): string {
  return CLUE_KEYWORDS[clueId];
}

export function getExhibitRule(exhibitId: ExhibitId): NarrativeExhibitDef {
  return NARRATIVE_RULES.exhibits[exhibitId];
}

export function getAllExhibitRules(): NarrativeExhibitDef[] {
  return Object.values(NARRATIVE_RULES.exhibits) as NarrativeExhibitDef[];
}

export function getNpcFallbackDialogue(npcId: NpcId): string {
  return NARRATIVE_RULES.fallbackDialogue[npcId];
}

export function hasRemainingDialogueTriggers(
  roleId: RoleId,
  scannedExhibits: ExhibitId[],
  consumedTriggerIds: string[],
): boolean {
  return getRoleRuleSet(roleId).triggers.some(
    (trigger) =>
      scannedExhibits.includes(trigger.exhibitId) && !consumedTriggerIds.includes(trigger.triggerId),
  );
}

export function getTriggerRule(
  roleId: RoleId,
  exhibitId: ExhibitId,
  npcId: NpcId,
): TriggerRule | undefined {
  return getRoleRuleSet(roleId).triggers.find(
    (trigger) => trigger.exhibitId === exhibitId && trigger.npcId === npcId,
  );
}

export function getTriggerByRewardClue(
  roleId: RoleId,
  clueId: DialogueClueId,
): TriggerRule | undefined {
  return getRoleRuleSet(roleId).triggers.find((trigger) => trigger.rewardClueId === clueId);
}

export function getRequiredExhibitIdsForStory(storyId: string): ExhibitId[] {
  const story = getStoryRule(storyId);

  if (!story) {
    return [];
  }

  const exhibitIds = story.requiresAll
    .map((clueId) => getExhibitIdForClue(story.roleId, clueId))
    .filter((value): value is ExhibitId => Boolean(value));

  return Array.from(new Set(exhibitIds));
}

export function getRequiredTriggersForStory(storyId: string): TriggerRule[] {
  const story = getStoryRule(storyId);

  if (!story) {
    return [];
  }

  return story.requiresAll
    .map((clueId) =>
      clueId.startsWith("F") && Number(clueId.slice(1)) >= 10
        ? getTriggerByRewardClue(story.roleId, clueId as DialogueClueId)
        : undefined,
    )
    .filter((value): value is TriggerRule => Boolean(value));
}

export function getStoryProgress(
  storyId: string,
  collectedClueIds: ClueId[],
  scannedExhibits: ExhibitId[],
): StoryProgress {
  const story = getStoryRule(storyId);

  if (!story) {
    return {
      requiredClueIds: [],
      requiredExhibitIds: [],
      collectedRequiredClues: [],
      scannedRequiredExhibits: [],
    };
  }

  const requiredExhibitIds = getRequiredExhibitIdsForStory(storyId);

  return {
    requiredClueIds: story.requiresAll,
    requiredExhibitIds,
    collectedRequiredClues: story.requiresAll.filter((clueId) => collectedClueIds.includes(clueId)),
    scannedRequiredExhibits: requiredExhibitIds.filter((exhibitId) => scannedExhibits.includes(exhibitId)),
  };
}

export function isStoryUnlocked(storyId: string, collectedClueIds: ClueId[]): boolean {
  const story = getStoryRule(storyId);
  return story ? story.requiresAll.every((clueId) => collectedClueIds.includes(clueId)) : false;
}

export function scanExhibitResult(
  exhibitId: ExhibitId,
  ownedClueIds: ClueId[],
): ScanResult {
  const exhibit = getExhibitRule(exhibitId);

  return {
    success: true,
    exhibitId,
    exhibitName: exhibit.name,
    grantedClueId: exhibit.scanClueId,
    alreadyOwned: ownedClueIds.includes(exhibit.scanClueId),
    showNpcOptions: ["N1", "N2", "N3"],
  };
}

export function checkNpcDialogueTrigger(args: {
  roleId: RoleId;
  exhibitId: ExhibitId;
  npcId: NpcId;
  scannedExhibits: ExhibitId[];
  consumedTriggerIds: string[];
}): DialogueCheckResult {
  const { roleId, exhibitId, npcId, scannedExhibits, consumedTriggerIds } = args;

  if (!scannedExhibits.includes(exhibitId)) {
    return {
      success: true,
      isValidTrigger: false,
      isRepeatedTrigger: false,
      roleId,
      exhibitId,
      npcId,
      fallbackDialogue: "请先完成该展品的扫描，再来和 NPC 对话。",
    };
  }

  const trigger = getTriggerRule(roleId, exhibitId, npcId);

  if (!trigger) {
    return {
      success: true,
      isValidTrigger: false,
      isRepeatedTrigger: false,
      roleId,
      exhibitId,
      npcId,
      fallbackDialogue: NARRATIVE_RULES.fallbackDialogue[npcId],
    };
  }

  return {
    success: true,
    isValidTrigger: true,
    isRepeatedTrigger: consumedTriggerIds.includes(trigger.triggerId),
    roleId,
    exhibitId,
    npcId,
    rewardClueId: trigger.rewardClueId,
    rewardClueName: trigger.rewardClueName,
    prompt: trigger.prompt,
    response: trigger.response,
    keywords: trigger.keywords,
    matchedTriggerId: trigger.triggerId,
    isSecret: trigger.isSecret,
  };
}

export function checkEndingUnlock(
  roleId: RoleId,
  collectedClueIds: ClueId[],
): EndingCheckResult {
  const endings = getRoleRuleSet(roleId).endings;
  const matchedEndings = endings.filter((ending) =>
    ending.requiresAll.every((clueId) => collectedClueIds.includes(clueId)),
  );

  const sorted = [...matchedEndings].sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (b.requiresAll.length !== a.requiresAll.length) {
      return b.requiresAll.length - a.requiresAll.length;
    }
    return a.storyId.localeCompare(b.storyId);
  });

  return {
    hasUnlockedEnding: sorted.length > 0,
    ending: sorted[0],
    matchedEndings: sorted,
  };
}

export function getExhibitIdForClue(roleId: RoleId, clueId: ClueId): ExhibitId | undefined {
  if (Number(clueId.slice(1)) <= 9) {
    const exhibitEntries = Object.values(NARRATIVE_RULES.exhibits) as NarrativeExhibitDef[];
    return exhibitEntries.find((exhibit) => exhibit.scanClueId === clueId)?.id;
  }

  return getTriggerByRewardClue(roleId, clueId as DialogueClueId)?.exhibitId;
}
