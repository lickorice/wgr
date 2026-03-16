export function createCard(title: string, flavorText?: string) {
  const card = document.createElement("div")
  const cardBody = document.createElement("div")
  const titleEl = document.createElement("h5")

  // Action-specific card class for targeted styling
  card.className = "card mb-2 action-card"
  cardBody.className = "card-body"
  // Use a compact heading suitable for small screens
  titleEl.className = "card-title h6"
  titleEl.innerHTML = title

  cardBody.appendChild(titleEl)

  if (flavorText) {
    const flavor = document.createElement("div")
    // subtle, compact flavor text
    flavor.className = "card-text text-muted small"
    flavor.innerHTML = flavorText
    cardBody.appendChild(flavor)
  }

  card.appendChild(cardBody)

  return { card, body: cardBody, titleEl }
}

export function createButton(
  text: string,
  onClick?: () => void,
  className?: string,
) {
  const btn = document.createElement("button")
  btn.innerText = text
  // Default consistent button styling; callers can override via className
  btn.className = className ?? "btn btn-sm btn-outline-light"
  if (onClick) btn.onclick = onClick
  return btn
}

import type { Cost } from "@game/types/resources"

export function createAffordableButton(
  cost: Cost[],
  affordCheck: () => boolean,
  onClick?: () => void,
  className?: string,
) {
  const btn = createButton(``, onClick, className)

  const update = () => {
    const afforded = affordCheck();
    (btn as HTMLButtonElement).disabled = !afforded
    if (!afforded) btn.classList.add("disabled")
    else btn.classList.remove("disabled")
  }

  if (!btn.innerText) {
    try {
      const costText = cost.map((c) => `${c.value} ${c.id}`).join(", ")
      btn.innerText = costText ? `Execute (${costText})` : "Execute"
    } catch {
      btn.innerText = "Execute"
    }
  }

  update()

  return { button: btn, update }
}

export function createProgress() {
  const container = document.createElement("div")
  container.className = "progress position-relative"

  const progressBar = document.createElement("div")
  progressBar.className = "progress-bar bg-success"
  progressBar.setAttribute("role", "progressbar")

  const progressLabel = document.createElement("small")
  progressLabel.className =
    "justify-content-center d-flex position-absolute w-100"

  container.appendChild(progressBar)
  container.appendChild(progressLabel)

  return { container, progressBar, progressLabel }
}

// Input helpers to keep settings UI consistent
export function createTextInput(initial = "") {
  const wrapper = document.createElement("div")
  wrapper.className = "form-group"

  const input = document.createElement("input")
  input.type = "text"
  input.className = "form-control form-control-sm"
  input.value = String(initial)

  wrapper.appendChild(input)

  return { container: wrapper, input }
}

export function createNumberInput(initial = 0) {
  const wrapper = document.createElement("div")
  wrapper.className = "form-group"

  const input = document.createElement("input")
  input.type = "number"
  input.className = "form-control form-control-sm"
  input.value = String(initial)
  input.setAttribute("step", "any")

  wrapper.appendChild(input)

  return { container: wrapper, input }
}

export function createToggle(initial = false) {
  const wrapper = document.createElement("div")
  wrapper.className = "form-check form-switch"

  const input = document.createElement("input")
  input.type = "checkbox"
  input.className = "form-check-input"
  input.checked = Boolean(initial)

  const label = document.createElement("label")
  label.className = "form-check-label small"
  label.style.marginLeft = "0.5rem"

  wrapper.appendChild(input)
  wrapper.appendChild(label)

  return { container: wrapper, input, label }
}
