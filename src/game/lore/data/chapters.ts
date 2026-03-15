import {
  ChapterKey,
  type ChapterId,
  type ChapterEntry,
} from "@game/types/lore"
import { introduction, postIntroduction } from "./entries/001_introduction"
import {
  autosaveLoad,
  autosaveSave,
  manualSave,
} from "./entries/999_programmed"

export const ALL_CHAPTERS: Record<ChapterId, ChapterEntry> = {
  [ChapterKey.Introduction]: introduction,
  [ChapterKey.PostIntroduction]: postIntroduction,

  // Non-triggerable stasis (autosave) messages
  [ChapterKey.AutosaveLoad]: autosaveLoad,
  [ChapterKey.AutosaveSave]: autosaveSave,
  [ChapterKey.ManualSave]: manualSave,
}
