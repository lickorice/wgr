import { LoreEngine } from "@game/lore/lore_engine"
import {
  UnlockKey,
  type UnlockId,
  checkUnlockables,
} from "@game/types/unlocks"
import { createProgress } from "@game/layout/util"
import { attachSettingsUI, ALL_SETTINGS } from "@game/layout/settings"
import { attachActionsUI } from "@game/layout/actions"
import { attachAssetsUI } from "@game/layout/assets"
import {
  ChapterKey,
  type ChapterId,
  MessageTagKey,
  type Message,
} from "@game/types/lore"
import { ContentStatusKey } from "@game/types/shared"
import {
  GeneratorKey,
  type GeneratorId,
  type GeneratorStateLookup,
} from "@game/types/generators"
import {
  ResourceKey,
  type ResourceId,
  type ResourceState,
  type ResourceStateLookup,
  type Cost,
} from "@game/types/resources"
import { type ActionId, type ActionStateLookup } from "@game/types/actions"
import { ALL_ACTIONS } from "@game/engine/data/actions"
import { ALL_GENERATORS } from "@game/engine/data/generators"
import {
  SettingsKey,
  type SettingsId,
  type GameSettingStateLookup,
} from "@game/types/settings"
import type { GameEngineHelper } from "@game/types/shared"
import { BUILD_VERSION } from "@src/build_info"

const MenuBarKey = {
  Actions: "Actions",
  Assets: "Assets",
  Settings: "Settings",
} as const

type MenuBarId = (typeof MenuBarKey)[keyof typeof MenuBarKey];

const MENU_CONTENT_STATUS_MAP: Record<
  MenuBarId,
  Array<"actions" | "generators" | "gameSettings">
> = {
  [MenuBarKey.Actions]: ["actions"],
  [MenuBarKey.Assets]: ["generators"],
  [MenuBarKey.Settings]: ["gameSettings"],
}

// TODO: This is smelling like type bloat. Refactor soon.
export type GameSnapshot = {
  actions: ActionStateLookup;
  unlocks: UnlockId[];
  resources: ResourceStateLookup;
  generators: GeneratorStateLookup;
  gameSettings: GameSettingStateLookup;
  gameVersion?: string;
  alreadyReadChapters?: ChapterId[];
  currentlyReading?: ChapterId | null;
  lastSaveDate?: number;

  // For use in action effects
  play?: (entry: ChapterId | Message[]) => void;
};

export class GameEngine {
  actions: ActionStateLookup = Object.entries(ALL_ACTIONS).reduce(
    (acc, [id, spec]) => {
      const actionId = Number(id) as ActionId // Cast because Object.entries treats keys as strings

      acc[actionId] = {
        id: actionId,
        spec: spec,
        status: ContentStatusKey.Locked, // Default starting status
      }

      return acc
    },
    {} as ActionStateLookup,
  )
  unlocks: Set<UnlockId> = new Set()
  resources: ResourceStateLookup
  generators: GeneratorStateLookup = Object.entries(ALL_GENERATORS).reduce(
    (acc, [id, spec]) => {
      const generatorId = id as GeneratorId

      acc[generatorId] = {
        id: generatorId,
        spec: spec,
        status: ContentStatusKey.Locked,
        // Start with one solar panel always
        amount: spec.defaultAmount ?? 0,
        efficiency:
          generatorId === GeneratorKey.PlanetaryLumiumCollector ? 0.2 : 1.0,
        toggled: 0, // Always start off, if toggleable.
      }

      return acc
    },
    {} as GeneratorStateLookup,
  )
  gameSettings: GameSettingStateLookup = Object.entries(ALL_SETTINGS).reduce(
    (acc, [id, spec]) => {
      const settingsId = id as SettingsId

      acc[settingsId] = {
        id: settingsId,
        spec: spec,
        value: spec.defaultValue,
        status: ContentStatusKey.Locked,
      }
      return acc
    },
    {} as GameSettingStateLookup,
  )

  private container: HTMLElement
  private metricsContainer: HTMLElement
  private primaryContainer: HTMLElement
  private menuBar: HTMLElement
  private menuBarItems: Set<MenuBarId> = new Set()
  private currentMenuBar: MenuBarId = MenuBarKey.Actions
  private actionsContainer: HTMLElement
  private assetsContainer: HTMLElement
  private settingsContainer: HTMLElement
  // private activeProgress: Map<ActionId, number> = new Map() // Tracks 0-100% for bars

  private loreEngine: LoreEngine

  private gameLogicUI: ((snapshot: GameSnapshot) => void)[] = []
  // Handler id for the autosave interval so it can be cleared/restarted
  private autosaveTimerId: number | null = null

  constructor(containerId: string) {
    // Initialize resources (assuming starting values)
    this.resources = {
      [ResourceKey.EnergyUnits]: {
        spec: {
          id: ResourceKey.EnergyUnits,
          longName: "Energy",
          unit: "EU",
          display: "main",
          prerequisites: [UnlockKey.StorageUI],
        },
        amount: 10,
        cap: 20,
        status: ContentStatusKey.Locked,
      },
      [ResourceKey.UniversalStructuralMaterial]: {
        spec: {
          id: ResourceKey.UniversalStructuralMaterial,
          longName: "Universal Structural Material",
          unit: "USM",
          display: "main",
          prerequisites: [UnlockKey.MolecularAssemblerEnabled],
        },
        amount: 0,
        cap: 100,
        status: ContentStatusKey.Locked,
      },
      [ResourceKey.Regolith]: {
        spec: {
          id: ResourceKey.Regolith,
          longName: "Regolith",
          unit: "rocks",
          display: "main",
          prerequisites: [UnlockKey.RegolithAccumulatorEnabled],
        },
        amount: 0,
        cap: 100,
        status: ContentStatusKey.Locked,
      },
    }
    this.container = document.getElementById(containerId) || document.body

    // Major divs
    const terminal = document.createElement("div")
    terminal.id = "terminal-container"
    this.container.appendChild(terminal)
    this.menuBar = document.createElement("nav")
    this.menuBar.className = "nav nav-pills nav-justified my-2"
    this.menuBar.id = "menu-bar"
    this.actionsContainer = document.createElement("div")
    this.actionsContainer.id = "actions-container"
    this.primaryContainer = document.createElement("div")
    this.primaryContainer.id = "primary-container"
    this.metricsContainer = document.createElement("div")
    this.metricsContainer.id = "metrics-container"

    this.settingsContainer = document.createElement("div")
    this.settingsContainer.id = "settings-container"

    this.assetsContainer = document.createElement("div")
    this.assetsContainer.id = "assets-container"

    const bottomContainer = document.createElement("div")
    bottomContainer.className = "container"
    bottomContainer.appendChild(this.metricsContainer)
    bottomContainer.appendChild(this.menuBar)
    bottomContainer.appendChild(this.primaryContainer)

    this.container.appendChild(bottomContainer)
    // Set initial panel
    this.currentMenuBar = MenuBarKey.Actions
    this.setActiveContainer(MenuBarKey.Actions)

    // Sub-engine init: pass a full helpers object so sub-engines and UI
    // can rely on a consistent shape. getHelpers() builds the object from
    // this GameEngine instance.
    this.loreEngine = new LoreEngine("terminal-container", this.getHelpers())
  }

  private getHelpers(): GameEngineHelper {
    return {
      getGenerators: () => this.generators,
      getActions: () => this.actions,
      getResources: () => this.resources,
      getGameSettings: () => this.gameSettings,
      registerUpdater: (fn: (snapshot: unknown) => void) => {
        this.gameLogicUI.push(fn as (snapshot: GameSnapshot) => void)
      },
      affordCost: (cost) => this.affordCost(cost),
      deductCost: (cost) => this.deductCost(cost),
      addCost: (cost) => this.addCost(cost),
      performAction: (id) => this.performAction(id),
      exportSave: () => this.exportSave(),
      importSave: (s) => this.importSave(s),
      doAutosave: () => this.doAutosave(),
      play: (id) => this.loreEngine?.play(id),
      setGameSettingValue: (id: SettingsId, value: unknown) => {
        const s = this.gameSettings[id]
        if (!s) return
        const t = s.spec.type
        if (t === "boolean") s.value = Boolean(value)
        else if (t === "number") s.value = Number(value)
        else s.value = String(value)
        if (id === SettingsKey.AutosaveInterval) {
          this.resetAutosaveTimer()
        }
      },
      unlock: (u: UnlockId) => this.unlocks.add(u),
    }
  }

  private doAutosave(playMessage: boolean = false) {
    if (playMessage && this.gameSettings.PlayAutosaveMessages.value) {
      this.loreEngine.play(ChapterKey.AutosaveSave)
    }
    localStorage.setItem("gameState", this.exportSave())
  }

  // Clear any existing autosave interval and start a new one using the
  // configured AutosaveInterval (seconds). Enforces a minimum of 5 seconds.
  private resetAutosaveTimer() {
    try {
      if (this.autosaveTimerId != null) {
        clearInterval(this.autosaveTimerId)
        this.autosaveTimerId = null
      }

      const raw = Number(this.gameSettings?.AutosaveInterval?.value ?? 30)
      const saneNumber = Number.isFinite(raw) ? raw : 30
      const seconds = Math.max(5, Math.floor(saneNumber))

      // Store the timer id so we can clear it later when the setting changes
      this.autosaveTimerId = window.setInterval(
        () => this.doAutosave(true),
        seconds * 1000,
      )
      console.log(`Autosave interval set to ${seconds}s`)
    } catch (e) {
      console.error("Failed to reset autosave timer:", e)
    }
  }

  public start() {
    const savedData = localStorage.getItem("gameState")
    if (savedData && savedData.trim() !== "") {
      this.importSave(savedData)
      if (this.gameSettings.PlayAutosaveMessages.value)
        this.loreEngine.play(ChapterKey.AutosaveLoad)
    } else {
      this.loreEngine.play(0)
    }

    // Start the main tick loop (1s)
    setInterval(() => this.doTick(), 1000)

    // Start autosave using configured interval (in seconds) but enforce a
    // minimum of 5 seconds to avoid rapid-fire saves or a zero interval.
    this.resetAutosaveTimer()

    requestAnimationFrame(() => this.renderLoop())
  }

  public exportSave(): string {
    const snapshot: GameSnapshot = {
      actions: this.actions,
      unlocks: Array.from(this.unlocks),
      resources: this.resources,
      generators: this.generators,
      gameSettings: this.gameSettings,
      gameVersion: BUILD_VERSION,
      lastSaveDate: Date.now(),
      alreadyReadChapters: this.loreEngine.alreadyRead,
      currentlyReading: this.loreEngine.currentlyReading,
    }

    // Create a sanitized snapshot that strips large/static `spec` objects
    // and DOM `element` references. Specs are re-attached on import so
    // they don't need to be stored in every save (keeps saves small).
    const sanitizeState = (state: Record<string, unknown>) => {
      const out: Record<string, unknown> = {}
      Object.entries(state).forEach(([k, v]) => {
        // Shallow clone but remove spec and element when present
        const clone = { ...(v as Record<string, unknown>) }
        if (clone && typeof clone === "object") {
          const obj = clone as Record<string, unknown>
          delete obj["spec"]
          delete obj["element"]
        }
        out[k] = clone
      })
      return out
    }

    const sanitizedSnapshot = {
      ...snapshot,
      actions: sanitizeState(snapshot.actions),
      generators: sanitizeState(snapshot.generators),
      // Resources currently keep runtime values (amount/cap) but their
      // `spec` can be reconstructed on load from current defaults.
      resources: sanitizeState(snapshot.resources),
      gameSettings: sanitizeState(
        snapshot.gameSettings as unknown as Record<string, unknown>,
      ),
    }

    const serializedData = JSON.stringify(sanitizedSnapshot)
    return btoa(serializedData)
  }

  public importSave(gameSaveStr: string) {
    try {
      const decoded = atob(gameSaveStr)
      const data = JSON.parse(decoded) as GameSnapshot

      // If the save's gameVersion differs from current, generate a small changelog
      const savedVersion = data.gameVersion ?? null
      if (savedVersion !== BUILD_VERSION) {
        const msgs: Message[] = []
        msgs.push({
          content: `Loaded save ${savedVersion ?? "<unknown>"} → current ${BUILD_VERSION}`,
          tag: MessageTagKey.Meta,
        })
      }

      // 2. Restore / migrate Resources, Settings, Generators & Unlocks
      // Merge saved resources into current defaults (constructor set defaults)
      const savedResources = (data.resources ??
        {}) as Partial<ResourceStateLookup>
      // Ensure existing default resources are preserved, but overwritten by saved values
      Object.keys(this.resources).forEach((k) => {
        const key = k as ResourceId
        const defaultRes = this.resources[key]
        const saved = savedResources[key]
        if (saved) {
          // Re-attach the current default spec to avoid relying on a saved spec
          this.resources[key] = {
            ...defaultRes,
            ...(saved as ResourceState),
            spec: defaultRes.spec,
          }
        }
      })

      // Merge settings: ensure every setting in ALL_SETTINGS exists, re-attach spec
      const savedSettings = (data.gameSettings ??
        {}) as Partial<GameSettingStateLookup>
      Object.keys(this.gameSettings).forEach((id) => {
        const sId = id as SettingsId
        const defaultState = this.gameSettings[sId]
        const saved = savedSettings[sId]
        if (saved) {
          this.gameSettings[sId] = {
            ...defaultState,
            ...saved,
            spec: defaultState.spec,
          }
        }
      })

      // Merge generators: ensure ALL_GENERATORS keys exist and re-attach spec
      const savedGenerators = (data.generators ??
        {}) as Partial<GeneratorStateLookup>
      Object.keys(this.generators).forEach((id) => {
        const generatorId = id as GeneratorId
        const defaultGen = this.generators[generatorId]
        const saved = savedGenerators?.[generatorId]
        this.generators[generatorId] = {
          ...defaultGen,
          ...(saved ?? {}),
          spec: defaultGen.spec,
        }
      })

      this.unlocks = new Set(data.unlocks)
      this.loreEngine.alreadyRead = data.alreadyReadChapters ?? []

      if (data.currentlyReading) {
        this.loreEngine.currentlyReading = data.currentlyReading ?? null
        this.loreEngine.play(data.currentlyReading) // Doesn't matter which, since it reads off of currentlyReading
      }

      // 3. Restore Actions (Merge spec back in)
      Object.entries(data.actions).forEach(([id, state]) => {
        const actionId = Number(id) as ActionId
        this.actions[actionId] = {
          ...state,
          spec: ALL_ACTIONS[actionId], // Re-attach the static spec
          element: undefined, // Will be re-generated by renderLoop
        }
      })

      // Clear UI containers so they re-render from new state
      this.actionsContainer.innerHTML = ""
      console.log("Save loaded successfully.")
      if (data.lastSaveDate) this.calculateOfflineProgress(data.lastSaveDate)
    } catch (e) {
      alert(
        `Contact the developer through GitHub for support. Failed to import save: ${e}`,
      )
    }
  }

  private calculateOfflineProgress(lastSaveDate: number) {
    const now = Date.now()
    const secondsPassed = Math.floor((now - lastSaveDate) / 1000)

    if (secondsPassed <= 0) return

    console.log(`Calculating ${secondsPassed}s of offline progress...`)

    // Basic implementation: Run doTick logic in a loop or
    // multiply resource generation if you have passive income.
    // To avoid lag on long absences, limit the ticks or use math:
    const maxOfflineTicks = 3600 * 24 // Cap at 24 hours
    const actualTicks = Math.min(secondsPassed, maxOfflineTicks)

    this.loreEngine.play([
      {
        tag: MessageTagKey.Meta,
        content: `Catching up with offline progress (${actualTicks} ticks)...`,
      },
    ])
    for (let i = 0; i < actualTicks; i++) {
      this.loreEngine.showCustomStatus(
        `CALCULATING OFFLINE PROGRESS ${i + 1}/${actualTicks}`,
      )
      this.doTick()
    }
    this.loreEngine.showDoneStatus()
  }

  private doTick() {
    // Increment resources based on generators:
    Object.entries(this.generators).map(([_, generatorState]) => {
      if (!generatorState.amount) return // Fast return

      const { spec, amount, efficiency } = generatorState

      // First, if toggleable and toggled off, don't do anything
      if (spec.toggleable && !generatorState.toggled) return
      // Then, count how many are "active"
      const activeCount = spec.toggleable
        ? Math.min(generatorState.toggled ?? 0, amount)
        : amount

      // If not afforded, turn everything off, if toggleable.
      // This is intended -- automation may be an investment down the line, or simply player skill issue
      if (spec.baseConsumePerSec) {
        const totalCost = spec.baseConsumePerSec.reduce((acc, item) => {
          acc.push({
            id: item.id,
            value: item.value * activeCount,
          })
          return acc
        }, [] as Cost[])
        if (!this.affordCost(totalCost)) {
          generatorState.toggled = 0
          return
        }
        // Deduct the cost:
        this.deductCost(totalCost)
      }

      // Then, finally, add the resources
      spec.baseGainPerSec.map((income) => {
        const resId = income.id
        this.resources[resId].amount = Math.min(
          this.resources[resId].cap,
          this.resources[resId].amount +
            activeCount * efficiency * income.value,
        )
      })
    })

    // Unlock new content if any:
    const unlockOptions = {
      passesPrerequisites: (u: UnlockId[]) => this.passesPrerequisites(u),
    }
    checkUnlockables(Object.values(this.resources), {
      ...unlockOptions,
      skipNew: true,
    })
    checkUnlockables(Object.values(this.actions), unlockOptions)
    checkUnlockables(Object.values(this.gameSettings), unlockOptions)
    checkUnlockables(Object.values(this.generators), unlockOptions)

    // Play lore chapters if any:
    Object.entries(this.loreEngine.chapters).map(([_, chapterEntry]) => {
      if (chapterEntry?.disableTrigger) return
      if (this.loreEngine.alreadyRead.includes(chapterEntry.id)) return
      if (this.passesPrerequisites(chapterEntry.unlockPrerequisites ?? []))
        this.loreEngine.play(chapterEntry.id)
    })

    // Finally, render everything in gameLogicUI:
    this.gameLogicUI.map((func) =>
      func({
        actions: this.actions,
        unlocks: Array.from(this.unlocks),
        resources: this.resources,
        generators: this.generators,
        gameSettings: this.gameSettings,
      }),
    )
  }

  private passesPrerequisites(prerequisites: UnlockId[]): boolean {
    return !prerequisites.some((p) => !this.unlocks.has(p))
  }

  private affordCost(cost: Cost[]): boolean {
    return cost.every((c) => this.resources[c.id].amount >= c.value)
  }

  private deductCost(cost: Cost[]): void {
    cost.forEach((c) => {
      this.resources[c.id].amount -= c.value
    })
  }

  private addCost(cost: Cost[]): void {
    cost.forEach((c) => {
      this.resources[c.id].amount += c.value
    })
  }

  private performAction(actionId: ActionId) {
    const state = this.actions[actionId]
    const spec = state.spec

    if (!this.affordCost(spec.cost)) {
      console.log("Not enough resources!")
      return
    }

    this.deductCost(spec.cost)

    // Apply simple UnlockIds:
    if (spec.unlocks) {
      spec.unlocks.forEach((u) => this.unlocks.add(u))
    }

    // Run custom effect if available
    if (spec.effect) {
      spec.effect({
        actions: this.actions,
        unlocks: Array.from(this.unlocks),
        resources: this.resources,
        generators: this.generators,
        gameSettings: this.gameSettings,
        play: (e) => this.loreEngine.play(e),
      })
    }

    // Update ActionState
    if (!spec.repeatable) {
      state.status = ContentStatusKey.Completed
      // Optional: Remove or disable the element
      if (state.element) state.element.style.display = "none"
    } else {
      state.boughtCount = (state.boughtCount || 0) + 1
    }
  }

  private renderMenuBar() {
    const MENU_BAR_LOOKUP: Record<MenuBarId, UnlockId[]> = {
      [MenuBarKey.Actions]: [UnlockKey.ActionsUI],
      [MenuBarKey.Assets]: [UnlockKey.AssetsUIUnlock],
      [MenuBarKey.Settings]: [UnlockKey.SettingsUI],
    }

    const primaryNavClasses = "primary-nav nav-item nav-link"
    const primaryNavActive = `${primaryNavClasses} active`

    Object.entries(MENU_BAR_LOOKUP).map(([_key, prerequisites]) => {
      const key = _key as MenuBarId
      if (this.passesPrerequisites(prerequisites)) {
        const existingButton = this.menuBar.querySelector(
          `[data-menu-bar-id="${key}"]`,
        ) as HTMLAnchorElement | null

        if (existingButton) {
          existingButton.classList.toggle("new-item", this.hasNewItems(key))
          return
        }

        this.menuBarItems.add(key)

        const menuBarButton = document.createElement("a")
        menuBarButton.dataset.menuBarId = key
        menuBarButton.onclick = () => {
          this.setActiveContainer(key)

          const allMenuLinks = document.querySelectorAll(".primary-nav")
          allMenuLinks.forEach((o) => o.classList.remove("active"))

          menuBarButton.className = primaryNavActive
        }
        menuBarButton.href = "#"
        if (this.currentMenuBar === key) {
          menuBarButton.className = primaryNavActive
        } else {
          menuBarButton.className = primaryNavClasses
        }
        menuBarButton.classList.toggle("new-item", this.hasNewItems(key))
        menuBarButton.innerHTML = key

        this.menuBar.appendChild(menuBarButton)
      }
    })
  }

  private renderMetricsScreen() {
    Object.entries(this.resources).map(([_resKey, resState]) => {
      const container = document.createElement("div")
      if (resState.status === ContentStatusKey.Locked) return

      const resKey = _resKey as ResourceId
      // Create if not exists
      if (!resState.element) {
        const containerTitle = document.createElement("h5")
        containerTitle.innerHTML = resState.spec.longName

        const {
          container: progressContainer,
          progressBar,
          progressLabel,
        } = createProgress()
        progressBar.id = `metrics-progress-${resKey}`

        const updateProgressBar = (gameSnapshot: GameSnapshot) => {
          const _resState = gameSnapshot.resources[resKey]
          progressBar.ariaValueMin = "0"
          progressBar.ariaValueMax = `${_resState.cap}`
          progressBar.ariaValueNow = `${_resState.amount}`
          progressLabel.innerHTML = `${_resState.amount.toFixed(2)} / ${_resState.cap.toFixed(2)} ${_resState.spec.unit}`
          progressBar.style.width = `${(100.0 * _resState.amount) / _resState.cap}%`
        }

        if (resKey !== Object.keys(this.resources)[0]) {
          containerTitle.className = "mt-2"
        }

        container.appendChild(containerTitle)
        container.appendChild(progressContainer)

        this.gameLogicUI.push(updateProgressBar)
        resState.element = container
        this.metricsContainer.appendChild(container)
      }
    })
  }

  private setActiveContainer(menuBarId: MenuBarId) {
    if (this.currentMenuBar !== menuBarId) {
      this.markMenuItemsAsSeen(this.currentMenuBar)
    }

    const MENU_BAR_MAP: Record<MenuBarId, HTMLElement> = {
      [MenuBarKey.Actions]: this.actionsContainer,
      [MenuBarKey.Assets]: this.assetsContainer,
      [MenuBarKey.Settings]: this.settingsContainer,
    }

    this.primaryContainer.innerHTML = ""
    this.primaryContainer.appendChild(
      MENU_BAR_MAP[menuBarId] ?? this.actionsContainer,
    )
    this.currentMenuBar = menuBarId
  }

  private markMenuItemsAsSeen(menuBarId: MenuBarId) {
    MENU_CONTENT_STATUS_MAP[menuBarId].forEach((collectionKey) => {
      Object.values(this[collectionKey]).forEach((state) => {
        if (state.status === ContentStatusKey.New) {
          state.status = ContentStatusKey.Unlocked
        }
      })
    })
  }

  private hasNewItems(menuBarId: MenuBarId): boolean {
    return MENU_CONTENT_STATUS_MAP[menuBarId].some((collectionKey) =>
      Object.values(this[collectionKey]).some(
        (state) => state.status === ContentStatusKey.New,
      ),
    )
  }

  private renderLoop() {
    this.renderMenuBar()
    // Render metrics
    this.renderMetricsScreen()

    // Only selectively render what's shown
    switch (this.currentMenuBar) {
      case MenuBarKey.Assets:
        if (this.passesPrerequisites([UnlockKey.AssetsUIUnlock])) {
          attachAssetsUI(this.assetsContainer, this.getHelpers())
        }
        break
      case MenuBarKey.Settings:
        attachSettingsUI(this.settingsContainer, this.getHelpers())
        break
      default:
      case MenuBarKey.Actions:
        if (this.passesPrerequisites([UnlockKey.ActionsUI])) {
          attachActionsUI(this.actionsContainer, this.getHelpers())
        }
        break
    }

    requestAnimationFrame(() => this.renderLoop())
  }
}
