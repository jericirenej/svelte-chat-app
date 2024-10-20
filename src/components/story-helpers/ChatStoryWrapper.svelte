<script lang="ts">
  import Button from "../atomic/Button/Button.svelte";
  import type { ContainerProps } from "./messageHelpers";
  export let container: ContainerProps;
  export let handleAdd: () => unknown;
  export let resetMessage: (() => void) | undefined = undefined;
</script>

<div class="flex flex-col gap-2">
  <div
    style:width={`${container.containerWidth}%`}
    style:height={`${container.containerHeight}px`}
    class="rounded-md border-4 border-dashed"
  >
    <slot />
  </div>
  <div style:width={`${container.containerWidth}%`} class="flex justify-end">
    {#if resetMessage}
      <Button
        customClasses="ml-auto mr-3"
        action="info"
        display="inline-block"
        variant="outline"
        size="sm"
        on:click={resetMessage}>Reset text</Button
      >
    {/if}
    <Button action="info" display="inline-block" variant="outline" size="sm" on:click={handleAdd}
      >Add message</Button
    >
  </div>
</div>
