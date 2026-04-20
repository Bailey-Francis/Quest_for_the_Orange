import { WebSocketTransport } from "@colyseus/ws-transport";
import { Server } from "colyseus";
import { BoxRoom } from "./rooms/BoxRoom.js";

const port = Number(process.env.PORT ?? 2567);

const gameServer = new Server({
  transport: new WebSocketTransport(),
});

gameServer.define("box", BoxRoom);

gameServer.listen(port).then(() => {
  console.log(`Colyseus listening on ws://localhost:${port}`);
});
