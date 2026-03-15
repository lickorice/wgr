import "./styles/main.scss"
// import { LoreEngine } from "./game/lore/lore_engine"
import { GameEngine } from "@game/engine/game_engine"

// const loreEngine = new LoreEngine("terminal-container")
// loreEngine.playChapter(0).then(() => {
//   console.log("fin")
// })

const engine = new GameEngine("app")
engine.start()
