<script lang="ts">
  import { CONVERSATION_MESSAGES } from "../../../messages";
  import Badge from "../../atomic/Badge/Badge.svelte";

  /** This can be either a chat title or
   * a list of chat participants that does
   * not include the current user. */
  export let chatLabel: string;
  export let message: string;
  export let unreadMessages: number;

  const oneLine = "overflow-hidden text-ellipsis whitespace-nowrap";
</script>

<div class="flex flex-col gap-2">
  <span class={`${oneLine} text-md font-medium text-neutral-600`}>{chatLabel}</span>
  <div class="flex min-w-0 justify-between gap-3">
    <p class={`${oneLine} text-sm`}>{message}</p>
    {#if unreadMessages > 0}
      <Badge label={CONVERSATION_MESSAGES.unreadMessages} num={unreadMessages} />
    {/if}
  </div>
</div>
