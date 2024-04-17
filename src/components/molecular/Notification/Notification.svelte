<script lang="ts">
  import CancelIcon from "@iconify/icons-iconoir/cancel";
  import Icon from "@iconify/svelte";
  import { onDestroy, onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import type { NotificationTypes } from "../../../types";
  import LoadOverlay from "../../atomic/LoadOverlay/LoadOverlay.svelte";
  export let type: NotificationTypes = "default";
  export let content: string;
  export let close: () => unknown;
  /** Passing 0 or Infinity will prevent notifications from being automatically dismissed. */
  export let lifespan: number = 5e3;
  export let action: (() => unknown) | undefined = undefined;

  let timeout: ReturnType<typeof setTimeout> | undefined;
  let active = false,
    isLoading = false;

  const colors = { default: "bg-emerald-500", failure: "bg-red-600", secondary: "bg-violet-500" };
  const handleClick = async () => {
    if (action && !isLoading) {
      clearTimeout(timeout);
      isLoading = true;
      await Promise.resolve(action());
      close();
    }
  };

  onMount(() => {
    if (lifespan !== 0 && lifespan !== Infinity) {
      timeout = setTimeout(() => {
        close();
      }, lifespan);
    }
  });
  onDestroy(() => {
    timeout && clearTimeout(timeout);
  });
</script>

<div
  out:fly={{ x: 50 }}
  class:active={active && !isLoading}
  class:disabled={isLoading}
  class={`wrapper relative flex h-[60px] max-h-[150px] w-[230px] select-none flex-col justify-center rounded-md ${
    colors[type]
  } bg-opacity-75 px-6 py-3 pl-4 text-xs text-white transition-all ${
    action
      ? "transition-all active:scale-[98%] [&.active]:scale-[98%] [&.disabled]:active:scale-100 [&.disabled]:[&.active]:scale-100"
      : ""
  }`}
  role="alert"
  aria-atomic="true"
  aria-live="assertive"
>
  <LoadOverlay {isLoading} --opacity="0.4" />
  <button
    on:click={() => close()}
    class="absolute -right-1 -top-1 z-10 cursor-pointer p-2 hover:text-neutral-500"
    title="Dismiss"
    ><Icon class="text-[15px]" icon={CancelIcon} />
  </button>
  <div>
    <button
      class={`${
        action ? "actionable cursor-pointer" : "cursor-default"
      } mr-2 mt-1 text-justify disabled:cursor-default`}
      on:click={handleClick}
      on:keydown={(ev) => {
        if (ev.key === "Enter") active = true;
      }}
      on:keyup={() => (active = false)}
      disabled={isLoading}
    >
      {#if content}
        <p class="line-clamp-3 text-left" title={content} in:fade>{content}</p>
      {/if}
    </button>
  </div>
</div>

<style>
  .wrapper {
    opacity: 0;
    filter: blur(10px);
    animation: appear 0.3s ease forwards;
  }

  .actionable {
    text-shadow: none;
    transition: text-shadow 0.33s ease;
  }
  .actionable:hover {
    text-shadow: 0px 0px 1px white;
  }

  @keyframes appear {
    to {
      filter: blur(0);
      opacity: 1;
    }
  }
</style>
