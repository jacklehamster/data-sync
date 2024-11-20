import { SyncSocket } from "data-sync";
import { createServer } from "http";
import express from "express";
import Websocket from "ws";
import path from "path";

const app = express();
const PORT = 3000;

const server = createServer(app);

const wss: Websocket.Server<typeof Websocket.WebSocket> = new Websocket.Server({ server });

const syncSocket = new SyncSocket(wss);
syncSocket.addSocketRoute();

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

server.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
