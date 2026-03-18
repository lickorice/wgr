import { type UnlockId } from "@game/types/unlocks"
import {
  ChapterKey,
  type ChapterId,
  type ChapterEntry,
  type Message,
  MessageTagKey,
} from "@game/types/lore"
import { ALL_CHAPTERS } from "@game/lore/data/chapters"
import { type GameSettingStateLookup } from "@game/types/settings"
import type { GameEngineHelper } from "@game/types/shared"

export class LoreEngine {
  chapters: Record<ChapterId, ChapterEntry>
  alreadyRead: ChapterId[]
  currentlyReading: ChapterId | null
  private container: HTMLElement
  private charSpeed: number = 10 // ms per character
  private defaultMessageDelay: number = 500 // 0.5s between messages

  private unlock: (toUnlock: UnlockId) => void
  private getGameSettings: () => GameSettingStateLookup
  private queue: (ChapterId | Message[])[] = []
  private isProcessing: boolean = false
  private statusElement: HTMLElement | null = null
  private statusListenersAttached: boolean = false
  private repositionStatusBound: () => void

  constructor(containerId: string, helpers: GameEngineHelper) {
    this.chapters = ALL_CHAPTERS
    this.alreadyRead = []
    this.container = document.getElementById(containerId) || document.body
    this.unlock = helpers.unlock
    this.getGameSettings = helpers.getGameSettings
    this.repositionStatusBound = this.repositionStatus.bind(this)
    this.currentlyReading = null

    // Ensure container can position status element
    if (
      this.container &&
      getComputedStyle(this.container).position === "static"
    ) {
      this.container.style.position = "relative"
    }
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
      message.unlocks.map((u) => this.unlock(u))
    }

    await this.sleep(postDelay)
  }

  // Create or return the single status element used to show playing state
  private getStatusElement(): HTMLElement {
    if (this.statusElement) return this.statusElement

    const el = document.createElement("div")
    el.className = "chapter-status d-flex align-items-center gap-2"
    // initial hidden state
    el.style.display = "none"

    // We'll append the status element to the container's parent so it can
    // be absolutely positioned on top of the terminal without being part
    // of the terminal's scrollable content (so it won't scroll away).
    const overlayContainer = this.container.parentElement || document.body

    // Ensure overlay container can be the positioning root
    if (
      overlayContainer &&
      getComputedStyle(overlayContainer).position === "static"
    ) {
      overlayContainer.style.position = "relative"
    }

    // Set explicit positioning; computed coordinates are applied in repositionStatus
    el.style.position = "absolute"
    el.style.zIndex = "2000"
    el.style.display = "none"

    overlayContainer.appendChild(el)
    this.statusElement = el

    // Attach repositioning listeners once
    if (!this.statusListenersAttached) {
      // Reposition when window resizes or scrolls so the overlay stays over terminal
      window.addEventListener("resize", this.repositionStatusBound)
      window.addEventListener("scroll", this.repositionStatusBound, true)
      // Also reposition on container mutations (size changes) using a ResizeObserver
      try {
        const ro = new ResizeObserver(this.repositionStatusBound)
        ro.observe(this.container);
        // store the observer reference on the element so it won't be GC'd
        (
          this.statusElement as HTMLElement & {
            _resizeObserver?: ResizeObserver;
          }
        )._resizeObserver = ro
      } catch {
        // ResizeObserver not available: fallback to periodic reposition on an interval
        setInterval(this.repositionStatusBound, 500)
      }

      this.statusListenersAttached = true
    }

    // initial placement
    this.repositionStatus()
    return el
  }

  // Compute and set the status element position so it visually sits on top-right of the terminal
  private repositionStatus() {
    if (!this.statusElement) return
    const overlayContainer = this.container.parentElement || document.body

    // Ensure overlay container is positioned (we set it earlier but double-check)
    if (
      overlayContainer &&
      getComputedStyle(overlayContainer).position === "static"
    ) {
      overlayContainer.style.position = "relative"
    }

    // Use offsetTop/Left which are relative to the offsetParent (the overlay container)
    const top = this.container.offsetTop + 12
    // Compute distance from the right edge of the overlay container to the terminal's right edge
    const right = Math.max(
      12,
      overlayContainer.clientWidth -
        (this.container.offsetLeft + this.container.clientWidth) +
        12,
    )

    this.statusElement.style.top = `${top}px`
    this.statusElement.style.right = `${right}px`
  }

  public showCustomStatus(statusStr: string) {
    const el = this.getStatusElement()
    el.innerHTML = `
      <div class="spinner-border spinner-border-sm text-info" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <div class="status-text text-info">${statusStr}</div>
    `
    el.style.display = "flex"
  }

  public showPlayingStatus() {
    const el = this.getStatusElement()
    el.innerHTML = `
      <div class="spinner-border spinner-border-sm text-info" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <div class="status-text text-info">PROCESSING</div>
    `
    el.style.display = "flex"
  }

  public showDoneStatus() {
    const el = this.getStatusElement()
    el.innerHTML = `
      <div class="text-success status-done">\u2713</div>
      <div class="status-text text-success">DONE</div>
    `
    el.style.display = "flex"
  }

  private hideStatus() {
    const el = this.getStatusElement()
    // keep it visible briefly? For now hide immediately when no queue
    el.style.display = "none"
  }

  // Enqueue a chapterId, or a sequence of messages to be played. Worker will process sequentially.
  public play(entry: ChapterId | Message[]) {
    // simple guard: ignore unknown chapters
    if (!Array.isArray(entry)) {
      if (!this.chapters[entry]) return
    }

    this.queue.push(entry)
    // start worker if not already
    if (!this.isProcessing) {
      this.processQueue()
    }
  }

  private async printMessageSequence(messages: Message[]) {
    this.showPlayingStatus()
    for (const msg of messages) {
      if (
        !this.getGameSettings().PlayMetaMessages.value &&
        msg.tag === MessageTagKey.Meta
      )
        continue
      await this.typeMessage(msg)
    }
    this.showDoneStatus()
  }

  private async printChapter(chapterEntry: ChapterEntry) {
    await this.printMessageSequence(chapterEntry.messages)
  }

  // Worker that processes queued chapters sequentially
  private async processQueue() {
    if (this.isProcessing) return
    this.isProcessing = true

    if (this.currentlyReading) {
      if (this.currentlyReading >= 1000) {
        // Programmed messages, nothing to worry about:
        this.currentlyReading = null
      } else {
        const chapter = this.chapters[this.currentlyReading]
        // If encountered, then typically a save in the middle of playing a chapter was loaded.
        const metaWarnChapter = this.chapters[ChapterKey.InterruptedLore]
        await this.printChapter(metaWarnChapter)
        await this.printChapter(chapter)
        this.currentlyReading = null // This has to be set afterwards. Otherwise the autosave will coerce itself into an infinite this.currentlyReading loop.
      }
    }

    while (this.queue.length > 0) {
      const nextEntry = this.queue.shift()
      if (nextEntry === undefined) continue
      if (Array.isArray(nextEntry)) {
        await this.printMessageSequence(nextEntry)
      } else {
        await this.printHardcodedChapter(nextEntry)
      }
    }

    this.isProcessing = false
  }

  private async printHardcodedChapter(id: ChapterId) {
    const chapter = this.chapters[id]
    if (!chapter) return

    // skip if already read and not repeatable
    if (this.alreadyRead.includes(id) && !chapter.repeatable) return

    // if not read, mark as read now (so prerequisites for later chapters can rely on this)
    if (!this.alreadyRead.includes(id)) this.alreadyRead.push(id)

    // check prerequisites; if not met, skip
    if (!this.passesPrerequisites(chapter.prerequisites ?? [])) return

    // show status UI
    this.currentlyReading = id
    this.showPlayingStatus()

    await this.printChapter(chapter)

    // Mark unlocks handled inside typeMessage already

    // show done state
    this.currentlyReading = null
    this.showDoneStatus()

    // keep the DONE state visible for a short moment, then hide if no more queued
    await this.sleep(800)
    if (this.queue.length === 0) {
      this.hideStatus()
    } else {
      // if more queued, continue loop which will showPlayingStatus at top
    }
  }
}
