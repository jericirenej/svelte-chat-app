<script context="module" lang="ts">
  export type WidthDimensions = Record<"min" | "max", string>;
</script>

<script lang="ts">
  import { onMount } from "svelte";

  import { CONVERSATION_MESSAGES } from "../../../messages";
  import type { UnreadChatMessages, UsersTyping } from "../../../types";
  import NavIcons from "../../molecular/NavIcons/NavIcons.svelte";
  import ChatPreviewList from "../../organic/ChatPreviewList/ChatPreviewList.svelte";
  import type { ChatPreviewProp } from "../../organic/ChatPreviewList/types";
  import Dialog from "../../organic/Dialog/Dialog.svelte";
  import { debounce } from "$lib/utils";

  export let chatPreviewList: ChatPreviewProp[];
  export let chatUnreadList: UnreadChatMessages;
  export let usersTyping: UsersTyping;
  export let routeId: string | null;

  export let onActivateHandler: (chatId: string) => void;
  export let handleLogout: () => Promise<void>;
  export let handleChatDelete: (chatId: string) => Promise<void>;
  let showLeaveChatDialog = false,
    leaveChatTarget: string | null = null,
    previewRef: HTMLDivElement | undefined,
    chatTransparencyMask = true;

  const showDialogForChatLeave = (chatId: string) => {
    leaveChatTarget = chatId;
    showLeaveChatDialog = true;
  };
  const handleScroll = debounce(() => {
    if (!previewRef) return;
    chatTransparencyMask =
      previewRef.scrollTop + previewRef.clientHeight !== previewRef.scrollHeight;
  }, 30);
  onMount(() => {
    handleScroll();
  });
</script>

<svelte:window on:resize={handleScroll} />
<div
  class="sidebar h-full w-full rounded-s-md bg-slate-700 text-neutral-50 transition-max-width duration-500"
  style:min-width="350px"
  style:max-width="max(500px, 25%)"
>
  <nav>
    <NavIcons {routeId} {handleLogout} />
  </nav>
  {#if chatPreviewList.length}
    <div
      bind:this={previewRef}
      class="mt-5 max-h-[75%] overflow-y-auto bg-slate-700"
      class:chat-previews={chatTransparencyMask}
      on:scroll={handleScroll}
    >
      <ChatPreviewList
        {chatPreviewList}
        {chatUnreadList}
        {usersTyping}
        onActive={onActivateHandler}
        onDelete={showDialogForChatLeave}
        {routeId}
      />
    </div>
    <div class="pb-10"></div>
  {/if}
</div>

<Dialog
  bind:open={showLeaveChatDialog}
  confirmAction={async () => {
    if (leaveChatTarget) {
      await handleChatDelete(leaveChatTarget);
      leaveChatTarget = null;
    }
  }}
>
  <h1 class="mb-3 text-center text-lg font-semibold">
    {CONVERSATION_MESSAGES.leaveChat}
  </h1>
  <p>
    {CONVERSATION_MESSAGES.leaveChatMessage}
  </p>
</Dialog>

<style lang="css">
  .chat-previews {
    mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
  }
</style>
