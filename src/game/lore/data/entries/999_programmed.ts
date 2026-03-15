import { ChapterKey, type ChapterEntry, MessageTagKey } from "@game/types/lore"

export const autosaveLoad: ChapterEntry = {
  id: ChapterKey.AutosaveLoad,
  disableTrigger: true,
  messages: [
    { tag: MessageTagKey.Meta, content: "Autosave loaded." },
    {
      tag: MessageTagKey.Info,
      content: "Focused on [HU-M4N] orchestrator module.",
    },
  ],
}

export const autosaveSave: ChapterEntry = {
  id: ChapterKey.AutosaveSave,
  disableTrigger: true,
  messages: [
    { tag: MessageTagKey.Meta, content: "Game autosaved." },
    {
      tag: MessageTagKey.Info,
      content: "Performed routine system safety replication.",
    },
  ],
}
