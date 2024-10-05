// See https://kit.svelte.dev/docs/types#app

import type { SocketServer } from "$lib/socket.types.js";
import type { CompleteUserDto } from "../db/index.js";
import type { ChatPreviewProp } from "./components/organic/ChatPreviewList/types.js";

// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      user?: CompleteUserDto;
      socketServer?: SocketServer;
      chats?: ChatPreviewProp[];
    }
    // interface PageData {}
    // interface Platform {}
  }
}

export {};
