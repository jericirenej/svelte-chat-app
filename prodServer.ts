import { createSocketServer } from "./src/lib/server/socket.global.js";
import { handler } from "./build/handler.js";
import { createServer } from "node:http";
import express from "express";
const app = express();
const server = createServer(app);
app.use(handler);

const port = process.env["ORIGIN"]?.split(":")?.at(-1) ?? 3000;

createSocketServer(server);
server.listen(port, () => {
  console.log("Chat app listening at", port);
});
