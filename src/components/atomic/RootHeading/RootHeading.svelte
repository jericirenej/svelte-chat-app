<script lang="ts">
  import chatIcon from "@iconify/icons-humbleicons/chat";
  import Icon from "@iconify/svelte";
  import { APP_NAME } from "../../../messages";

  export let heading = APP_NAME;
  export let showIcon = true;
</script>

<div class="inline-flex select-none gap-2">
  <h1 class="text-5xl font-extralight uppercase text-sky-800">
    {heading}
  </h1>
  {#if showIcon}
    <div>
      <Icon icon={chatIcon} class="inline-block aspect-square text-5xl font-thin text-sky-800" />
    </div>
  {/if}
</div>
