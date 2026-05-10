import type { NpcMeta, RoleMeta } from "./types";

export const ROLES: RoleMeta[] = [
  {
    id: "P1",
    title: "校史档案员",
    titleEn: "History Archivist",
    blurb: "关注捐赠脉络、馆藏与纪实叙事。",
  },
  {
    id: "P2",
    title: "汉教助理",
    titleEn: "Chinese Language Education Assistant",
    blurb: "关注跨文化、谐音与手写温度。",
  },
  {
    id: "P3",
    title: "校报记者",
    titleEn: "School Newspaper Reporter",
    blurb: "关注人物采访与口述史。",
  },
  {
    id: "P4",
    title: "博物馆志愿者",
    titleEn: "Museum Volunteer",
    blurb: "关注公众教育与展陈互动。",
  },
];

export const NPCS: NpcMeta[] = [
  { id: "N1", name: "历史档案员", nameEn: "History Archivist" },
  { id: "N2", name: "英国交换生", nameEn: "British Exchange Student" },
  { id: "N3", name: "保安", nameEn: "Security Guard" },
];
