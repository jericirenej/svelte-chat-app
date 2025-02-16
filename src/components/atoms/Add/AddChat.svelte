<script lang="ts">
  import AddIcon from "@iconify/icons-iconoir/chat-lines";
  import Icon from "@iconify/svelte";
  export let disabled = true;
  export let title: string;
  export let label: string;
  export let size: number = 25;
  $: sizePixels = `${size}px`;
</script>

<button
  class="flex cursor-pointer gap-2 hover:brightness-110"
  {disabled}
  {title}
  type="button"
  on:click
  on:pointerdown
>
  <span>{label}</span>
  <Icon
    icon={AddIcon}
    class="pointer-events-none text-current "
    width={sizePixels}
    height={sizePixels}
  />
</button>
