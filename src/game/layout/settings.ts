import {
  createButton,
  createTextInput,
  createNumberInput,
  createToggle,
} from "@game/layout/util"
import { ChapterKey, type ChapterId } from "@game/types/lore"
import {
  SettingsKey,
  type SettingsId,
  type GameSetting,
  type GameSettingState,
} from "@game/types/settings"
import { ContentStatusKey } from "@game/types/shared"

export const ALL_SETTINGS: Record<SettingsId, GameSetting> = {
  [SettingsKey.PlayMetaMessages]: {
    id: SettingsKey.PlayMetaMessages,
    defaultValue: false,
    type: "boolean",
    longName: "Show all META messages",
    helperText:
      "Blue messages (in terminal, with the META tag) are 'immersion-breaking' messages set by the developer. These include messages such as 'Game autosaved', and also developer commentary on lore pieces, in case the prose feels too thick. May take a page refresh for it to fully take effect.",
  },
  [SettingsKey.PlayAutosaveMessages]: {
    id: SettingsKey.PlayAutosaveMessages,
    defaultValue: false,
    type: "boolean",
    longName: "Play autosave messages in terminal",
    helperText:
      "Plays lore-accurate autosave messages in the terminal. May bunch up in the terminal queue, which may break (or improve) your immersion.",
  },
  [SettingsKey.AutosaveInterval]: {
    id: SettingsKey.AutosaveInterval,
    defaultValue: 30,
    type: "number",
    longName: "Autosave interval (in secs)",
    helperText:
      "Self explanatory. Set to an impossibly high number to virtually disable auto-saving (Not recommended).",
  },
  [SettingsKey.UseSansSerifDescriptions]: {
    id: SettingsKey.UseSansSerifDescriptions,
    defaultValue: false,
    type: "boolean",
    longName: "Use sans-serif font for descriptions",
    helperText:
      "Use the Roboto sans-serif font for description text. Toggle on if you prefer a cleaner sans-serif look for descriptions. May take a page refresh for it to fully take effect.",
  },
}

type Helpers = {
  exportSave: () => string;
  importSave: (s: string) => void;
  doAutosave: () => void;
  playChapter: (id: ChapterId) => void;
  getGameSettings: () => Record<SettingsId, GameSettingState>;
  setGameSettingValue: (id: SettingsId, value: unknown) => void;
};

/**
 * Attach the settings panel to the provided container.
 * This function is idempotent — it will only build the UI once per container.
 */
export function attachSettingsUI(container: HTMLElement, helpers: Helpers) {
  // If the panel exists, update the settings list only when needed.
  let panel = container.querySelector("#settings-panel") as HTMLElement | null
  const shouldCreate = !panel

  if (shouldCreate) {
    panel = document.createElement("div")
    panel.id = "settings-panel"
    // store a snapshot string to detect changes and avoid unnecessary rerenders
    panel.dataset.settingsSnapshot = ""
    container.appendChild(panel)
  }

  // `panel` is defined above (created or selected). Use a non-null alias for TS.
  const panelEl = panel as HTMLElement

  // Ensure there's a dedicated settings list element inside the panel
  let settingsList = panelEl.querySelector(
    "#settings-list",
  ) as HTMLElement | null
  if (!settingsList) {
    settingsList = document.createElement("div")
    settingsList.id = "settings-list"
    // put it at the top of the panel
    panelEl.appendChild(settingsList)
  }

  // Helper that builds the inner content of settingsList
  const buildSettingsList = () => {
    settingsList!.innerHTML = ""
    const gameSettings = helpers.getGameSettings()
    Object.entries(gameSettings).forEach(([id, state]) => {
      const sId = id as SettingsId
      // Skip locked settings
      if (state.status === ContentStatusKey.Locked) return

      const row = document.createElement("div")
      row.className = "d-flex align-items-center gap-2 mb-2"

      const labelContainer = document.createElement("div")
      labelContainer.className = "flex-grow-1 small"
      const label = document.createElement("h6")
      label.innerText = state.setting.longName
      const description = document.createElement("p")
      description.innerText = state.setting.helperText
      description.className = "text-muted small"
      if (gameSettings.UseSansSerifDescriptions.value) {
        description.classList.add("sans-serif")
      }
      labelContainer.appendChild(label)
      labelContainer.appendChild(description)

      let controlContainer: HTMLElement | null = null

      switch (state.setting.type) {
        case "boolean": {
          const { container: c, input } = createToggle(Boolean(state.value))
          input.onchange = () =>
            helpers.setGameSettingValue(sId, input.checked)
          controlContainer = c
          break
        }
        case "number": {
          const { container: c, input } = createNumberInput(
            Number(state.value ?? 0),
          )
          input.oninput = () => {
            const parsed = Number(input.value)
            helpers.setGameSettingValue(sId, isNaN(parsed) ? 0 : parsed)
          }
          controlContainer = c
          break
        }
        default: {
          // treat as string by default
          const { container: c, input } = createTextInput(
            String(state.value ?? ""),
          )
          input.oninput = () => helpers.setGameSettingValue(sId, input.value)
          controlContainer = c
          break
        }
      }

      row.appendChild(labelContainer)
      if (controlContainer) row.appendChild(controlContainer)
      settingsList!.appendChild(row)
    })
  }

  // Compute a snapshot string for unlocked settings (id + value + status)
  const computeSnapshot = () => {
    const gameSettings = helpers.getGameSettings()
    const arr = Object.entries(gameSettings)
      .filter(([_, s]) => s.status !== ContentStatusKey.Locked)
      .map(([id, s]) => ({ id, value: s.value, status: s.status }))
    try {
      return JSON.stringify(arr)
    } catch {
      return String(arr.length)
    }
  }

  const newSnapshot = computeSnapshot()
  if (panelEl.dataset.settingsSnapshot !== newSnapshot) {
    panelEl.dataset.settingsSnapshot = newSnapshot
    buildSettingsList()
  }

  // Only create and append control buttons once when the panel is first created
  if (shouldCreate) {
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
        helpers.doAutosave()
        alert("Import successful. UI will refresh to reflect imported state.")
        // Reload to reset in-memory state
        location.reload()
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

    // Insert settings list before the other controls
    row.appendChild(exportButton)
    row.appendChild(importButton)
    row.appendChild(manualSaveButton)
    row.appendChild(resetButton)

    panelEl.appendChild(row)
  }
}
