import "./styles/main.scss"
import { GameEngine } from "@game/engine/game_engine"
import { BUILD_VERSION, LAST_UPDATED_ISO } from "@src/build_info"

const engine = new GameEngine("app")
engine.start()

// Populate footer version and last-updated fields if present
try {
  const verEl = document.getElementById("site-version")
  const updatedEl = document.getElementById("site-last-updated")
  if (verEl) verEl.textContent = BUILD_VERSION
  if (updatedEl) {
    const iso =
      typeof LAST_UPDATED_ISO === "string" ? LAST_UPDATED_ISO : undefined
    if (iso) {
      updatedEl.textContent = new Date(iso).toLocaleDateString()
    } else {
      updatedEl.textContent = new Date().toLocaleDateString()
    }
  }
} catch (_e) {
  // No-op: footer is optional and shouldn't break the app if DOM isn't ready.
}
