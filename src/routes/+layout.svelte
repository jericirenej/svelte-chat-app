<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import { page } from "$app/stores";
  import { handleExtendCall, handleLogoutCall } from "$lib/client/session-handlers";
  import { socketClientSetup } from "$lib/client/socket.client";
  import { showSessionExpirationWarning, socket } from "$lib/client/stores";
  import { onMount } from "svelte";
  import { fly } from "svelte/transition";
  
  import "../app.css";
  import type { ExtendSessionStatus } from "../components/molecular/ExpireWarning/ExpireWarning.svelte";
  import ExpireWarning from "../components/molecular/ExpireWarning/ExpireWarning.svelte";
  import NavIcons from "../components/molecular/NavIcons/NavIcons.svelte";
  import {
    LOCAL_DISMISSED_EXPIRATION_WARNING,
    LOCAL_KEYS,
    LOCAL_SESSION_CSRF_KEY
  } from "../constants.js";
  import type { LayoutData } from "./$types";

  export let data: LayoutData;

  $: loggedIn = !!data.user;

  let extendSessionStatus: ExtendSessionStatus = undefined;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  $: status = extendSessionStatus;

  const closeSession = async () => {
    await handleLogoutCall();
    $showSessionExpirationWarning = false;
    await invalidateAll();
    void goto("/");
  };

  const dismissWarning = () => {
    localStorage.setItem(LOCAL_DISMISSED_EXPIRATION_WARNING, "true");
    showSessionExpirationWarning.set(false);
  };
  const extendSession = async () => {
    extendSessionStatus = await handleExtendCall($page.url.origin, data.user?.username);
    localStorage.setItem(LOCAL_DISMISSED_EXPIRATION_WARNING, "false");
    setTimeout(() => {
      $showSessionExpirationWarning = false;
      extendSessionStatus = undefined;
    }, 2000);
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
  <div class="app relative flex h-[95vh] w-[95vw] max-w-[1500px] rounded-md bg-white">
    <section
      transition:fly={{ duration: 300, y: -400 }}
      class={`sidebar h-full w-full rounded-s-[inherit] bg-slate-700 text-neutral-50 transition-max-width duration-300 ${
        loggedIn ? "min-w-[200px] max-w-[250px]" : "max-w-0"
      }`}
    >
      {#if loggedIn}
        <nav>
          <section>
            <NavIcons routeId={$page.route.id} handleLogout={closeSession} />
          </section>
        </nav>
      {:else}
        <nav></nav>
      {/if}
    </section>
    <slot />
    {#if $showSessionExpirationWarning}
      <div class="absolute right-3 top-3 z-10">
        <ExpireWarning {status} on:dismiss={dismissWarning} on:sessionExtend={extendSession} />
      </div>
    {/if}
  </div>
</div>
