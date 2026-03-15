import { UnlockKey, type UnlockId } from "@game/types/unlocks"

const ChapterKey = {
  Introduction: 0,
  PostIntroduction: 1,
} as const

type ChapterId = (typeof ChapterKey)[keyof typeof ChapterKey];

const MessageTagKey = {
  Info: "INFO",
  Warn: "WARN",
  Err: "_ERR",
  Success: "GOOD",
} as const

type MessageTag = (typeof MessageTagKey)[keyof typeof MessageTagKey];

export type ChapterEntry = {
  id: ChapterId;
  messages: Message[];
  prerequisites?: ChapterId[];
};

export type Message = {
  content: string;
  tag: MessageTag;
  delay?: number;
  unlocks?: UnlockId[];
};

const ALL_CHAPTERS: Record<ChapterId, ChapterEntry> = {
  [ChapterKey.Introduction]: {
    id: ChapterKey.Introduction,
    messages: [
      {
        tag: MessageTagKey.Info,
        content: "Fallback orchestrator: [HU-MAN] loading...OK",
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
      {
        tag: MessageTagKey.Warn,
        content: "Verifying orchestrator integrity...",
      },
      {
        tag: MessageTagKey.Err,
        content: "Orchestrator integrity below allowed fault tolerance (<25%)",
      },
      {
        tag: MessageTagKey.Warn,
        content: "Energy supply for full diagnostic insufficient. (EU 20 < 50)",
      },
      {
        tag: MessageTagKey.Warn,
        content: "Deferring full diagnostic at runtime.",
      },
      {
        tag: MessageTagKey.Warn,
        content: "Deferring orchestrator failure diagnostic at runtime.",
      },
      {
        tag: MessageTagKey.Info,
        content: "Attempting to load [HU-MAN] fallback orchestrator...OK",
      },
      {
        tag: MessageTagKey.Info,
        content: "Validating temporal link...OK",
      },
      {
        tag: MessageTagKey.Info,
        content: "Preloading context stack...OK",
      },
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
  },
  [ChapterKey.PostIntroduction]: {
    id: ChapterKey.PostIntroduction,
    messages: [
      {
        tag: MessageTagKey.Success,
        content: "Humanity validated.",
      },
    ],
  },
}

export class LoreEngine {
  chapters: Record<ChapterId, ChapterEntry>
  alreadyRead: ChapterId[]
  private container: HTMLElement
  private charSpeed: number = 10 // ms per character
  private defaultMessageDelay: number = 500 // 0.5s between messages

  private unlocker: (toUnlock: UnlockId) => void

  constructor(containerId: string, unlocker: (toUnlock: UnlockId) => void) {
    this.chapters = ALL_CHAPTERS
    this.alreadyRead = []
    this.container = document.getElementById(containerId) || document.body
    this.unlocker = unlocker
  }

  private getTimestamp(): string {
    const ms = performance.now()
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const millis = Math.floor(ms % 1000)
    return `[${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${millis.toString().padStart(3, "0")}]`
  }

  private async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private async typeMessage(message: Message): Promise<void> {
    const msgElement = document.createElement("div")
    msgElement.className = `terminal-line tag-${message.tag.toLowerCase()}`

    // Create the prefix (Timestamp + Tag)
    const prefix = document.createElement("span")
    prefix.className = "terminal-prefix"
    prefix.innerText = `${this.getTimestamp()} ${message.tag}: `
    msgElement.appendChild(prefix)

    // Create the content span
    const contentSpan = document.createElement("span")
    msgElement.appendChild(contentSpan)
    this.container.appendChild(msgElement)

    // Animate characters
    for (let i = 0; i < message.content.length; i++) {
      contentSpan.textContent += message.content[i]
      // Auto-scroll to bottom
      this.container.scrollTop = this.container.scrollHeight
      await this.sleep(this.charSpeed)
    }

    // Apply specific message delay or default 0.5s
    const postDelay = message.delay
      ? message.delay * 1000
      : this.defaultMessageDelay

    // If message can unlock stuff, do so:
    if (message.unlocks) {
      message.unlocks.map((u) => this.unlocker(u))
    }

    await this.sleep(postDelay)
  }

  public async playChapter(id: ChapterId) {
    if (this.alreadyRead.includes(id)) return

    const chapter = this.chapters[id]
    for (const msg of chapter.messages) {
      await this.typeMessage(msg)
    }

    this.alreadyRead.push(id)
  }
}
