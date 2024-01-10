import { createSocketServer } from "./src/lib/server/socket.global";
import { handler } from "./build/handler";
import { createServer } from "node:http";
import express from "express";
const app = express();
app.use(handler);
const server = createServer(app);


const port = process.env["ORIGIN"]?.split(":")?.at(-1) ?? 3000;

createSocketServer(server);
server.listen(port, () => {
  console.log("Chat app listening at", process.env["ORIGIN"]);
});
