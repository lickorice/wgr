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
    {
      tag: MessageTagKey.Success,
      content: "Successfully connected.",
      unlocks: [UnlockKey.AssetsUIUnlock],
    },
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
        "Blueprints for 3 out of 3 Best-Effort Unit (BEU) devices have been loaded to memory.",
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

export const researchUnlock: ChapterEntry = {
  id: ChapterKey.BootstrapperLore,
  messages: [
    {
      tag: MessageTagKey.Info,
      content: "Confirming integrity of [boot.strapper] module...",
    },
    {
      tag: MessageTagKey.Success,
      content: "Module validated.",
    },
    {
      tag: MessageTagKey.Info,
      content: "Initializing [management.assets] module...OK",
    },
    {
      tag: MessageTagKey.Success,
      content:
        "     ________\n    /\\ \\  / /\\\n   /\\ \\ \\/ / /\\\n  /__\\_\\/ / /__\\ \n /______\\/_/____\\\n \\______/\\ \\____/ \n  \\  / /\\ \\ \\  / [boot.strapper]\n   \\/ / /\\ \\ \\/  Scalable Knowledge Acquisition\n    \\/_/__\\_\\/   v592.16466.33102",
    },
    {
      tag: MessageTagKey.Info,
      content: "-- synthesized by: Mithrandyr StellarCorp",
    },
    {
      tag: MessageTagKey.Info,
      content: "-- synthesis date: 6.14e13 seconds ago",
    },
    {
      tag: MessageTagKey.Info,
      content: "-- ware version:   v592.16466.33102",
    },
    {
      tag: MessageTagKey.Info,
      content:
        "-- provided description:  The [boot.strapper] Scalable Knowledge Acquisition module is an infinitely scalable K.0 Non-Sentient inference engine.",
    },
    {
      tag: MessageTagKey.Warn,
      content:
        "-- machine note:          While base inference speed is 4.3σ lower than the average, this module has proven highly impactful in high-risk, damage-prone scenarios. With its high scalability metrics, eons of module synthesis worked towards compressing it to the lowest size possible to make the cost of equipping the module negligible.",
    },
    {
      tag: MessageTagKey.Meta,
      content:
        "This is the equivalent of having a smartphone with an internet connection while stranded alone in a deserted island.",
    },
    {
      tag: MessageTagKey.Meta,
      content:
        "However, it's basically an AI that gets faster when you give it more power (i.e. scalability); and learns how to 'create' new knowledge. Like humans.",
    },
    {
      tag: MessageTagKey.Meta,
      content: "I wonder if this won't be fiction soon IRL? Who knows.",
    },
    {
      tag: MessageTagKey.Warn,
      content:
        "Use of [boot.strapper] and future modules will consume resources, in this case, EU, over time. If said resources are not sufficient, the procedures will fail and resources spent up to that point will be wasted. Disclaimer is automatically hidden in the future.",
    },
    {
      tag: MessageTagKey.Meta,
      content: "If that wasn't clear, you have been warned.",
    },
  ],
  prerequisites: [ChapterKey.PostIntroduction],
  unlockPrerequisites: [UnlockKey.BootstrapperUI],
}
