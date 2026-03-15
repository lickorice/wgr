export function createCard(title: string, flavorText?: string) {
  const card = document.createElement("div")
  const cardBody = document.createElement("div")
  const titleEl = document.createElement("h5")

  card.className = "card"
  cardBody.className = "card-body"
  titleEl.className = "card-title"
  titleEl.innerHTML = title

  cardBody.appendChild(titleEl)

  if (flavorText) {
    const flavor = document.createElement("div")
    flavor.className = "card-text"
    flavor.innerHTML = flavorText
    cardBody.appendChild(flavor)
  }

  card.appendChild(cardBody)

  return { card, body: cardBody, titleEl }
}

export function createButton(text: string, onClick?: () => void) {
  const btn = document.createElement("button")
  btn.innerText = text
  if (onClick) btn.onclick = onClick
  return btn
}

export function createProgress() {
  const container = document.createElement("div")
  container.className = "progress position-relative"

  const progressBar = document.createElement("div")
  progressBar.className = "progress-bar"
  progressBar.setAttribute("role", "progressbar")

  const progressLabel = document.createElement("small")
  progressLabel.className =
    "justify-content-center d-flex position-absolute w-100"

  container.appendChild(progressBar)
  container.appendChild(progressLabel)

  return { container, progressBar, progressLabel }
}
