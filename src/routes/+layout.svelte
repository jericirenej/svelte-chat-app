<script lang="ts">
  import { page } from "$app/stores";
  import { handleLogoutCall } from "$lib/client/session-handlers";
  import { socketClientSetup } from "$lib/client/socket.client";
  import { notificationStore, showSessionExpirationWarning, socket } from "$lib/client/stores";
  import { onMount } from "svelte";
  import { fly, fade } from "svelte/transition";

  import "../app.css";

  import NavIcons from "../components/molecular/NavIcons/NavIcons.svelte";
  import NotificationWrapper from "../components/molecular/wrappers/NotificationWrapper/NotificationWrapper.svelte";
  import { LOCAL_KEYS, LOCAL_SESSION_CSRF_KEY } from "../constants.js";
  import type { LayoutData } from "./$types";

  export let data: LayoutData;
  let minWidth: string, maxWidth: string;
  const setWidth = (loggedIn: boolean) => {
    if (loggedIn) {
      maxWidth = "300px";
      setTimeout(() => {
        minWidth = "250px";
      }, 300);
      return;
    }
    minWidth = "0px";
    maxWidth = "0px";
  };

  $: setWidth(!!data.user);

  const closeSession = async () => {
    await handleLogoutCall();
    $showSessionExpirationWarning = false;
  };

  onMount(() => {
    if (!data.user) {
      LOCAL_KEYS.forEach((key) => {
        localStorage.removeItem(key);
      });
      return;
    }
    const csrf = localStorage.getItem(LOCAL_SESSION_CSRF_KEY);
    if (!csrf) return;
    socket.set(socketClientSetup($page.url.origin, csrf));
  });
</script>

<div class="flex h-screen w-screen items-center justify-center overflow-hidden bg-neutral-400">
  <div
    class="app relative flex h-[95vh] w-[95vw] max-w-[1500px] overflow-y-auto rounded-md bg-white"
  >
    <section
      transition:fly={{ duration: 300, y: -400 }}
      class="sidebar h-full w-full rounded-s-[inherit] bg-slate-700 text-neutral-50 transition-max-width duration-500"
      style:min-width={minWidth}
      style:max-width={maxWidth}
    >
      {#if data.user}
        <nav>
          <section in:fade>
            <NavIcons routeId={$page.route.id} handleLogout={closeSession} />
          </section>
        </nav>
      {:else}
        <nav></nav>
      {/if}
    </section>
    <slot />

    <div class="absolute right-3 top-3 z-10">
      <NotificationWrapper notifications={notificationStore} lifespan={3000} />
    </div>
  </div>
</div>
