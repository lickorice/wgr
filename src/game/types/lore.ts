import { type UnlockId } from "./unlocks"

export const ChapterKey = {
  Introduction: 0,
  PostIntroduction: 1,
  AssetLore: 2,

  LoreWhoAmI: 800,

  AutosaveLoad: 1000,
  AutosaveSave: 1001,
  ManualSave: 1002,
} as const

export type ChapterId = (typeof ChapterKey)[keyof typeof ChapterKey];

export const MessageTagKey = {
  Info: "INFO",
  Warn: "WARN",
  Err: "_ERR",
  Success: "GOOD",
  Meta: "META",
} as const

export type MessageTag = (typeof MessageTagKey)[keyof typeof MessageTagKey];

export type ChapterEntry = {
  id: ChapterId;
  messages: Message[];
  prerequisites?: ChapterId[];
  unlockPrerequisites?: UnlockId[];
  disableTrigger?: boolean;
  repeatable?: boolean;
};

export type Message = {
  content: string;
  tag: MessageTag;
  delay?: number;
  unlocks?: UnlockId[];
};
