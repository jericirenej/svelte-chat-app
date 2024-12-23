<script lang="ts">
  import clsx from "clsx";
  import { fade } from "svelte/transition";
  export let alignment: "center" | "left";
  export let success: boolean;
  export let messages: string[];

  $: wrapperClass = clsx(
    "top-100 absolute left-0 flex w-full select-none flex-col gap-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm",
    [
      alignment === "center" ? "text-center" : "text-left",
      success ? "text-emerald-600" : "text-red-600"
    ]
  );
</script>

<div transition:fade={{ duration: 150 }} class={wrapperClass}>
  {#each messages as message}
    <small title={message}>{message}</small>
  {/each}
</div>
