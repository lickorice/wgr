import { ChapterKey, type ChapterEntry, MessageTagKey } from "@game/types/lore"

export const autosaveLoad: ChapterEntry = {
  id: ChapterKey.AutosaveLoad,
  disableTrigger: true,
  repeatable: true,
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
  repeatable: true,
  messages: [
    { tag: MessageTagKey.Meta, content: "Game autosaved." },
    {
      tag: MessageTagKey.Info,
      content: "Performed routine system safety replication.",
    },
  ],
}

export const manualSave: ChapterEntry = {
  id: ChapterKey.AutosaveSave,
  disableTrigger: true,
  repeatable: true,
  messages: [
    { tag: MessageTagKey.Meta, content: "Game saved." },
    {
      tag: MessageTagKey.Info,
      content: "Invoked manual system safety replication.",
    },
  ],
}

export const interruptedLore: ChapterEntry = {
  id: ChapterKey.InterruptedLore,
  disableTrigger: true,
  repeatable: true,
  messages: [
    {
      tag: MessageTagKey.Meta,
      content:
        "You loaded a save that was currently in the middle of talking nonsense in the terminal.",
    },
    {
      tag: MessageTagKey.Meta,
      content:
        "Unfortunately, said nonsense is tightly coupled to game unlocks. Re-playing its sequence now.",
    },
  ],
}
