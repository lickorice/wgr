import { type UnlockId } from "@game/types/unlocks"
import {
  type ChapterId,
  type ChapterEntry,
  type Message,
} from "@game/types/lore"
import { ALL_CHAPTERS } from "@game/lore/data/chapters"

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

  private passesPrerequisites(prerequisites: ChapterId[]): boolean {
    return !prerequisites.some((p) => !this.alreadyRead.includes(p))
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
    const chapter = this.chapters[id]

    if (this.alreadyRead.includes(id)) {
      if (!chapter.repeatable) return
    } else {
      this.alreadyRead.push(id)
    }

    if (!this.passesPrerequisites(chapter.prerequisites ?? [])) return

    for (const msg of chapter.messages) {
      await this.typeMessage(msg)
    }
  }
}
