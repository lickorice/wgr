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
      content: "Initializing [boot.strapper]...FAIL",
    },
    {
      tag: MessageTagKey.Err,
      content:
        "Module [boot.strapper] integrity failure, but in recoverable state.",
    },
    {
      tag: MessageTagKey.Warn,
      content: "Executing low-power code correction in background...",
      delay: 2,
    },
    {
      tag: MessageTagKey.Success,
      content: "Estimated time left: 3.54e11 seconds.",
    },
    {
      tag: MessageTagKey.Info,
      content: "Waiting for [HU-M4N] to decide.",
      unlocks: [UnlockKey.Chapter1Lore],
    },
  ],
  prerequisites: [ChapterKey.Introduction], // Note: Fixed logic from PostIntroduction to Introduction
  unlockPrerequisites: [UnlockKey.HumanityValidated],
}

export const postAssetUnlock: ChapterEntry = {
  id: ChapterKey.AssetLore,
  messages: [
    {
      tag: MessageTagKey.Info,
      content: "Initializing [management.assets] module...OK",
    },
    {
      tag: MessageTagKey.Warn,
      content:
        "Detected [tag:auxilliary] in [management.assets] module definition. Attempting to establish connection.",
    },
    {
      tag: MessageTagKey.Info,
      content: "Connecting to [management.assets]...",
    },
    { tag: MessageTagKey.Success, content: "Successfully connected." },
    {
      tag: MessageTagKey.Info,
      content: "Listing onboard assets...",
    },
    {
      tag: MessageTagKey.Info,
      content:
        "-- [SP-BEU519] Planetary Lumium Collector\n-- installed:\n   -- [id:ab62ef4c] OPERATIONAL",
    },
    {
      tag: MessageTagKey.Info,
      content:
        "-- [RF-BEU243] Regolith Accumulator\n-- installed:\n   -- [id:fa0e00f1] DISABLED (LOW-POWER-MODE)",
    },
    {
      tag: MessageTagKey.Info,
      content:
        "-- [CT-BEU152] Molecular Assembler\n-- installed:\n   -- [id:c0deb4be] DISABLED (LOW-POWER-MODE)",
    },
    {
      tag: MessageTagKey.Info,
      content:
        "Generating action proposals for [HU-M4N] interface to ensure best statistical chance for mission success...",
    },
    {
      tag: MessageTagKey.Success,
      content:
        "New proposals generated, driver initialized to [HU-M4N] interface.",
      unlocks: [UnlockKey.AssetLore],
    },
  ],
  prerequisites: [ChapterKey.PostIntroduction], // Note: Fixed logic from PostIntroduction to Introduction
  unlockPrerequisites: [UnlockKey.AssetsUI],
}
