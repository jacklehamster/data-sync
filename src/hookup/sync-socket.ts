import Websocket from "ws";

/**
 * Data format:
 * 
 * Client message
 * {
 *  updates: [
 *   [key: string, value: any]
 *  ],
 */

interface State {
  data: Record<string, any>;
  timestamp: number;
}

export class SyncSocket {
  private sockets: Set<WebSocket> = new Set();
  private states: Record<string, State> = {};

  constructor(private server: Websocket.Server<any>) {
  }

  processPayload(payload: any) {
    if (typeof payload !== "object") {
      return;
    }
    try {
      if (payload.id) {
        const state = this.states[payload.id];
        if (state) {
          Object.entries(payload).forEach(([key, value]) => {
            state.data[key] = value;
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  broadcast(payloads: any[]) {
    this.sockets.forEach((client) => {
      client.send(JSON.stringify(payloads));
    });
  }

  async transformMessage(data: any) {
    let message: any;

    if (data instanceof Buffer) {
      message = (data.toString());
    } else if (data instanceof ArrayBuffer) {
      message = (Buffer.from(data).toString());
    } else if (data instanceof Blob) {
      const text = await data.text();
      message = (text);
    } else {
      throw new Error("Unsupported data type");
    }
    try {
      return JSON.parse(message);
    } catch (e) {
      console.log(e);
      return message;
    }
  }

  addSocketRoute() {
    this.server.on("connection", (socket: WebSocket) => {
      this.sockets.add(socket);
      socket.on("message", async (message: any) => {
        const payload = await this.transformMessage(message);
        this.processPayload(payload);
        this.broadcast([payload]);
      });

      socket.on("close", () => {
        this.sockets.delete(socket);
        console.log("client disconnected");
      });

      //  update self with states
      socket.send(JSON.stringify(this.states));
    });
  }
}
