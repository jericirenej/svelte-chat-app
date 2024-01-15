<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import { page } from "$app/stores";
  import { socketClientSetup } from "$lib/client/socket.client";
  import { socket, showSessionExpirationWarning } from "$lib/client/stores";
  import { fly, type CrossfadeParams } from "svelte/transition";
  import "../app.css";
  import NavIcons from "../components/molecular/NavIcons/NavIcons.svelte";
  import {
    CSRF_HEADER,
    LOCAL_SESSION_CSRF_KEY,
    LOCAL_DISMISSED_EXPIRATION_WARNING,
    LOCAL_KEYS
  } from "../constants.js";
  import type { LayoutData } from "./$types";
  import { onMount } from "svelte";
  import ExpireWarning from "../components/molecular/ExpireWarning/ExpireWarning.svelte";
  import type { ExtendSessionStatus } from "../components/molecular/ExpireWarning/ExpireWarning.svelte";

  export let data: LayoutData;

  $: loggedIn = !!data.user;

  let extendSessionStatus: ExtendSessionStatus = undefined;
  $: status = extendSessionStatus;

  const handleAPICall = async (action: "logout" | "extend"): Promise<Response | undefined> => {
    const url = action === "logout" ? "/logout" : "/api/extend",
      method = action === "logout" ? "DELETE" : "POST";
    const csrf = localStorage.getItem(LOCAL_SESSION_CSRF_KEY);
    if (!csrf) return undefined;
    return await fetch(url, {
      method,
      headers: { [CSRF_HEADER]: csrf }
    });
  };

  const handleLogout = async () => {
    await handleAPICall("logout");
    LOCAL_KEYS.forEach((key) => localStorage.removeItem(key));
    $showSessionExpirationWarning = false;
    socket.set(undefined);
    await invalidateAll();
    goto("/");
  };

  const handleWarningDismiss = () => {
    localStorage.setItem(LOCAL_DISMISSED_EXPIRATION_WARNING, "true");
    showSessionExpirationWarning.set(false);
  };
  const handleExtend = async () => {
    const response = await handleAPICall("extend");
    if (response?.status === 201) {
      const parsed = (await response.json()) as Record<"csrf", string>;
      localStorage.setItem(LOCAL_SESSION_CSRF_KEY, parsed.csrf);
      if ($socket) {
        socketClientSetup($page.url.origin, parsed.csrf, data?.user?.username);
      }
      extendSessionStatus = "success" satisfies ExtendSessionStatus;
    } else {
      extendSessionStatus = "fail" satisfies ExtendSessionStatus;
    }
    localStorage.setItem(LOCAL_DISMISSED_EXPIRATION_WARNING, "false");
    setTimeout(() => {
      $showSessionExpirationWarning = false;
      extendSessionStatus = undefined;
    }, 2000);
  };

  onMount(async () => {
    if (!data.user) {
      return LOCAL_KEYS.forEach((key) => {
        localStorage.removeItem(key);
      });
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
            <NavIcons routeId={$page.route.id} {handleLogout} />
          </section>
        </nav>
      {:else}
        <nav></nav>
      {/if}
    </section>
    <slot />
    {#if $showSessionExpirationWarning}
      <div class="absolute right-3 top-3 z-10">
        <ExpireWarning {status} on:dismiss={handleWarningDismiss} on:sessionExtend={handleExtend} />
      </div>
    {/if}
  </div>
</div>
