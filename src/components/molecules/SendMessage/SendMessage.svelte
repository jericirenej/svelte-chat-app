<script context="module" lang="ts">
  export type SendOnInput = (() => unknown) | undefined;
  export type SendMessageHandler = (val: string) => Promise<boolean>;
</script>

<script lang="ts">
  import { fade } from "svelte/transition";
  import { CONVERSATION_MESSAGES } from "../../../messages";
  import SendIcon from "../../atoms/SendIcon/SendIcon.svelte";
  import TextArea from "../../atoms/TextArea/TextArea.svelte";
  export let sendMessage: SendMessageHandler;
  export let onInput: SendOnInput = undefined;
  export let value = "";

  let error = false;
  const handleInput = () => {
    error = false;
    if (onInput) onInput();
  };

  const handleSubmit = async () => {
    const response = await sendMessage(value);
    if (response) {
      value = "";
      error = false;
    } else {
      error = true;
    }
  };
</script>

<div class="relative flex flex-row items-end justify-between gap-3 pb-1">
  <TextArea
    placeholder={CONVERSATION_MESSAGES.textPlaceholder}
    bind:value
    onInput={handleInput}
    submitEvent={handleSubmit}
  />
  <span class="text-blue-600">
    <SendIcon disabled={!value.length} on:click={handleSubmit} />
  </span>
  {#if error}
    <small class="text absolute -bottom-5 left-1 text-red-600" transition:fade={{ duration: 150 }}
      >{CONVERSATION_MESSAGES.sendError}</small
    >
  {/if}
</div>
