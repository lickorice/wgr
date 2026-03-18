import { createCard } from "@game/layout/util"
import { ContentStatusKey } from "@game/types/shared"
import type { GeneratorId } from "@game/types/generators"
import type { GameEngineHelper } from "@game/types/shared"

export function attachAssetsUI(
  container: HTMLElement,
  helpers: GameEngineHelper,
) {
  let panel = container.querySelector("#assets-panel") as HTMLElement | null
  const shouldCreate = !panel

  if (shouldCreate) {
    panel = document.createElement("div")
    panel.id = "assets-panel"
    panel.dataset.assetsSnapshot = ""
    container.appendChild(panel)
  }

  const panelEl = panel as HTMLElement

  let list = panelEl.querySelector("#assets-list") as HTMLElement | null
  if (!list) {
    list = document.createElement("div")
    list.id = "assets-list"
    panelEl.appendChild(list)
  }

  const elementCache: Map<GeneratorId, HTMLElement> = new Map()

  const buildList = () => {
    list!.innerHTML = ""
    const gens = helpers.getGenerators()
    const gameSettings = helpers.getGameSettings()

    let unlockedCount = 0
    Object.entries(gens).forEach(([genIdRaw, genState]) => {
      const genId = genIdRaw as GeneratorId
      if (genState.status !== ContentStatusKey.Locked) {
        unlockedCount++

        if (!elementCache.has(genId)) {
          const { card, body } = createCard(
            genState.spec.longName,
            genState.spec.flavorText,
            gameSettings.PlayMetaMessages.value
              ? genState.spec.metaText
              : undefined,
            gameSettings.UseSansSerifDescriptions?.value as boolean,
          )

          // Base gain per second
          const gainEl = document.createElement("div")
          gainEl.className = "text-muted small"
          try {
            const gains = genState.spec.baseGainPerSec
              .map((g) => `${g.value} ${g.id}`)
              .join(", ")
            gainEl.innerText = `Base gain/sec: ${gains}`
          } catch {
            gainEl.innerText = "Base gain/sec: -"
          }

          // Base cost
          const costEl = document.createElement("div")
          costEl.className = "text-muted small"
          try {
            const costs = genState.spec.baseCost
              .map((c) => `${c.value} ${c.id}`)
              .join(", ")
            costEl.innerText = `Cost: ${costs}`
          } catch {
            costEl.innerText = "Cost: -"
          }

          // Efficiency display
          const effEl = document.createElement("div")
          effEl.className = "small mt-2"
          effEl.innerText = `Efficiency: ${(genState.efficiency * 100).toFixed(
            1,
          )}%`

          body.appendChild(gainEl)
          body.appendChild(costEl)
          body.appendChild(effEl)

          card.id = `asset-${genId}`
          card.classList.toggle(
            "new-item",
            genState.status === ContentStatusKey.New,
          )

          list!.appendChild(card)
          elementCache.set(genId, card)

          // Register an updater so we refresh efficiency (or other live fields)
          helpers.registerUpdater(() => {
            try {
              const liveGen = helpers.getGenerators()[genId]
              effEl.innerText = `Efficiency: ${(liveGen.efficiency * 100).toFixed(1)}%`
            } catch {
              // ignore
            }
          })
        } else {
          // ensure cached element present in list
          const existingCard = elementCache.get(genId) as HTMLElement
          existingCard.classList.toggle(
            "new-item",
            genState.status === ContentStatusKey.New,
          )
          list!.appendChild(existingCard)
        }
      }
    })

    const existingPlaceholder = panelEl.querySelector("#assets-empty")
    if (unlockedCount === 0) {
      if (!existingPlaceholder) {
        const placeholder = document.createElement("div")
        placeholder.id = "assets-empty"
        placeholder.className = "text-muted small p-2"
        placeholder.innerText = "No assets are unlocked yet."
        if (gameSettings.UseSansSerifDescriptions?.value) {
          placeholder.classList.add("sans-serif")
        }
        list!.appendChild(placeholder)
      }
    } else if (existingPlaceholder) {
      existingPlaceholder.remove()
    }
  }

  const computeSnapshot = () => {
    const gens = helpers.getGenerators()
    try {
      return JSON.stringify(
        Object.entries(gens).map(([id, s]) => ({ id, status: s.status })),
      )
    } catch {
      return String(Object.keys(helpers.getGenerators()).length)
    }
  }

  const newSnapshot = computeSnapshot()
  if (panelEl.dataset.assetsSnapshot !== newSnapshot) {
    panelEl.dataset.assetsSnapshot = newSnapshot
    buildList()
  }
}
