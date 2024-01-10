// See https://kit.svelte.dev/docs/types#app

import type { SocketServer } from "$lib/socket.types.js";
import type { CompleteUserDto } from "../db/index.js";

// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      user?: CompleteUserDto;
      socketServer?: SocketServer;
    }
    // interface PageData {}
    // interface Platform {}
  }
}

export {};
