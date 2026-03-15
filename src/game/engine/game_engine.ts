import { LoreEngine } from "@game/lore/lore_engine"
import { UnlockKey, type UnlockId } from "@game/types/unlocks"
import { createCard, createButton, createProgress } from "@game/layout/util"

const ActionKey = {
  VALIDATE_HUMANITY: 0,
} as const

type ActionId = (typeof ActionKey)[keyof typeof ActionKey];

const ActionStatusKey = {
  Locked: 0,
  Unlocked: 1,
  Completed: 2,
} as const

type ActionStatus = (typeof ActionStatusKey)[keyof typeof ActionStatusKey];

const CurrencyKey = {
  UniversalStructuralMaterial: "USM",
  EnergyUnits: "EU",
} as const

type CurrencyId = (typeof CurrencyKey)[keyof typeof CurrencyKey];

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

export type Cost = {
  currency: CurrencyId;
  value: number;
};

export type ResourceSpec = {
  currency: CurrencyId;
  longName: string;
  unit: string;
  display: "main" | "others";
};

export type ResourceState = {
  spec: ResourceSpec;
  amount: number;
  cap: number;
};

export type ActionSpec = {
  id: ActionId;
  repeatable: boolean;
  displayTitle: string;
  flavorText: string;
  cost: Cost[];
  // Will always wait for IntroductionFinished, regardless if this is defined.
  prerequisites?: UnlockId[];
  // Shorthand for UnlockId unlocks, no need to implement custom effect
  unlocks?: UnlockId[];
  // Custom effects that pass in a GameSnapshot
  effect?: (game_snapshot: GameSnapshot) => void;
};

export type GameSnapshot = {
  actions: Record<ActionId, ActionState>;
  unlocks: UnlockId[];
  resources: Record<CurrencyId, ResourceState>;
  lastSaveDate?: number;
};

export type ActionState = {
  id: ActionId;
  spec: ActionSpec;
  status: ActionStatus;
  boughtCount?: number;
  cap?: number;
  element?: HTMLElement;
};

export const ALL_ACTIONS: Record<ActionId, ActionSpec> = {
  [ActionKey.VALIDATE_HUMANITY]: {
    id: ActionKey.VALIDATE_HUMANITY,
    displayTitle: "Validate Humanity",
    flavorText:
      "Assume your role as the [HU-MAN] orchestrator by sending an acknowledgement response to the bootloader.",
    repeatable: false,
    cost: [
      {
        currency: CurrencyKey.EnergyUnits,
        value: 1,
      },
    ],
    unlocks: [UnlockKey.HumanityValidated],
  },
}

export class GameEngine {
  actions: Record<ActionId, ActionState> = Object.entries(ALL_ACTIONS).reduce(
    (acc, [id, spec]) => {
      const actionId = Number(id) as ActionId // Cast because Object.entries treats keys as strings

      acc[actionId] = {
        id: actionId,
        spec: spec,
        status: ActionStatusKey.Locked, // Default starting status
      }

      return acc
    },
    {} as Record<ActionId, ActionState>,
  )
  unlocks: Set<UnlockId> = new Set()
  resources: Record<CurrencyId, ResourceState>

  private container: HTMLElement
  private metricsContainer: HTMLElement
  private primaryContainer: HTMLElement
  private menuBar: HTMLElement
  private metricsItems: Set<MetricsScreenId> = new Set()
  private menuBarItems: Set<MenuBarId> = new Set()
  private currentMenuBar: MenuBarId = MenuBarKey.Actions
  private actionsContainer: HTMLElement
  // private activeProgress: Map<ActionId, number> = new Map() // Tracks 0-100% for bars

  private loreEngine: LoreEngine

  private gameLogicUI: ((snapshot: GameSnapshot) => void)[] = []

  constructor(containerId: string) {
    // Initialize resources (assuming starting values)
    this.resources = {
      [CurrencyKey.EnergyUnits]: {
        spec: {
          currency: "EU",
          longName: "Energy",
          unit: "J",
          display: "main",
        },
        amount: 10,
        cap: 20,
      },
      [CurrencyKey.UniversalStructuralMaterial]: {
        spec: {
          currency: "USM",
          longName: "Material",
          unit: "kg",
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

    this.container.appendChild(this.metricsContainer)
    this.container.appendChild(this.menuBar)
    this.container.appendChild(this.primaryContainer)
    // Set initial panel
    this.currentMenuBar = MenuBarKey.Actions
    this.setActiveContainer(MenuBarKey.Actions)

    // Sub-engine init:
    this.loreEngine = new LoreEngine("terminal-container", (u: UnlockId) => {
      this.unlocks.add(u)
    })
  }

  private doAutosave() {
    localStorage.setItem("gameState", this.exportSave())
  }

  public start() {
    const savedData = localStorage.getItem("gameState")
    if (savedData) {
      this.importSave(savedData)
    } else {
      this.loreEngine.playChapter(0)
    }

    setInterval(() => this.doTick(), 1000)
    setInterval(() => this.doAutosave(), 10000)

    requestAnimationFrame(() => this.renderLoop())
  }

  public exportSave(): string {
    const snapshot: GameSnapshot = {
      actions: this.actions,
      // Convert Set to Array for JSON stringify
      unlocks: Array.from(this.unlocks),
      resources: this.resources,
      lastSaveDate: Date.now(),
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
      this.unlocks = new Set(data.unlocks)

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
    // Unlock new content if any:
    Object.entries(this.actions).map(([_, actionState]) => {
      const actionIsLocked = actionState.status === ActionStatusKey.Locked
      const actionPrerequisites = actionState.spec.prerequisites ?? [
        UnlockKey.IntroductionFinished,
      ]
      if (actionIsLocked && this.passesPrerequisites(actionPrerequisites)) {
        actionState.status = ActionStatusKey.Unlocked
      }
    })
    // Play lore chapters if any:
    Object.entries(this.loreEngine.chapters).map(([_, chapterEntry]) => {
      if (this.passesPrerequisites(chapterEntry.unlockPrerequisites ?? []))
        this.loreEngine.playChapter(chapterEntry.id)
    })

    // Finally, render everything in gameLogicUI:
    this.gameLogicUI.map((func) =>
      func({
        actions: this.actions,
        unlocks: Array.from(this.unlocks),
        resources: this.resources,
      }),
    )

    console.log(this.unlocks)
  }

  private passesPrerequisites(prerequisites: UnlockId[]): boolean {
    return !prerequisites.some((p) => !this.unlocks.has(p))
  }

  private affordCost(cost: Cost[]): boolean {
    return cost.every((c) => this.resources[c.currency].amount >= c.value)
  }

  private deductCost(cost: Cost[]): void {
    cost.forEach((c) => {
      this.resources[c.currency].amount -= c.value
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
      })
    }

    // Update ActionState
    if (!spec.repeatable) {
      state.status = ActionStatusKey.Completed
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

        // For now, set to an if-else:
        const getLayout = (key: MetricsScreenId) => {
          const container = document.createElement("div")
          if (key === MetricsScreenKey.Storage) {
            Object.entries(this.resources).map(([_resKey, resState]) => {
              const resKey = _resKey as CurrencyId

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
                progressLabel.innerHTML = `${_resState.amount} / ${_resState.cap} ${_resState.spec.unit}`
                progressBar.style.width = `${(100.0 * _resState.amount) / _resState.cap}%`
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
    // Render individual actions
    Object.entries(this.actions).map(([actionId, actionState]) => {
      // -- Add newly unlocked actions
      if (
        actionState.status === ActionStatusKey.Unlocked &&
        !actionState.element
      ) {
        const { card: actionsCard, body: actionsCardBody } = createCard(
          actionState.spec.displayTitle,
          actionState.spec.flavorText,
        )

        const costText = actionState.spec.cost
          .map((c) => `${c.value} ${c.currency}`)
          .join(", ")

        const buyButton = createButton(`Execute (${costText})`, () =>
          this.performAction(Number(actionId) as ActionId),
        )

        actionsCardBody.appendChild(buyButton)

        actionsCard.id = `action-${actionId}`

        this.actionsContainer.append(actionsCard)
        actionState.element = actionsCard
      }
    })
  }

  private setActiveContainer(menuBarId: MenuBarId) {
    const MENU_BAR_MAP: Record<MenuBarId, HTMLElement> = {
      [MenuBarKey.Actions]: this.actionsContainer,
      [MenuBarKey.Settings]: this.actionsContainer,
    }

    this.primaryContainer.innerHTML = ""
    this.primaryContainer.appendChild(MENU_BAR_MAP[menuBarId])
  }

  private renderLoop() {
    // Render actions container if unlocked
    this.renderMenuBar()
    // Render metrics
    this.renderMetricsScreen()

    // Only selective render what's shown
    switch (this.currentMenuBar) {
      case MenuBarKey.Actions:
        this.renderActionsScreen()
        break
    }

    requestAnimationFrame(() => this.renderLoop())
  }
}
