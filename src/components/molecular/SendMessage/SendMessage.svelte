<script context="module" lang="ts">
  export type SendOnInput = (() => unknown) | undefined;
  export type SendMessageHandler = (val: string) => Promise<boolean>;
</script>

<script lang="ts">
  import { fade } from "svelte/transition";
  import { CONVERSATION_MESSAGES } from "../../../messages";
  import SendIcon from "../../atomic/SendIcon/SendIcon.svelte";
  import TextArea from "../../atomic/TextArea/TextArea.svelte";
  export let sendMessage: SendMessageHandler;
  export let onInput: SendOnInput = undefined;
  let value = "";

  let error = false;
  const handleInput = () => {
    error = false;
    onInput && onInput();
  };

  const handleClick = async () => {
    const response = await sendMessage(value);
    if (response) {
      value = "";
      error = false;
    } else {
      error = true;
    }
  };
</script>

<div class="relative flex flex-row items-end justify-between gap-3">
  <TextArea placeholder={CONVERSATION_MESSAGES.textPlaceholder} bind:value onInput={handleInput} />
  <span class="text-blue-600">
    <SendIcon disabled={!value.length} on:click={handleClick} />
  </span>
  {#if error}
    <small class="text absolute -bottom-5 left-1 text-red-600" transition:fade={{ duration: 150 }}
      >{CONVERSATION_MESSAGES.sendError}</small
    >
  {/if}
</div>
