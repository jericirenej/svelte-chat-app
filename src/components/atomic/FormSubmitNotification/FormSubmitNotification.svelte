<script lang="ts">
  import { fade } from "svelte/transition";

  export let status: "success" | "error" | undefined = undefined;
  export let message: string | undefined = undefined;
  $: show = !!(status && message);
</script>

{#if show}
  <small
    transition:fade={{ duration: 150 }}
    class={`
absolute bottom-0 w-[100%]
whitespace-nowrap
text-center
text-xs
${status === "success" ? "text-emerald-500" : "text-red-600"}
`}>{message}</small
  >
{/if}
