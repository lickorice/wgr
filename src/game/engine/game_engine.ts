import { LoreEngine } from "@game/lore/lore_engine"
import { UnlockKey, type UnlockId } from "@game/types/unlocks"

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
  effect?: () => void;
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
  private menuBar: HTMLElement
  private actionsContainer: HTMLElement
  // private activeProgress: Map<ActionId, number> = new Map(); // Tracks 0-100% for bars

  private loreEngine: LoreEngine

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
        cap: 100,
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
    this.menuBar = document.createElement("div")
    this.menuBar.id = "menu-bar"
    this.container.appendChild(this.menuBar)
    this.actionsContainer = document.createElement("div")
    this.actionsContainer.id = "actions-container"
    this.container.appendChild(this.actionsContainer)

    // Sub-engine init:
    this.loreEngine = new LoreEngine("terminal-container", (u: UnlockId) => {
      this.unlocks.add(u)
    })
  }

  public start() {
    this.loreEngine.playChapter(0).then(() => {
      console.log("fin")
    })

    setInterval(() => this.doTick(), 1000)

    requestAnimationFrame(() => this.renderLoop())
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

    console.log(this.actions)
  }

  private passesPrerequisites(prerequisites: UnlockId[]): boolean {
    return !prerequisites.some((p) => !this.unlocks.has(p))
  }

  private renderLoop() {
    // Render actions container if unlocked
    if (this.passesPrerequisites([UnlockKey.ActionsUI])) {
      this.menuBar.innerHTML = "ACTIONS"
    }
    // Render individual actions
    Object.entries(this.actions).map(([actionId, actionState]) => {
      // -- Add newly unlocked actions
      if (
        actionState.status === ActionStatusKey.Unlocked &&
        !actionState.element
      ) {
        const actionsCard = document.createElement("div")
        const actionsTitle = document.createElement("div")
        actionsTitle.innerHTML = actionState.spec.displayTitle
        actionsCard.appendChild(actionsTitle)

        if (actionState.spec.flavorText) {
          const actionsFlavorText = document.createElement("div")
          actionsFlavorText.innerHTML = actionState.spec.flavorText
          actionsCard.appendChild(actionsFlavorText)
        }

        actionsCard.id = `action-${actionId}`

        this.actionsContainer.append(actionsCard)
        actionState.element = actionsCard
      }
    })

    requestAnimationFrame(() => this.renderLoop())
  }
}
