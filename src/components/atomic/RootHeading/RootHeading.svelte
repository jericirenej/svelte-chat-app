<script lang="ts">
  import chatIcon from "@iconify/icons-humbleicons/chat";
  import Icon from "@iconify/svelte";

  export let heading = "Chat App";
</script>

<div class="flex items-center gap-2">
  <h1 class=" text-5xl font-extralight uppercase text-sky-800">
    {heading}
  </h1>
  <div>
    <Icon icon={chatIcon} class="inline-block aspect-square text-5xl font-thin text-sky-700" />
  </div>
</div>
