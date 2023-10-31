<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import { fly } from "svelte/transition";
  import "../app.css";
  import { CSRF_HEADER, LOCAL_SESSION_CSRF_KEY } from "../constants.js";
  import type { LayoutData } from "./$types";

  export let data: LayoutData;

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

{#if data?.user}
  <nav transition:fly={{ duration: 300, y: -400 }}>
    <ul>
      <li><a href="/">Homepage</a></li>
      <li><a href="/profile" data-sveltekit-preload-data="hover">Profile</a></li>
      <li><button type="button" on:click|preventDefault={handleLogout}>Logout</button></li>
    </ul>
  </nav>
{/if}
<slot />

<style lang="scss">
  nav {
    background-color: hsl(0deg, 0%, 10%);
    width: 100%;
    display: flex;
    align-items: center;
  }
  ul {
    height: 50px;
    width: 100%;
    list-style: none;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 5px;
    padding-block: 0.8rem;
    padding-right: 1rem;
    color: hsl(0deg, 0%, 85%);
    font-size: 13px;
  }

  li {
    width: 90px;
    text-align: center;
    & > * {
      display: inline-block;
      width: 100%;
      text-decoration: none;
      color: inherit;
      background-color: transparent;
      border: none;
      padding: 3px;
      cursor: pointer;
    }
    &:hover {
      color: black;
      background-color: hsla(0deg, 0%, 85%);
      border-radius: 3px;
      transition: all 0.2s ease;
    }
  }
</style>
