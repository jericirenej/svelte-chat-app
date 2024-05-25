<script lang="ts">
  export let disabled = true;
  let ref: HTMLButtonElement;
  import SendIcon from "@iconify/icons-iconoir/send";
  import Icon from "@iconify/svelte";
  import { CONVERSATION_MESSAGES } from "../../../messages";

  $: title = disabled ? CONVERSATION_MESSAGES.sendEmpty : CONVERSATION_MESSAGES.send;
</script>

<button
  bind:this={ref}
  on:click
  on:pointerdown
  {title}
  {disabled}
  class="cursor-pointer rounded-full p-2 transition-shadow hover:bg-neutral-100 hover:shadow-md active:scale-95 active:bg-neutral-100 active:shadow-md active:brightness-95 disabled:scale-100 disabled:cursor-default disabled:bg-transparent disabled:text-gray-500 disabled:shadow-none"
>
  <Icon icon={SendIcon} class="text-[28px] text-current" />
</button>
