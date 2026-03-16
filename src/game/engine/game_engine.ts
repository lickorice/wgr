import { LoreEngine } from "@game/lore/lore_engine"
import { UnlockKey, type UnlockId } from "@game/types/unlocks"
import {
  createCard,
  createProgress,
  createAffordableButton,
} from "@game/layout/util"
import { attachSettingsUI, ALL_SETTINGS } from "@game/layout/settings"
import { ChapterKey, type ChapterId } from "@game/types/lore"
import { ContentStatusKey } from "@game/types/shared"
import {
  GeneratorKey,
  type GeneratorId,
  type GeneratorState,
} from "@game/types/generators"
import {
  ResourceKey,
  type ResourceId,
  type ResourceState,
  type Cost,
} from "@game/types/resources"
import { type ActionId, type ActionState } from "@game/types/actions"
import { ALL_ACTIONS } from "@game/engine/data/actions"
import { ALL_GENERATORS } from "@game/engine/data/generators"
import {
  SettingsKey,
  type SettingsId,
  type GameSettingState,
} from "@game/types/settings"

const MenuBarKey = {
  Actions: "Actions",
  Settings: "Settings",
} as const

type MenuBarId = (typeof MenuBarKey)[keyof typeof MenuBarKey];

const MetricsScreenKey = {
  Storage: "Storage",
  Bootstrapper: "Bootstrapper",
} as const

type MetricsScreenId = (typeof MetricsScreenKey)[keyof typeof MetricsScreenKey];

export type GameSnapshot = {
  actions: Record<ActionId, ActionState>;
  unlocks: UnlockId[];
  resources: Record<ResourceId, ResourceState>;
  gameSettings: Record<SettingsId, GameSettingState>;
  alreadyReadChapters?: ChapterId[];
  lastSaveDate?: number;
};

export class GameEngine {
  actions: Record<ActionId, ActionState> = Object.entries(ALL_ACTIONS).reduce(
    (acc, [id, spec]) => {
      const actionId = Number(id) as ActionId // Cast because Object.entries treats keys as strings

      acc[actionId] = {
        id: actionId,
        spec: spec,
        status: ContentStatusKey.Locked, // Default starting status
      }

      return acc
    },
    {} as Record<ActionId, ActionState>,
  )
  unlocks: Set<UnlockId> = new Set()
  resources: Record<ResourceId, ResourceState>
  generators: Record<GeneratorId, GeneratorState> = Object.entries(
    ALL_GENERATORS,
  ).reduce(
    (acc, [id, spec]) => {
      const generatorId = id as GeneratorId

      acc[generatorId] = {
        id: generatorId,
        spec: spec,
        status: ContentStatusKey.Locked,
        // Start with one solar panel always
        amount: generatorId === GeneratorKey.PlanetaryLumiumCollector ? 1 : 0,
        efficiency: 0.2,
      }

      return acc
    },
    {} as Record<GeneratorId, GeneratorState>,
  )
  gameSettings: Record<SettingsId, GameSettingState> = Object.entries(
    ALL_SETTINGS,
  ).reduce(
    (acc, [id, setting]) => {
      const settingsId = id as SettingsId

      acc[settingsId] = {
        id: settingsId,
        setting: setting,
        value: setting.defaultValue,
        status: ContentStatusKey.Locked,
      }
      return acc
    },
    {} as Record<SettingsId, GameSettingState>,
  )

  private container: HTMLElement
  private metricsContainer: HTMLElement
  private primaryContainer: HTMLElement
  private menuBar: HTMLElement
  private metricsItems: Set<MetricsScreenId> = new Set()
  private menuBarItems: Set<MenuBarId> = new Set()
  private currentMenuBar: MenuBarId = MenuBarKey.Actions
  private actionsContainer: HTMLElement
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
        },
        amount: 10,
        cap: 20,
      },
      [ResourceKey.UniversalStructuralMaterial]: {
        spec: {
          id: ResourceKey.UniversalStructuralMaterial,
          longName: "Universal Structural Material",
          unit: "USM",
          display: "main",
        },
        amount: 0,
        cap: 100,
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

    this.container.appendChild(this.metricsContainer)
    this.container.appendChild(this.menuBar)
    this.container.appendChild(this.primaryContainer)
    // Set initial panel
    this.currentMenuBar = MenuBarKey.Actions
    this.setActiveContainer(MenuBarKey.Actions)

    // Sub-engine init:
    this.loreEngine = new LoreEngine("terminal-container", {
      unlock: (u: UnlockId) => {
        this.unlocks.add(u)
      },
      getGameSettings: () => this.gameSettings,
    })
  }

  private doAutosave(playMessage: boolean = false) {
    if (playMessage && this.gameSettings.PlayAutosaveMessages.value) {
      this.loreEngine.playChapter(ChapterKey.AutosaveSave)
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
    if (savedData) {
      this.importSave(savedData)
      if (this.gameSettings.PlayAutosaveMessages.value)
        this.loreEngine.playChapter(ChapterKey.AutosaveLoad)
    } else {
      this.loreEngine.playChapter(0)
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
      // Convert Set to Array for JSON stringify
      unlocks: Array.from(this.unlocks),
      resources: this.resources,
      gameSettings: this.gameSettings,
      lastSaveDate: Date.now(),
      alreadyReadChapters: this.loreEngine.alreadyRead,
    }

    // Remove HTMLElements from the snapshot before saving
    // They cannot be serialized and would cause errors
    const serializedData = JSON.stringify(snapshot, (key, value) => {
      if (key === "element") return undefined
      return value
    })

    return btoa(serializedData)
  }

  public importSave(gameSaveStr: string) {
    try {
      const decoded = atob(gameSaveStr)
      const data = JSON.parse(decoded) as GameSnapshot

      // 1. Calculate Offline Progress
      if (data.lastSaveDate) this.calculateOfflineProgress(data.lastSaveDate)

      // 2. Restore Resources & Unlocks
      this.resources = data.resources
      this.gameSettings = data.gameSettings
      this.unlocks = new Set(data.unlocks)
      this.loreEngine.alreadyRead = data.alreadyReadChapters ?? []

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
    } catch (e) {
      console.error("Failed to import save:", e)
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

    for (let i = 0; i < actualTicks; i++) {
      // If you have passive resource generation, call it here:
      // this.applyPassiveGeneration();
      // We don't necessarily want to call this.doTick() because
      // it handles UI. Just update the numbers.
    }
  }

  private doTick() {
    // Apply the descriptons font setting (toggled in the UI). We run this
    // here each tick so any external changes (imported save, UI toggle)
    // are applied reliably without relying on the settings updater path.
    try {
      const enabled = Boolean(
        this.gameSettings[SettingsKey.UseSansSerifDescriptions]?.value,
      )
      if (
        enabled &&
        !document.body.classList.contains("use-roboto-descriptions")
      )
        document.body.classList.add("use-roboto-descriptions")
      else if (
        !enabled &&
        document.body.classList.contains("use-roboto-descriptions")
      )
        document.body.classList.remove("use-roboto-descriptions")
    } catch (e) {
      // Defensive: don't let a DOM error stop the tick loop
      console.warn("Failed to apply descriptions font setting:", e)
    }
    // Increment resources based on generators:
    Object.entries(this.generators).map(([_, generatorState]) => {
      if (!generatorState.amount) return // Fast return

      const { spec, amount, efficiency } = generatorState

      Object.entries(spec.baseGainPerSec).map(([_, income]) => {
        const resId = income.id
        this.resources[resId].amount = Math.min(
          this.resources[resId].cap,
          this.resources[resId].amount + amount * efficiency * income.value,
        )
      })
    })

    // Unlock new content if any:
    Object.entries(this.actions).map(([_, actionState]) => {
      const actionIsLocked = actionState.status === ContentStatusKey.Locked
      const actionPrerequisites = actionState.spec.prerequisites ?? [
        UnlockKey.IntroductionFinished,
      ]
      if (actionIsLocked && this.passesPrerequisites(actionPrerequisites)) {
        actionState.status = ContentStatusKey.Unlocked
      }
    })
    Object.entries(this.gameSettings).map(([_, settingState]) => {
      const actionIsLocked = settingState.status === ContentStatusKey.Locked
      const actionPrerequisites = settingState.setting.prerequisites ?? [
        UnlockKey.IntroductionFinished,
      ]
      if (actionIsLocked && this.passesPrerequisites(actionPrerequisites)) {
        settingState.status = ContentStatusKey.Unlocked
      }
    })

    // Play lore chapters if any:
    Object.entries(this.loreEngine.chapters).map(([_, chapterEntry]) => {
      if (chapterEntry?.disableTrigger) return
      if (this.passesPrerequisites(chapterEntry.unlockPrerequisites ?? []))
        this.loreEngine.playChapter(chapterEntry.id)
    })

    // Finally, render everything in gameLogicUI:
    this.gameLogicUI.map((func) =>
      func({
        actions: this.actions,
        unlocks: Array.from(this.unlocks),
        resources: this.resources,
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
        gameSettings: this.gameSettings,
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
      [MenuBarKey.Settings]: [UnlockKey.SettingsUI],
    }

    const primaryNavClasses = "primary-nav nav-item nav-link"
    const primaryNavActive = `${primaryNavClasses} active`

    Object.entries(MENU_BAR_LOOKUP).map(([_key, prerequisites]) => {
      const key = _key as MenuBarId
      if (this.menuBarItems.has(key)) return
      if (this.passesPrerequisites(prerequisites)) {
        this.menuBarItems.add(key)

        const menuBarButton = document.createElement("a")
        menuBarButton.onclick = () => {
          this.currentMenuBar = key
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
        menuBarButton.innerHTML = key

        this.menuBar.appendChild(menuBarButton)
      }
    })
  }

  private renderMetricsScreen() {
    const METRIC_SCREEN_LOOKUP: Record<MetricsScreenId, UnlockId[]> = {
      [MetricsScreenKey.Storage]: [UnlockKey.StorageUI],
      [MetricsScreenKey.Bootstrapper]: [UnlockKey.BootstrapperUI],
    }

    Object.entries(METRIC_SCREEN_LOOKUP).map(([_key, prerequisites]) => {
      const key = _key as MetricsScreenId
      if (this.metricsItems.has(key)) return
      if (this.passesPrerequisites(prerequisites)) {
        this.metricsItems.add(key)

        // For now, set to an if-else for storage and bootstrapper:
        const getLayout = (key: MetricsScreenId) => {
          const container = document.createElement("div")
          if (key === MetricsScreenKey.Storage) {
            Object.entries(this.resources).map(([_resKey, resState]) => {
              const resKey = _resKey as ResourceId

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
            })
          } else {
          }
          return container
        }
        this.metricsContainer.appendChild(getLayout(key))
      }
    })
  }

  private renderActionsScreen() {
    if (!this.passesPrerequisites([UnlockKey.ActionsUI])) return
    // Render individual actions and ensure a visible empty placeholder
    const existingPlaceholder =
      this.actionsContainer.querySelector("#actions-empty")
    let unlockedCount = 0

    Object.entries(this.actions).forEach(([actionId, actionState]) => {
      // Count unlocked actions
      if (actionState.status === ContentStatusKey.Unlocked) {
        unlockedCount++

        // Only create DOM once per action
        if (!actionState.element) {
          const { card: actionsCard, body: actionsCardBody } = createCard(
            actionState.spec.displayTitle,
            actionState.spec.flavorText,
            this.gameSettings.UseSansSerifDescriptions.value as boolean,
          )

          const costText = actionState.spec.cost
            .map((c) => `${c.value} ${c.id}`)
            .join(", ")

          const { button: buyButton, update: updateAffordability } =
            createAffordableButton(
              actionState.spec.cost,
              () => this.affordCost(actionState.spec.cost),
              () => this.performAction(Number(actionId) as ActionId),
              // stronger visual affordance for action buttons
              "btn btn-sm btn-primary",
            )

          buyButton.innerText = `Execute (${costText})`

          // Register an updater so the button state refreshes during ticks
          this.gameLogicUI.push((_snapshot: GameSnapshot) =>
            updateAffordability(),
          )

          // Wrap controls so the button can be flushed to the right for mobile ergonomics
          const controls = document.createElement("div")
          controls.className =
            "action-card-controls d-flex justify-content-end mt-2"
          controls.appendChild(buyButton)

          actionsCardBody.appendChild(controls)

          actionsCard.id = `action-${actionId}`

          this.actionsContainer.append(actionsCard)
          actionState.element = actionsCard
        }
      }
    })

    // If there are no unlocked actions, show a visible, tangible empty state
    if (unlockedCount === 0) {
      if (!existingPlaceholder) {
        const placeholder = document.createElement("div")
        placeholder.id = "actions-empty"
        placeholder.className = "text-muted small p-2"
        placeholder.innerText = "No actions are currently doable."
        if (this.gameSettings.UseSansSerifDescriptions) {
          placeholder.classList.add("sans-serif")
        }
        this.actionsContainer.appendChild(placeholder)
      }
    } else if (existingPlaceholder) {
      existingPlaceholder.remove()
    }
  }

  private setActiveContainer(menuBarId: MenuBarId) {
    const MENU_BAR_MAP: Record<MenuBarId, HTMLElement> = {
      [MenuBarKey.Actions]: this.actionsContainer,
      [MenuBarKey.Settings]: this.settingsContainer,
    }

    this.primaryContainer.innerHTML = ""
    this.primaryContainer.appendChild(MENU_BAR_MAP[menuBarId])
  }

  private renderLoop() {
    this.renderMenuBar()
    // Render metrics
    this.renderMetricsScreen()

    // Only selectively render what's shown
    switch (this.currentMenuBar) {
      case MenuBarKey.Actions:
        this.renderActionsScreen()
        break
      case MenuBarKey.Settings:
        attachSettingsUI(this.settingsContainer, {
          exportSave: () => this.exportSave(),
          importSave: (s: string) => this.importSave(s),
          doAutosave: () => this.doAutosave(),
          playChapter: (id) => this.loreEngine.playChapter(id),
          getGameSettings: () => this.gameSettings,
          setGameSettingValue: (id: SettingsId, value: unknown) => {
            const s = this.gameSettings[id]
            if (!s) return
            // Coerce the incoming value to the declared type for safety
            const t = s.setting.type
            if (t === "boolean") s.value = Boolean(value)
            else if (t === "number") s.value = Number(value)
            else s.value = String(value)
            // If the autosave interval was changed, restart the autosave loop
            if (id === SettingsKey.AutosaveInterval) {
              // End current loop and start a new one with the updated value.
              // Don't force an immediate save; just restart the timer using the
              // new interval. The reset function enforces a minimum of 5s.
              this.resetAutosaveTimer()
            }
            // NOTE: visual application of the descriptions font setting is
            // handled in doTick() so imports and other state paths are
            // consistently applied there.
          },
        })
        break
    }

    requestAnimationFrame(() => this.renderLoop())
  }
}
