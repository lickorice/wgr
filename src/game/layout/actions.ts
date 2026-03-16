import { createCard, createAffordableButton } from "@game/layout/util"
import type { ActionId, ActionState } from "@game/types/actions"
import { ContentStatusKey } from "@game/types/shared"
import type { SettingsId, GameSettingState } from "@game/types/settings"
import type { GameSnapshot } from "@game/engine/game_engine"
import type { Cost } from "@game/types/resources"

type Helpers = {
  getActions: () => Record<ActionId, ActionState>;
  getGameSettings: () => Record<SettingsId, GameSettingState>;
  affordCost: (cost: Cost[]) => boolean;
  performAction: (id: ActionId) => void;
  registerUpdater: (fn: (snapshot: GameSnapshot) => void) => void;
};

/**
 * Attach the actions panel to the provided container.
 * This function is idempotent — it will only build the UI once per container
 * and will only rebuild the action list when the unlocked/changed snapshot differs.
 */
export function attachActionsUI(container: HTMLElement, helpers: Helpers) {
  let panel = container.querySelector("#actions-panel") as HTMLElement | null
  const shouldCreate = !panel

  if (shouldCreate) {
    panel = document.createElement("div")
    panel.id = "actions-panel"
    panel.dataset.actionsSnapshot = ""
    container.appendChild(panel)
  }

  const panelEl = panel as HTMLElement

  let actionsList = panelEl.querySelector(
    "#actions-list",
  ) as HTMLElement | null
  if (!actionsList) {
    actionsList = document.createElement("div")
    actionsList.id = "actions-list"
    panelEl.appendChild(actionsList)
  }

  const buildActionsList = () => {
    actionsList!.innerHTML = ""
    const actions = helpers.getActions()
    const gameSettings = helpers.getGameSettings()

    let unlockedCount = 0
    Object.entries(actions).forEach(([actionId, actionState]) => {
      if (actionState.status === ContentStatusKey.Unlocked) {
        unlockedCount++

        if (!actionState.element) {
          const { card: actionsCard, body: actionsCardBody } = createCard(
            actionState.spec.displayTitle,
            actionState.spec.flavorText,
            gameSettings.UseSansSerifDescriptions?.value as boolean,
          )

          const costText = actionState.spec.cost
            .map((c) => `${c.value} ${c.id}`)
            .join(", ")

          const { button: buyButton, update: updateAffordability } =
            createAffordableButton(
              actionState.spec.cost,
              () => helpers.affordCost(actionState.spec.cost),
              () => helpers.performAction(Number(actionId) as ActionId),
              "btn btn-sm btn-primary",
            )

          buyButton.innerText = `Execute (${costText})`

          // Register an updater so the button state refreshes during ticks
          helpers.registerUpdater((_snapshot: GameSnapshot) =>
            updateAffordability(),
          )

          const controls = document.createElement("div")
          controls.className =
            "action-card-controls d-flex justify-content-end mt-2"
          controls.appendChild(buyButton)

          actionsCardBody.appendChild(controls)

          actionsCard.id = `action-${actionId}`

          actionsList!.appendChild(actionsCard)
          actionState.element = actionsCard
        } else {
          // If element already exists, ensure it's appended to the list
          actionsList!.appendChild(actionState.element)
        }
      }
    })

    const existingPlaceholder = panelEl.querySelector("#actions-empty")
    if (unlockedCount === 0) {
      if (!existingPlaceholder) {
        const placeholder = document.createElement("div")
        placeholder.id = "actions-empty"
        placeholder.className = "text-muted small p-2"
        placeholder.innerText = "No actions are currently doable."
        if (gameSettings.UseSansSerifDescriptions?.value) {
          placeholder.classList.add("sans-serif")
        }
        actionsList!.appendChild(placeholder)
      }
    } else if (existingPlaceholder) {
      existingPlaceholder.remove()
    }
  }

  const computeSnapshot = () => {
    const actions = helpers.getActions()
    try {
      return JSON.stringify(
        Object.entries(actions).map(([id, s]) => ({
          id,
          status: s.status,
          boughtCount: s.boughtCount ?? 0,
        })),
      )
    } catch {
      return String(Object.keys(helpers.getActions()).length)
    }
  }

  const newSnapshot = computeSnapshot()
  if (panelEl.dataset.actionsSnapshot !== newSnapshot) {
    panelEl.dataset.actionsSnapshot = newSnapshot
    buildActionsList()
  }

  // No global controls for actions are created here. The function is idempotent
}
