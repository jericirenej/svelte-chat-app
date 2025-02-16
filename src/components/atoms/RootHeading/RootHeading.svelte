<script lang="ts">
  import { APP_NAME } from "../../../messages";
  import IconChat from "../IconChat/IconChat.svelte";

  export let heading = APP_NAME;
  export let showIcon = true;
</script>

<div class="inline-flex select-none gap-2">
  <h1 class="text-5xl font-light uppercase text-sky-800">
    {heading}
  </h1>
  {#if showIcon}
    <div class="inline-block aspect-square w-12 text-sky-800">
      <IconChat />
    </div>
  {/if}
</div>
