import { createSocketServer } from "./src/lib/server/socket";
import { handler } from "./build/handler";
import { createServer } from "node:http";
import express from "express";

const app = express();
app.use(handler);
const server = createServer(app);

const port = process.env["PORT"] || 3000;

createSocketServer(server);
server.listen(port, () => {
  console.log("Listening on port", port);
});
