import { createButton } from "@game/layout/util"
import { ChapterKey, type ChapterId } from "@game/types/lore"

type Helpers = {
  exportSave: () => string;
  importSave: (s: string) => void;
  doAutosave: () => void;
  playChapter: (id: ChapterId) => void;
};

/**
 * Attach the settings panel to the provided container.
 * This function is idempotent — it will only build the UI once per container.
 */
export function attachSettingsUI(container: HTMLElement, helpers: Helpers) {
  if (container.querySelector("#settings-panel")) return

  const panel = document.createElement("div")
  panel.id = "settings-panel"

  // Export button: copy save to clipboard, fallback to prompt
  const exportButton = createButton("Export Save", async () => {
    const saveStr = helpers.exportSave()
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(saveStr)
        alert("Save copied to clipboard.")
      } catch {
        // Fallback to prompt if clipboard fails
        window.prompt("Copy this save string:", saveStr)
      }
    } else {
      window.prompt("Copy this save string:", saveStr)
    }
  })

  // Import button: prompt for string, confirm, then import
  const importButton = createButton("Import Save", () => {
    const input = window.prompt("Paste a save string to import:")
    if (!input) return
    const ok = window.confirm(
      "Importing will overwrite your current progress. Continue?",
    )
    if (!ok) return
    try {
      helpers.importSave(input)
      alert("Import successful. UI will refresh to reflect imported state.")
    } catch (e) {
      alert("Failed to import save. Check the string and try again.")
      console.error(e)
    }
  })

  // Manual save: call autosave routine
  const manualSaveButton = createButton("Manual Save", () => {
    helpers.doAutosave()
    helpers.playChapter(ChapterKey.ManualSave)
  })

  // Reset save: confirmation then clear and reload
  const resetButton = createButton("Reset Save", () => {
    const ok = window.confirm(
      "This will reset your save and reload the page. This cannot be undone. Proceed?",
    )
    if (!ok) return
    localStorage.removeItem("gameState")
    // Reload to reset in-memory state
    location.reload()
  })

  // Small layout
  const row = document.createElement("div")
  row.className = "d-flex gap-2 flex-column"
  row.appendChild(exportButton)
  row.appendChild(importButton)
  row.appendChild(manualSaveButton)
  row.appendChild(resetButton)

  panel.appendChild(row)
  container.appendChild(panel)
}
