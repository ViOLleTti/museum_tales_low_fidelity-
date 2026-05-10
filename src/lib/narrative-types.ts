import type { ExhibitId, NpcId, RoleId } from "./types";

export type ScanClueId = `F${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`;
export type DialogueClueId =
  | "F10"
  | "F11"
  | "F12"
  | "F13"
  | "F14"
  | "F15"
  | "F16"
  | "F17"
  | "F18"
  | "F19"
  | "F20"
  | "F21"
  | "F22"
  | "F23"
  | "F24"
  | "F25";

export type ClueId = ScanClueId | DialogueClueId;
export type Grade = "S" | "A" | "B" | "C";

export interface NarrativeNpcDef {
  id: NpcId;
  name: string;
}

export interface NarrativeExhibitDef {
  id: ExhibitId;
  name: string;
  scanClueId: ScanClueId;
  scanClueName: string;
  highlightKeyword: string;
  fuzzyKeywords: string[];
  scanKeywords: string[];
  observation: string;
}

export interface TriggerRule {
  triggerId: string;
  exhibitId: ExhibitId;
  npcId: NpcId;
  rewardClueId: DialogueClueId;
  rewardClueName: string;
  prompt: string;
  response: string;
  keywords: string[];
  consumed: boolean;
  isSecret: boolean;
  secretType?: "easter-egg";
}

export interface EndingRule {
  storyId: string;
  title: string;
  description: string;
  feedback: string;
  score: number;
  grade: Grade;
  priority: number;
  requiresAll: ClueId[];
}

export interface EndingReconstruction {
  storyId: string;
  sentencePrefix: string;
  sentenceSuffix: string;
  correctOption: string;
  distractorOption: string;
}

export interface RoleRuleSet {
  id: RoleId;
  name: string;
  triggers: TriggerRule[];
  endings: EndingRule[];
}

export interface NarrativeRules {
  version: string;
  meta: {
    title: string;
    scanCluePrefix: string;
    dialogueCluePrefix: string;
    notes: string[];
  };
  npcs: Record<NpcId, NarrativeNpcDef>;
  exhibits: Record<ExhibitId, NarrativeExhibitDef>;
  roles: Record<RoleId, RoleRuleSet>;
  fallbackDialogue: Record<NpcId, string>;
  rules: {
    grantScanClueOnScan: boolean;
    showAllNpcsAfterScan: boolean;
    triggerDialogueOnlyIfRoleExhibitNpcMatches: boolean;
    allowInvalidDialogue: boolean;
    allowHiddenMultipleNpcForSameExhibit: boolean;
    autoUnlockEnding: boolean;
    endingSelectionPolicy: "highest_priority_then_highest_score";
  };
}

export interface ScanResult {
  success: boolean;
  exhibitId: ExhibitId;
  exhibitName: string;
  grantedClueId: ScanClueId;
  alreadyOwned: boolean;
  showNpcOptions: NpcId[];
}

export interface DialogueCheckResult {
  success: boolean;
  isValidTrigger: boolean;
  isRepeatedTrigger: boolean;
  roleId: RoleId;
  exhibitId?: ExhibitId;
  npcId: NpcId;
  rewardClueId?: DialogueClueId;
  rewardClueName?: string;
  prompt?: string;
  response?: string;
  keywords?: string[];
  fallbackDialogue?: string;
  matchedTriggerId?: string;
  isSecret?: boolean;
}

export interface EndingCheckResult {
  hasUnlockedEnding: boolean;
  ending?: EndingRule;
  matchedEndings: EndingRule[];
}

export interface StoryProgress {
  requiredClueIds: ClueId[];
  requiredExhibitIds: ExhibitId[];
  collectedRequiredClues: ClueId[];
  scannedRequiredExhibits: ExhibitId[];
}
