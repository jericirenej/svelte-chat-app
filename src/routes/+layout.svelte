<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import { page } from "$app/stores";
  import { fly } from "svelte/transition";
  import "../app.css";
  import { getContext } from "svelte";
  import NavIcons from "../components/molecular/NavIcons/NavIcons.svelte";
  import { CSRF_HEADER, LOCAL_SESSION_CSRF_KEY } from "../constants.js";
  import type { LayoutData } from "./$types";
  import type { ClientToServerEvents, ServerToClientEvents } from "$lib/types";
  import { socket } from "$lib/client/socket-store";

  export let data: LayoutData;

  $: loggedIn = !!data.user;

  const handleLogout = async () => {
    const csrf = localStorage.getItem(LOCAL_SESSION_CSRF_KEY);
    if (!csrf) return;
    localStorage.removeItem(LOCAL_SESSION_CSRF_KEY);
    await fetch("/logout", {
      method: "DELETE",
      headers: {
        [CSRF_HEADER]: csrf
      }
    });
    
    $socket?.disconnect()
    await invalidateAll();
    goto("/");
  };
</script>

<div
  class="app-background flex h-screen w-screen items-center justify-center overflow-hidden bg-neutral-400"
>
  <div class="app flex h-[95vh] w-[95vw] max-w-[1500px] rounded-md bg-white">
    <section
      transition:fly={{ duration: 300, y: -400 }}
      class={`sidebar h-full w-full rounded-s-[inherit] bg-slate-700 text-neutral-50 transition-max-width duration-300 ${
        loggedIn ? "min-w-[200px] max-w-[250px]" : "max-w-0"
      }`}
    >
      {#if loggedIn}
        <nav>
          <section>
            <NavIcons routeId={$page.route.id} {handleLogout} />
          </section>
        </nav>
      {:else}
        <nav></nav>
      {/if}
    </section>
    <slot />
  </div>
</div>
