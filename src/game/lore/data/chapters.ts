import {
  ChapterKey,
  type ChapterId,
  type ChapterEntry,
} from "@game/types/lore"
import {
  introduction,
  postIntroduction,
  postAssetUnlock,
} from "./entries/001_introduction"
import {
  autosaveLoad,
  autosaveSave,
  manualSave,
} from "./entries/999_programmed"
import { loreWhoAmI } from "./entries/800_loredump"

export const ALL_CHAPTERS: Record<ChapterId, ChapterEntry> = {
  [ChapterKey.Introduction]: introduction,
  [ChapterKey.PostIntroduction]: postIntroduction,
  [ChapterKey.AssetLore]: postAssetUnlock,

  // World-building, lore entries
  [ChapterKey.LoreWhoAmI]: loreWhoAmI,

  // Non-triggerable stasis (autosave) messages
  [ChapterKey.AutosaveLoad]: autosaveLoad,
  [ChapterKey.AutosaveSave]: autosaveSave,
  [ChapterKey.ManualSave]: manualSave,
}
