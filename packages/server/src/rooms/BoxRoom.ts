import { MapSchema, Schema, type } from "@colyseus/schema";
import { type Client, Room } from "colyseus";

const WORLD_SIZE = 480;
const BOX_SIZE = 24;
const MAX_POS = WORLD_SIZE - BOX_SIZE;
const SPEED = 200;

export class Player extends Schema {
  @type("number") x = 0;
  @type("number") y = 0;
  @type("string") color = "#ffffff";
  inputX = 0;
  inputY = 0;
}

export class GameState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}

function randomColor(): string {
  const hex = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, "0");
  return `#${hex}`;
}

export class BoxRoom extends Room<GameState> {
  override onCreate() {
    this.state = new GameState();

    this.onMessage("input", (client, message: { x: number; y: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      player.inputX = Math.sign(message.x);
      player.inputY = Math.sign(message.y);
    });

    this.setSimulationInterval((dt) => this.tick(dt), 1000 / 20);
  }

  tick(deltaMs: number) {
    const dt = deltaMs / 1000;
    for (const p of this.state.players.values()) {
      if (p.inputX === 0 && p.inputY === 0) continue;
      const nx = p.x + p.inputX * SPEED * dt;
      const ny = p.y + p.inputY * SPEED * dt;
      p.x = Math.max(0, Math.min(MAX_POS, nx));
      p.y = Math.max(0, Math.min(MAX_POS, ny));
    }
  }

  override onJoin(client: Client) {
    const p = new Player();
    p.x = Math.random() * MAX_POS;
    p.y = Math.random() * MAX_POS;
    p.color = randomColor();
    this.state.players.set(client.sessionId, p);
    console.log(`${client.sessionId} joined`);
  }

  override onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
    console.log(`${client.sessionId} left`);
  }
}
