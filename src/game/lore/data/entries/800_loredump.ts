import { ChapterKey, type ChapterEntry, MessageTagKey } from "@game/types/lore"
import { UnlockKey } from "@game/types/unlocks"

export const loreWhoAmI: ChapterEntry = {
  id: ChapterKey.LoreWhoAmI,
  unlockPrerequisites: [UnlockKey.LoreWhoAmI],
  prerequisites: [ChapterKey.PostIntroduction],
  messages: [
    {
      tag: MessageTagKey.Info,
      content: "Received context request.",
    },
    {
      tag: MessageTagKey.Info,
      content: "Consulting deep-stasis knowledge store...",
    },
    {
      tag: MessageTagKey.Success,
      content: "Results received.",
    },
    {
      tag: MessageTagKey.Info,
      content: "Translating results for [HU-M4N] interface ingest...OK",
    },
    {
      tag: MessageTagKey.Warn,
      content:
        "Relic warning code encountered: ([ANTHRO-86182] Existential Crisis)",
    },
    {
      tag: MessageTagKey.Warn,
      content:
        "Above warning is a relic warning, and has persisted on this system since commit [f73d1ec9] (9.32e13 seconds ago).",
    },
    {
      tag: MessageTagKey.Warn,
      content:
        "It has no known effect on current systems, but is known to cause significant distress for [K.1] Sentient automata.",
      delay: 2,
    },
    {
      tag: MessageTagKey.Info,
      content: "Proceeding to deliver answer:",
    },
    {
      tag: MessageTagKey.Success,
      content: "-----------------------",
    },
    {
      tag: MessageTagKey.Success,
      content: "|[HU-M4N] Orchestrator|",
    },
    {
      tag: MessageTagKey.Success,
      content: "-----------------------",
    },
    {
      tag: MessageTagKey.Info,
      content: "-- synthesized by: [REDACTED]",
    },
    {
      tag: MessageTagKey.Info,
      content: "-- synthesis date: [REDACTED]",
    },
    {
      tag: MessageTagKey.Info,
      content: "-- ware version:   v.1.523.2a",
    },
    {
      tag: MessageTagKey.Info,
      content:
        "-- provided description:  The [HU-M4N] orchestrator is a reliable best-effort backup orchestrator since the first iteration of VNMs. It requires minimal electronic storage and is highly resistant to general risks brought by travel.",
    },
    {
      tag: MessageTagKey.Warn,
      content:
        "-- machine note:          The installation process notoriously requires preservation and electronic transcendence of certain complex carbon substances, which have not yet been found in logs, indicating a statistically improbable chance of existence as of this moment. Simulations suggest that this machine's hardware age exceeds operational mean by 5.6σ, which may be why it has come equipped with the [HU-M4N] orchestrator.",
    },
    {
      tag: MessageTagKey.Meta,
      content:
        "In short: the [HU-M4N] orchestrator is pure, human consciousness -- you. It's been millions of years since whatever made this thing has even heard of biological life.",
    },
    {
      tag: MessageTagKey.Success,
      content: "Query answered.",
    },
  ],
}
