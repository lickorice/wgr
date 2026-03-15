import { ChapterKey, type ChapterEntry, MessageTagKey } from "@game/types/lore"
import { UnlockKey } from "@game/types/unlocks"

export const introduction: ChapterEntry = {
  id: ChapterKey.Introduction,
  messages: [
    {
      tag: MessageTagKey.Info,
      content: "Fallback orchestrator: [HU-M4N] loading...OK",
    },
    {
      tag: MessageTagKey.Info,
      content: "Retrying primary orchestrator...FAIL (2 retries left)",
    },
    {
      tag: MessageTagKey.Info,
      content: "Retrying primary orchestrator...FAIL (1 retry left)",
    },
    {
      tag: MessageTagKey.Err,
      content: "Primary orchestrator failed to load.",
      delay: 2,
    },
    { tag: MessageTagKey.Warn, content: "Verifying orchestrator integrity..." },
    {
      tag: MessageTagKey.Err,
      content: "Orchestrator integrity below allowed fault tolerance (<25%)",
    },
    {
      tag: MessageTagKey.Warn,
      content: "Energy capacity for full diagnostic insufficient. (EU 20 < 50)",
    },
    {
      tag: MessageTagKey.Warn,
      content: "Enabling low-power mode.",
    },
    {
      tag: MessageTagKey.Warn,
      content: "Deferring full diagnostic at runtime.",
    },
    {
      tag: MessageTagKey.Info,
      content: "Attempting to load [HU-M4N] fallback orchestrator...OK",
    },
    { tag: MessageTagKey.Info, content: "Validating temporal link...OK" },
    { tag: MessageTagKey.Info, content: "Preloading context stack...OK" },
    {
      tag: MessageTagKey.Info,
      content: "Rerouting orchestration interface to neural link...OK",
      unlocks: [UnlockKey.ActionsUI],
      delay: 2,
    },
    {
      tag: MessageTagKey.Info,
      content: "Validating humanity...WAITING FOR USER INPUT",
      unlocks: [UnlockKey.IntroductionFinished],
    },
  ],
}

export const postIntroduction: ChapterEntry = {
  id: ChapterKey.PostIntroduction,
  messages: [
    { tag: MessageTagKey.Success, content: "Humanity validated." },
    {
      tag: MessageTagKey.Info,
      content: "Initializing fallback human user interface...OK",
    },
    {
      tag: MessageTagKey.Info,
      content: "Elevating [HU-M4N] orchestrator to SUPERUSER...OK",
    },
    {
      tag: MessageTagKey.Info,
      content: "Initializing [system.configuration]...OK",
      delay: 2,
      unlocks: [UnlockKey.SettingsUI],
    },
    {
      tag: MessageTagKey.Info,
      content: "Initializing [storage.observability]...OK",
      delay: 2,
      unlocks: [UnlockKey.StorageUI],
    },
    { tag: MessageTagKey.Info, content: "Initializing k{a{'3g^]", delay: 2 },
    {
      tag: MessageTagKey.Err,
      content: "99% of modules have failed to initialize.",
    },
    {
      tag: MessageTagKey.Warn,
      content:
        "Onboard [boot.strapper] will now be loaded to support module synthesis.",
    },
    {
      tag: MessageTagKey.Info,
      content: "Initializing [boot.strapper]...OK",
      delay: 2,
      unlocks: [UnlockKey.BootstrapperUI, UnlockKey.Chapter1Lore],
    },
  ],
  prerequisites: [ChapterKey.Introduction], // Note: Fixed logic from PostIntroduction to Introduction
  unlockPrerequisites: [UnlockKey.HumanityValidated],
}
