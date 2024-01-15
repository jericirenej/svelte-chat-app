<script context="module" lang="ts">
  export type ExtendSessionStatus = "fail" | "success" | undefined;
</script>

<script lang="ts">
  import Icon from "@iconify/svelte";
  import CancelIcon from "@iconify/icons-iconoir/cancel";
  import { fade, fly } from "svelte/transition";
  import { createEventDispatcher } from "svelte";
  import { EXPIRATION_MESSAGES } from "../../../constants";

  export let status: ExtendSessionStatus = undefined;

  const dispatch = createEventDispatcher();

  const getMessage = (): string => {
    if (!status) return EXPIRATION_MESSAGES.initial;
    return EXPIRATION_MESSAGES[status];
  };

  $: toastColor = status === "fail" ? "bg-red-600" : "bg-emerald-500";
</script>

<div
  out:fly={{ x: 50 }}
  class={`wrapper relative flex h-[60px] w-[230px] select-none flex-col justify-center rounded-md ${toastColor} whitespace-pre bg-opacity-75 px-6 py-3 pl-4 text-xs text-white transition-all`}
>
  <button
    on:click={() => dispatch("dismiss")}
    class="absolute right-1 top-1 cursor-pointer p-2 hover:text-neutral-500"
    title="Dismiss"
    ><Icon class="text-[15px]" icon={CancelIcon} />
  </button>
  <div>
    <button
      disabled={status === "fail"}
      on:click={() => dispatch("sessionExtend")}
      class={`${status === undefined ? "extend cursor-pointer" : "cursor-default"} text-justify`}
    >
      {#key status}
        <p in:fade>
          {getMessage()}
        </p>
      {/key}
    </button>
  </div>
</div>

<style>
  .wrapper {
    opacity: 0;
    filter: blur(10px);
    animation: appear 0.3s ease forwards;
  }

  .extend {
    text-shadow: none;
    transition: text-shadow 0.33s ease;
  }
  .extend:hover {
    text-shadow: 0px 0px 1px white;
  }

  @keyframes appear {
    to {
      filter: blur(0);
      opacity: 1;
    }
  }
</style>
