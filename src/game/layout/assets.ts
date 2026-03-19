import { ContentStatusKey } from "@game/types/shared"
import type { GeneratorId } from "@game/types/generators"
import type { GameEngineHelper } from "@game/types/shared"

function createCard() {
  const card = document.createElement("div")
  const cardBody = document.createElement("div")
  const row = document.createElement("div")

  // Action-specific card class for targeted styling
  card.className = "card mb-2 action-card border-light"
  cardBody.className = "card-body"
  cardBody.style.width = "97%"
  row.className = "row g-0"
  // Use a compact heading suitable for small screens

  row.appendChild(cardBody)
  card.appendChild(row)

  return { card, cardRow: row, body: cardBody }
}

export function attachAssetsUI(
  container: HTMLElement,
  helpers: GameEngineHelper,
) {
  const getConstructionCost = (genId: GeneratorId) => {
    const generator = helpers.getGenerators()[genId]
    const defaultAmount = generator.spec.defaultAmount ?? 0
    return generator.spec.baseCost.map((cost) => ({
      id: cost.id,
      value:
        cost.value *
        generator.spec.growthFactor ** (generator.amount - defaultAmount),
    }))
  }

  const formatCosts = (
    costs: Array<{
      id: string;
      value: number;
    }>,
  ) =>
    costs
      .map((cost) => `${Number(cost.value.toFixed(2))} ${cost.id}`)
      .join(", ")

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

  const buildList = () => {
    list!.innerHTML = ""
    const gens = helpers.getGenerators()
    const gameSettings = helpers.getGameSettings()

    let unlockedCount = 0
    Object.entries(gens).forEach(([genIdRaw, genState]) => {
      const genId = genIdRaw as GeneratorId
      if (genState.status !== ContentStatusKey.Locked) {
        unlockedCount++

        if (!genState.element) {
          const { card, cardRow, body } = createCard()

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
          costEl.innerText = `Next cost: ${formatCosts(getConstructionCost(genId))}`

          const amountEl = document.createElement("div")
          amountEl.className = "small"

          const constructButton = document.createElement("button")
          constructButton.type = "button"
          constructButton.className = "btn btn-sm btn-primary mt-2"
          constructButton.innerText = "Construct 1"
          constructButton.onclick = () => {
            const nextCost = getConstructionCost(genId)
            if (!helpers.affordCost(nextCost)) return
            helpers.deductCost(nextCost)
            helpers.getGenerators()[genId].amount += 1
          }

          const controlsEl = document.createElement("div")
          controlsEl.className =
            "col-1 flex-column d-flex justify-content-center slim-control"
          controlsEl.style.width = "3%"
          const toggledElLabel = document.createElement("span")
          const togglePlusButton = document.createElement("button")
          const toggleMinusButton = document.createElement("button")
          const toggledElProgWrapper = document.createElement("div")
          const toggledElProgBar = document.createElement("div")
          if (genState.spec.toggleable) {
            toggleMinusButton.type = "button"
            toggleMinusButton.className = "btn btn-sm btn-danger p-0 rounded-0"
            toggleMinusButton.innerText = `-`
            toggleMinusButton.style.height = "20%"
            toggleMinusButton.onclick = () => {
              const liveGen = helpers.getGenerators()[genId]
              liveGen.toggled = Math.max(0, liveGen.toggled ?? 0)
              liveGen.toggled = Math.max(0, (liveGen.toggled ?? 0) - 1)
            }

            togglePlusButton.type = "button"
            togglePlusButton.className = "btn btn-sm btn-success p-0 rounded-0"
            togglePlusButton.innerText = `+`
            togglePlusButton.style.height = "20%"
            togglePlusButton.onclick = () => {
              const liveGen = helpers.getGenerators()[genId]
              const currentToggled = Math.max(0, liveGen.toggled ?? 0)
              liveGen.toggled = Math.min(liveGen.amount, currentToggled + 1)
            }

            const toggledEl = document.createElement("div")
            toggledEl.className = "middle-section"
            toggledElLabel.className = "rotated-text px-3"
            toggledEl.appendChild(toggledElLabel)
            toggledElProgWrapper.className = "progress progress-vertical"
            toggledElProgBar.className = "progress-bar toggle-progress"
            toggledElProgBar.role = "progressbar"
            toggledElProgWrapper.appendChild(toggledElProgBar)
            toggledEl.appendChild(toggledElProgWrapper)

            controlsEl.appendChild(togglePlusButton)
            controlsEl.appendChild(toggledEl)
            controlsEl.appendChild(toggleMinusButton)
          }

          const syncAssetState = () => {
            const liveGen = helpers.getGenerators()[genId]
            const nextCost = getConstructionCost(genId)
            amountEl.innerText = `Constructed: ${liveGen.amount}`
            costEl.innerText = `Next cost: ${formatCosts(nextCost)}`
            constructButton.disabled = !helpers.affordCost(nextCost)

            if (liveGen.spec.toggleable) {
              const currentToggled = Math.min(
                liveGen.amount,
                Math.max(0, liveGen.toggled ?? 0),
              )
              toggledElLabel.innerText = `${currentToggled}/${liveGen.amount}`

              toggleMinusButton.disabled = (liveGen.toggled ?? 0) <= 0

              togglePlusButton.disabled =
                (liveGen.toggled ?? 0) >= liveGen.amount

              const progressRatio = (liveGen.toggled ?? 0) / liveGen.amount
              console.log(progressRatio)
              toggledElProgBar.style.height = `${progressRatio * 100}%`
            }
          }

          // Efficiency display
          const effEl = document.createElement("div")
          effEl.className = "small mt-2"
          effEl.innerText = `Efficiency: ${(genState.efficiency * 100).toFixed(
            1,
          )}%`

          // Layout: left column for info, right column for interactions
          const row = document.createElement("div")
          // Use bootstrap flex utilities to separate left/right sections
          row.className =
            "d-flex align-items-start justify-content-between gap-3"

          const leftCol = document.createElement("div")

          const titleEl = document.createElement("h5")
          titleEl.className = "card-title h6"
          titleEl.innerHTML = genState.spec.longName
          leftCol.appendChild(titleEl)

          if (genState.spec.flavorText) {
            const flavor = document.createElement("div")
            // subtle, compact flavor text
            flavor.className = "card-text text-muted small"
            if (helpers.getGameSettings().UseSansSerifDescriptions.value) {
              flavor.classList.add("sans-serif")
            }
            flavor.innerHTML = genState.spec.flavorText
            leftCol.appendChild(flavor)
          }

          if (genState.spec.metaText) {
            const meta = document.createElement("div")
            // subtle, compact meta text
            meta.className = "card-text tag-meta small"
            if (helpers.getGameSettings().UseSansSerifDescriptions.value) {
              meta.classList.add("sans-serif")
            }
            meta.innerHTML = genState.spec.metaText
            leftCol.appendChild(meta)
          }
          if (genState.spec.baseConsumePerSec) {
            const consumeEl = document.createElement("div")
            consumeEl.className = "tag-_err small"
            try {
              const consumes = genState.spec.baseConsumePerSec
                .map((g) => `${g.value} ${g.id}`)
                .join(", ")
              consumeEl.innerText = `Consumes/sec: ${consumes}`
            } catch {
              consumeEl.innerText = "Consumes/sec: -"
            }
            leftCol.appendChild(consumeEl)
          }

          const rightCol = document.createElement("div")
          // Keep controls stacked and aligned to the end (right)
          rightCol.className = "d-flex w-100 flex-column align-items-end"
          rightCol.appendChild(gainEl)
          rightCol.appendChild(costEl)
          rightCol.appendChild(amountEl)
          rightCol.appendChild(effEl)
          rightCol.appendChild(constructButton)

          row.appendChild(leftCol)
          row.appendChild(rightCol)

          body.appendChild(row)

          syncAssetState()

          card.id = `asset-${genId}`
          card.classList.toggle(
            "new-item",
            genState.status === ContentStatusKey.New,
          )

          if (genState.spec.toggleable) {
            cardRow.appendChild(controlsEl)
          }

          genState.element = card
          list!.appendChild(card)

          // Register an updater so we refresh efficiency (or other live fields)
          helpers.registerFastUpdater(() => {
            try {
              const liveGen = helpers.getGenerators()[genId]
              effEl.innerText = `Efficiency: ${(liveGen.efficiency * 100).toFixed(1)}%`
              syncAssetState()
            } catch {
              // ignore
            }
          })
        } else {
          // ensure cached element present in list
          genState.element.classList.toggle(
            "new-item",
            genState.status === ContentStatusKey.New,
          )
          list!.appendChild(genState.element)
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
