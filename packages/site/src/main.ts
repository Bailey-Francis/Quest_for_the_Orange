import { Client, type Room } from "colyseus.js";
import "./style.css";

interface PlayerState {
  x: number;
  y: number;
  color: string;
}

interface GameStateLike {
  players: {
    values(): IterableIterator<PlayerState>;
  };
}

const BOX_SIZE = 24;

const canvas = document.querySelector<HTMLCanvasElement>("#stage");
if (!canvas) throw new Error("canvas #stage not found");
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("2d context unavailable");

let state: GameStateLike | null = null;

function draw() {
  if (!ctx || !canvas) return;
  ctx.fillStyle = "#222";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (state?.players) {
    for (const p of state.players.values()) {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, BOX_SIZE, BOX_SIZE);
    }
  }
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

const client = new Client(`ws://${window.location.hostname}:2567`);

client
  .joinOrCreate<GameStateLike>("box")
  .then((room: Room<GameStateLike>) => {
    state = room.state;

    const keys = { w: false, a: false, s: false, d: false };
    let lastX = 0;
    let lastY = 0;

    const syncInput = () => {
      const x = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
      const y = (keys.s ? 1 : 0) - (keys.w ? 1 : 0);
      if (x === lastX && y === lastY) return;
      lastX = x;
      lastY = y;
      room.send("input", { x, y });
    };

    const setKey = (k: string, down: boolean) => {
      if (k === "w" || k === "a" || k === "s" || k === "d") {
        keys[k] = down;
        syncInput();
      }
    };

    window.addEventListener("keydown", (e) => setKey(e.key.toLowerCase(), true));
    window.addEventListener("keyup", (e) => setKey(e.key.toLowerCase(), false));
  })
  .catch((err) => {
    console.error("failed to join room", err);
  });
