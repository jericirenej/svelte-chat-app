<script lang="ts">
  import { CONVERSATION_MESSAGES, PREVIEW_LIST_NO_MESSAGES } from "../../../messages";
  import Badge from "../../atomic/Badge/Badge.svelte";
  import DeleteButton from "../../atomic/DeleteButton/DeleteButton.svelte";

  export let chatLabel: string;
  export let message: string | undefined;
  export let labelOverride: string | undefined = undefined;
  export let unreadMessages: number;
  $: previewMessage = labelOverride ? labelOverride : message ?? PREVIEW_LIST_NO_MESSAGES;
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
    <h3
      class=" text-md inline-block w-11/12 overflow-hidden text-ellipsis whitespace-nowrap font-medium"
    >
      {chatLabel}
    </h3>
    <div class="flex min-w-0 justify-between gap-4">
      <p
        title={previewMessage}
        class="overflow-hidden text-ellipsis whitespace-nowrap text-sm"
        class:override={!!labelOverride}
      >
        {previewMessage}
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

<style lang="css">
  .override {
    opacity: 0.3;
    animation: strobe 0.5s alternate infinite;
  }

  @keyframes strobe {
    from {
      opacity: 0.45;
    }
    to {
      opacity: 0.75;
    }
  }
</style>
