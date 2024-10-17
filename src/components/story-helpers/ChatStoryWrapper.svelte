<script lang="ts">
  import Button from "../atomic/Button/Button.svelte";
  import type { ContainerProps } from "./messageHelpers";
  export let container: ContainerProps;
  export let handleAdd: () => unknown;
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
    <Button
      customClasses="ml-auto"
      action="info"
      display="inline-block"
      variant="outline"
      size="sm"
      on:click={handleAdd}>Add message</Button
    >
  </div>
</div>
