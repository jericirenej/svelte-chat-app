<script lang="ts">
  import { CONVERSATION_MESSAGES } from "../../../messages";
  import Badge from "../../atomic/Badge/Badge.svelte";
  import DeleteButton from "../../atomic/DeleteButton/DeleteButton.svelte";

  /** This can be either a chat title or
   * a list of chat participants that does
   * not include the current user. */
  export let chatLabel: string;
  export let message: string;
  export let unreadMessages: number;
  export let onDelete: () => unknown;
</script>

<div class="relative">
  <div
    class="flex select-none flex-col gap-2"
    on:click
    on:pointerdown
    on:keydown
    role="button"
    tabindex="0"
  >
    <span
      class=" text-md inline-block w-11/12 overflow-hidden text-ellipsis whitespace-nowrap font-medium"
      >{chatLabel}</span
    >
    <div class="flex min-w-0 justify-between gap-4">
      <p title={message} class="test-sm overflow-hidden text-ellipsis whitespace-nowrap">
        {message}
      </p>
      {#if unreadMessages > 0}
        <Badge label={CONVERSATION_MESSAGES.unreadMessages} num={unreadMessages} />
      {/if}
    </div>
  </div>
  <div class="absolute right-0 top-[2px]">
    <DeleteButton label={CONVERSATION_MESSAGES.leaveChat} on:click={onDelete} />
  </div>
</div>
