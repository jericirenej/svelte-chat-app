<script lang="ts">
  export let disabled = true;
  import SendIcon from "@iconify/icons-iconoir/send";
  import Icon from "@iconify/svelte";
  import { CONVERSATION_MESSAGES } from "../../../messages";

  $: title = disabled ? CONVERSATION_MESSAGES.sendEmpty : CONVERSATION_MESSAGES.send;
</script>

<button
  on:click
  {title}
  {disabled}
  class="cursor-pointer rounded-full p-2 transition-shadow hover:bg-neutral-100 hover:shadow-md disabled:cursor-default"
>
  <Icon icon={SendIcon} class="text-[25px] text-inherit" />
</button>
