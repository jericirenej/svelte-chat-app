<script lang="ts">
  import { fade } from "svelte/transition";

  export let text: string | undefined = undefined;
  let prevAndCurrent: [string | undefined, string | undefined] = [undefined, undefined];
  const reconfigure = (current: string | undefined) => {
    prevAndCurrent = [prevAndCurrent[1], current];
  };

  $: reconfigure(text);
</script>

{#if text !== undefined}
  <div class="relative">
    <span class="invisible">{text}</span>
    {#key text}
      {#if prevAndCurrent[0]}
        <span aria-hidden class="previous-entry absolute left-0 top-0">{prevAndCurrent[0]}</span>
      {/if}
      <p class="absolute left-0 top-0" in:fade={{ duration: 200 }}>{prevAndCurrent[1]}</p>
    {/key}
  </div>
{/if}

<style>
  .previous-entry {
    opacity: 1;
    animation: disappear 300ms forwards;
  }

  @keyframes disappear {
    to {
      opacity: 0;
    }
  }
</style>
