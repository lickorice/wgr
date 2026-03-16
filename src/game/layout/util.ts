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
