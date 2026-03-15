import { type UnlockId } from "./unlocks"

export const ChapterKey = {
  Introduction: 0,
  PostIntroduction: 1,
} as const

export type ChapterId = (typeof ChapterKey)[keyof typeof ChapterKey];

export const MessageTagKey = {
  Info: "INFO",
  Warn: "WARN",
  Err: "_ERR",
  Success: "GOOD",
} as const

export type MessageTag = (typeof MessageTagKey)[keyof typeof MessageTagKey];

export type ChapterEntry = {
  id: ChapterId;
  messages: Message[];
  prerequisites?: ChapterId[];
  unlockPrerequisites?: UnlockId[];
};

export type Message = {
  content: string;
  tag: MessageTag;
  delay?: number;
  unlocks?: UnlockId[];
};
