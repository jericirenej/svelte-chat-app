<script lang="ts">
  import AddIcon from "@iconify/icons-iconoir/chat-lines";
  import Icon from "@iconify/svelte";
  export let disabled = true;
  export let title: string;
  export let size: number = 25;
  $: sizePixels = `${size}px`;
</script>

<button {disabled} {title} on:click on:pointerdown class="cursor-pointer">
  <Icon
    icon={AddIcon}
    class="pointer-events-none text-current"
    width={sizePixels}
    height={sizePixels}
  />
</button>
