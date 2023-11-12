<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import { fly } from "svelte/transition";
  import "../app.css";
  import { CSRF_HEADER, LOCAL_SESSION_CSRF_KEY } from "../constants.js";
  import type { LayoutData } from "./$types";

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
    await invalidateAll();
    goto("/");
  };
</script>

<div class="app-background flex h-screen w-screen items-center justify-center bg-neutral-400">
  <div class="app flex h-[95vh] w-[95vw] max-w-[1500px] rounded-md bg-white">
    <section
      transition:fly={{ duration: 300, y: -400 }}
      class={`sidebar transition-max-width h-full w-full rounded-s-[inherit] bg-slate-700 text-neutral-50 duration-300 ${
        loggedIn ? "max-w-[250px] pl-2 pr-5" : "max-w-0"
      }`}
    >
      {#if loggedIn}
        <nav>
          <section>
            <ul>
              <li><a href="/">Homepage</a></li>
              <li><a href="/profile" data-sveltekit-preload-data="hover">Profile</a></li>
              <li><button type="button" on:click|preventDefault={handleLogout}>Logout</button></li>
            </ul>
          </section>
        </nav>
      {:else}
        <nav></nav>
      {/if}
    </section>
    <slot />
  </div>
</div>
