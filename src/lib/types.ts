export type RoleId = "P1" | "P2" | "P3" | "P4";
export type NpcId = "N1" | "N2" | "N3";
export type ExhibitId = `E${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`;

export interface RoleMeta {
  id: RoleId;
  title: string;
  titleEn: string;
  blurb: string;
}

export interface NpcMeta {
  id: NpcId;
  name: string;
  nameEn: string;
}

export interface StoryResult {
  storyId: string;
  orderedCardIds: string[];
  blankAnswers: string[];
  perfectOrder: boolean;
  perfectBlanks: boolean;
  submittedAt: string;
}
